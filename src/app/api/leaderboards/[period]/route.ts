import { NextRequest, NextResponse } from 'next/server'
import { LeaderboardService } from '../../../../server/services/leaderboardService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ period: string }> }
) {
  try {
    const { period } = await params
    const leaderboardService = new LeaderboardService()
    const result = await leaderboardService.getLeaderboards(period as 'all' | 'week' | 'day')
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching leaderboards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboards' },
      { status: 500 }
    )
  }
}
