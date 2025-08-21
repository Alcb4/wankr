import { NextRequest, NextResponse } from 'next/server'
import { upvoteDataCollector } from '../../../../server/services/upvoteDataCollector'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { addresses, action = 'start' } = body

    if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
      return NextResponse.json(
        { error: 'Addresses array is required' },
        { status: 400 }
      )
    }

    console.log(`🔧 Upvote data collection ${action} requested for ${addresses.length} addresses`)

    if (action === 'start') {
      upvoteDataCollector.startCollection(addresses)
      
      return NextResponse.json({
        success: true,
        message: `Started upvote data collection for ${addresses.length} addresses`,
        addresses,
        stats: upvoteDataCollector.getCacheStats()
      })
    } else if (action === 'stop') {
      upvoteDataCollector.stopCollection()
      
      return NextResponse.json({
        success: true,
        message: 'Stopped upvote data collection',
        stats: upvoteDataCollector.getCacheStats()
      })
    } else if (action === 'stats') {
      return NextResponse.json({
        success: true,
        stats: upvoteDataCollector.getCacheStats()
      })
    } else if (action === 'clear-cache') {
      upvoteDataCollector.clearExpiredCache()
      
      return NextResponse.json({
        success: true,
        message: 'Cleared expired cache entries',
        stats: upvoteDataCollector.getCacheStats()
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use: start, stop, stats, or clear-cache' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('❌ Error in net-protocol/collect API:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to manage data collection',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const stats = upvoteDataCollector.getCacheStats()
    
    return NextResponse.json({
      success: true,
      stats
    })
  } catch (error) {
    console.error('❌ Error getting collection stats:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to get collection stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
