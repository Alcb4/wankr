import { NextRequest, NextResponse } from 'next/server'
import { duneUpvoteService } from '../../../../server/services/duneUpvoteService'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    console.log('🔍 Fetching upvote data from Dune...')

    if (startDate && endDate) {
      // Get data for specific date range
      const data = await duneUpvoteService.getUpvotesForDateRange(startDate, endDate)
      
      return NextResponse.json({
        success: true,
        data,
        startDate,
        endDate,
        timestamp: Date.now()
      })
    } else {
      // Get all cumulative data
      const data = await duneUpvoteService.getCumulativeUpvotes()
      
      return NextResponse.json({
        success: true,
        data: data.data,
        lastUpdated: data.lastUpdated,
        timestamp: Date.now()
      })
    }

  } catch (error) {
    console.error('❌ Error in dune/upvotes API:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch upvote data from Dune',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
