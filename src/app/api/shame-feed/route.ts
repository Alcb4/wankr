import { NextRequest, NextResponse } from 'next/server'
import { ShameFeedService } from '../../../server/services/shameFeedService'

export async function GET(request: NextRequest) {
  try {
    const shameFeedService = new ShameFeedService()
    const result = await shameFeedService.getShameFeed()
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching shame feed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shame feed' },
      { status: 500 }
    )
  }
}
