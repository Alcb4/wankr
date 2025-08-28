import { NextRequest, NextResponse } from 'next/server'
import { DuneService } from '@/server/services/duneService'
import { shameScoreService } from '@/app/services/shameScoreService'

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
    
    // Always use transaction-based calculation for accurate real-time data
    console.log(`📊 Calculating stats from transaction data for ${address}`)
    
    const transactions = await duneService.getUserTransactions(address)
    
    // If no transactions found, return empty stats
    if (!transactions || transactions.length === 0) {
      const emptyStats = {
        address: address.toLowerCase(),
        handle: null,
        shameScore: 0,
        verificationLevel: 'Unverified',
        shameFreeStreak: 0,
        totalShamesSent: 0,
        totalShamesReceived: 0,
        wankrSent: 0,
        wankrReceived: 0,
        lastActivity: 'Never',
        verificationBadge: false,
        checkInStreak: 0,
        totalCheckIns: 0,
        lastCheckIn: null,
        canCheckIn: true,
        timeUntilNextCheckIn: 'Available now',
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

    // Get check-in info (for now, use localStorage or default values)
    const checkInStreak = 0 // TODO: Implement check-in system
    const totalCheckIns = 0
    const lastCheckIn = null
    const canCheckIn = true
    const timeUntilNextCheckIn = 'Available now'

    const userStats = {
      address: address.toLowerCase(),
      handle: null, // TODO: Resolve handle from address
      shameScore: stats.shameScore,
      verificationLevel,
      shameFreeStreak: stats.shameFreeStreak,
      totalShamesSent: stats.totalShamesSent,
      totalShamesReceived: stats.totalShamesReceived,
      wankrSent: stats.totalWankrSent,
      wankrReceived: stats.totalWankrReceived,
      lastActivity: shameScoreService.formatLastActivity(stats.lastActivity),
      verificationBadge,
      checkInStreak,
      totalCheckIns,
      lastCheckIn,
      canCheckIn,
      timeUntilNextCheckIn,
      transactionCount: formattedTransactions.length,
      uniqueShamers: stats.uniqueShamers,
      averageShamerReputation: stats.averageShamerReputation,
      recentShameActivity: stats.recentShameActivity
    }

    console.log(`✅ Stats calculated for ${address}:`, {
      shameScore: userStats.shameScore,
      transactions: userStats.transactionCount,
      sent: userStats.totalShamesSent,
      received: userStats.totalShamesReceived
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
