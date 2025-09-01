import { NextRequest, NextResponse } from 'next/server'
import { DuneService } from '@/server/services/duneService'
import { shameScoreService } from '@/app/services/shameScoreService'
import { HandleResolutionService } from '@/server/services/handleResolutionService'
import { CheckRegisterService } from '@/server/services/checkRegister'
import { RegisterService } from '@/server/services/register'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params
    
    if (!address || address === 'undefined') {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      )
    }

    console.log(`📊 Fetching stats for address: ${address}`)

    const duneService = new DuneService()
    const registerService = new RegisterService()
    const handleResolver = new HandleResolutionService(
      new CheckRegisterService(registerService),
      registerService
    )
    
    // Resolve user's handle first
    console.log(`🔍 Resolving handle for address: ${address}`)
    const handleResolution = await handleResolver.resolveHandle(address)
    
    // Try to get pre-calculated stats first (more efficient)
    console.log(`📊 Fetching pre-calculated stats for ${address}`)
    const preCalculatedStats = await duneService.getUserStats(address)
    
    if (preCalculatedStats) {
      console.log(`✅ Found pre-calculated stats for ${address}:`, preCalculatedStats)
      
      // Transform Dune stats to our format
      const userStats = {
        address: address.toLowerCase(),
        handle: handleResolution.handle || null,
        displayName: handleResolution.displayName,
        handleSource: handleResolution.source,
        shameScore: shameScoreService.calculateShameScoreFromStats(preCalculatedStats),
        verificationLevel: shameScoreService.getVerificationLevelFromStats(preCalculatedStats),
        shameFreeStreak: parseInt(preCalculatedStats.shame_free_days as string) || 0,
        totalShamesSent: parseInt(preCalculatedStats.shames_sent as string) || 0,
        totalShamesReceived: parseInt(preCalculatedStats.shames_received as string) || 0,
        wankrSent: Math.round(parseFloat((preCalculatedStats.total_wankr_sent as string) || '0')),
        wankrReceived: Math.round(parseFloat((preCalculatedStats.total_wankr_received as string) || '0')),
        lastActivity: preCalculatedStats.last_activity ? shameScoreService.formatLastActivity(new Date(preCalculatedStats.last_activity as string).getTime()) : 'Never',
        verificationBadge: shameScoreService.getVerificationBadgeFromStats(preCalculatedStats),
        transactionCount: parseInt(preCalculatedStats.total_transactions as string) || 0,
        uniqueShamers: parseInt(preCalculatedStats.unique_shamers as string) || 0,
        averageShamerReputation: shameScoreService.calculateAverageShamerReputationFromStats(preCalculatedStats),
        recentShameActivity: parseInt(preCalculatedStats.recent_shames_received as string) || 0
      }

      console.log(`✅ Stats calculated for ${address}:`, {
        shameScore: userStats.shameScore,
        transactions: userStats.transactionCount,
        sent: userStats.totalShamesSent,
        received: userStats.totalShamesReceived,
        handle: userStats.handle,
        displayName: userStats.displayName
      })

      return NextResponse.json(userStats)
    }
    
    // Fallback to transaction-based calculation if pre-calculated stats not available
    console.log(`📊 Falling back to transaction-based calculation for ${address}`)
    
    const transactions = await duneService.getUserTransactions(address)
    
    // If no transactions found, return empty stats
    if (!transactions || transactions.length === 0) {
      const emptyStats = {
        address: address.toLowerCase(),
        handle: handleResolution.handle || null,
        displayName: handleResolution.displayName,
        handleSource: handleResolution.source,
        shameScore: 0,
        verificationLevel: 'Unverified',
        shameFreeStreak: 0,
        totalShamesSent: 0,
        totalShamesReceived: 0,
        wankrSent: 0,
        wankrReceived: 0,
        lastActivity: 'Never',
        verificationBadge: false,
        transactionCount: 0,
        uniqueShamers: 0,
        averageShamerReputation: 0,
        recentShameActivity: 0
      }
      
      return NextResponse.json(emptyStats)
    }

    // Transform Dune data to match our transaction format
    const formattedTransactions = transactions.map((tx: { from?: string; to?: string; wankr_amount?: number; evt_block_time?: string; evt_tx_hash?: string; direction?: string }) => ({
      from: tx.from?.toLowerCase() || '',
      to: tx.to?.toLowerCase() || '',
      amount: tx.wankr_amount ? tx.wankr_amount.toString() : '0',
      timestamp: tx.evt_block_time ? new Date(tx.evt_block_time).getTime() : Date.now(),
      transactionHash: tx.evt_tx_hash || ''
    }))

    // Calculate last sent activity separately
    const sentTransactions = formattedTransactions.filter(tx => tx.from.toLowerCase() === address.toLowerCase())
    const lastSentActivity = sentTransactions.length > 0 
      ? Math.max(...sentTransactions.map(tx => tx.timestamp))
      : 0

    // Calculate stats using the shame score service
    const accountCreatedAt = Date.now() - (365 * 24 * 60 * 60 * 1000) // Assume 1 year ago
    const stats = shameScoreService.calculateUserStats(
      address.toLowerCase(),
      formattedTransactions,
      accountCreatedAt,
      true
    )

    // Get verification level and badge
    const verificationLevel = shameScoreService.getVerificationLevel(stats.shameScore)
    const verificationBadge = shameScoreService.getVerificationBadge(stats.shameScore, stats.accountAgeDays)

    const userStats = {
      address: address.toLowerCase(),
      handle: handleResolution.handle || null,
      displayName: handleResolution.displayName,
      handleSource: handleResolution.source,
      shameScore: stats.shameScore,
      verificationLevel,
      shameFreeStreak: stats.shameFreeStreak,
      totalShamesSent: stats.totalShamesSent,
      totalShamesReceived: stats.totalShamesReceived,
      wankrSent: Math.round(parseFloat(stats.totalWankrSent)),
      wankrReceived: Math.round(parseFloat(stats.totalWankrReceived)),
      lastActivity: shameScoreService.formatLastActivity(stats.lastActivity),
      lastSentActivity: lastSentActivity > 0 ? shameScoreService.formatLastActivity(lastSentActivity) : 'Never',
      verificationBadge,
      transactionCount: formattedTransactions.length,
      uniqueShamers: stats.uniqueShamers,
      averageShamerReputation: stats.averageShamerReputation,
      recentShameActivity: stats.recentShameActivity
    }

    console.log(`✅ Stats calculated for ${address}:`, {
      shameScore: userStats.shameScore,
      transactions: userStats.transactionCount,
      sent: userStats.totalShamesSent,
      received: userStats.totalShamesReceived,
      handle: userStats.handle,
      displayName: userStats.displayName
    })

    return NextResponse.json(userStats)

  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    )
  }
}
