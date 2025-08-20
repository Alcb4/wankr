import { NextResponse } from 'next/server'
import { ShameFeedService } from '../../../server/services/shameFeedService'

export async function GET(request: Request) {
  try {
    // Use singleton instance to reduce RPC calls
    const shameFeedService = ShameFeedService.getInstance()
    
    // Check if this is a force refresh request
    const url = new URL(request.url)
    const forceRefresh = url.searchParams.get('refresh') === 'true'
    
    let result
    if (forceRefresh) {
      console.log('🔄 Force refresh requested')
      await shameFeedService.forceRefresh()
      result = await shameFeedService.getShameFeed()
    } else {
      result = await shameFeedService.getShameFeed()
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching shame feed:', error)
    
    // Return a fallback response instead of 500 error
    return NextResponse.json({
      shameHistory: [],
      stats: {
        totalTransactions: 0,
        totalShameDelivered: 0,
        uniqueShamers: 0,
        uniqueShamed: 0,
        lastUpdate: new Date().toISOString(),
        averageJudgment: 0
      }
    })
  }
}
