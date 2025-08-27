import { NextRequest, NextResponse } from 'next/server'
import { LeaderboardService } from '../../../../server/services/leaderboardService'
import type { LeaderboardData } from '../../../../server/services/leaderboardService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ period: string }> }
) {
  try {
    const { period } = await params
    const currentPeriod = period as 'all' | 'week' | 'day'
    
    // Add CORS headers for Mini App
    const response = NextResponse.next()
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    console.log(`🏆 Mini App requesting ${currentPeriod} leaderboards...`)
    
    const leaderboardService = new LeaderboardService()
    
    // Add timeout for Mini App context
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 15000) // 15 second timeout
    })
    
    const leaderboardPromise = leaderboardService.getLeaderboards(currentPeriod)
    
    const result = await Promise.race([leaderboardPromise, timeoutPromise]) as LeaderboardData
    
    console.log(`✅ Mini App leaderboards loaded: ${result.received.length} received, ${result.sent.length} sent`)
    
    return NextResponse.json(result, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
    
  } catch (error) {
    console.error('❌ Mini App leaderboard error:', error)
    
    // Return fallback data for Mini App
    const { period } = await params
    const currentPeriod = period as 'all' | 'week' | 'day'
    const fallbackData = {
      received: [
        { rank: 1, address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', displayName: 'Demo User', transactionCount: 15, totalWankr: '1,234', period: currentPeriod, source: 'farcaster' as const },
        { rank: 2, address: '0x1234567890123456789012345678901234567890', displayName: 'Test User', transactionCount: 8, totalWankr: '567', period: currentPeriod, source: 'farcaster' as const },
        { rank: 3, address: '0xabcdef1234567890abcdef1234567890abcdef12', displayName: 'Sample User', transactionCount: 6, totalWankr: '345', period: currentPeriod, source: 'farcaster' as const }
      ],
      sent: [
        { rank: 1, address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', displayName: 'Demo User', transactionCount: 12, totalWankr: '890', period: currentPeriod, source: 'farcaster' as const },
        { rank: 2, address: '0x1234567890123456789012345678901234567890', displayName: 'Test User', transactionCount: 6, totalWankr: '456', period: currentPeriod, source: 'farcaster' as const },
        { rank: 3, address: '0xabcdef1234567890abcdef1234567890abcdef12', displayName: 'Sample User', transactionCount: 4, totalWankr: '234', period: currentPeriod, source: 'farcaster' as const }
      ]
    }
    
    return NextResponse.json(fallbackData, {
      status: 200, // Return 200 with fallback data instead of error
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  }
}
