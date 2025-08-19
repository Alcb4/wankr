import { NextRequest, NextResponse } from 'next/server'
import { LeaderboardService } from '../../../../server/services/leaderboardService'

export async function GET(
  request: NextRequest,
  { params }: { params: { period: string } }
) {
  try {
    const period = params.period || 'all'
    const leaderboardService = new LeaderboardService()
    const result = await leaderboardService.getLeaderboards(period)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching leaderboards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboards' },
      { status: 500 }
    )
  }
}
