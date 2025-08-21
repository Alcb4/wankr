import { NextRequest, NextResponse } from 'next/server'
import { netProtocolService } from '../../../../server/services/netProtocolService'
import { upvoteDataCollector } from '../../../../server/services/upvoteDataCollector'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const address = searchParams.get('address')
    const addresses = searchParams.get('addresses')
    const startTime = searchParams.get('startTime')
    const endTime = searchParams.get('endTime')
    const interval = searchParams.get('interval') // in hours

    // Validate required parameters
    if (!address && !addresses) {
      return NextResponse.json(
        { error: 'Missing required parameter: address or addresses' },
        { status: 400 }
      )
    }

    // Parse addresses
    let targetAddresses: string[] = []
    if (address) {
      targetAddresses = [address]
    } else if (addresses) {
      targetAddresses = addresses.split(',').map(addr => addr.trim())
    }

    // Validate addresses
    if (targetAddresses.length === 0) {
      return NextResponse.json(
        { error: 'No valid addresses provided' },
        { status: 400 }
      )
    }

    // If time range is provided, get historical data
    if (startTime && endTime) {
      const startTimestamp = parseInt(startTime)
      const endTimestamp = parseInt(endTime)
      const intervalHours = interval ? parseInt(interval) : 24
      const intervalMs = intervalHours * 60 * 60 * 1000

      if (isNaN(startTimestamp) || isNaN(endTimestamp) || isNaN(intervalHours)) {
        return NextResponse.json(
          { error: 'Invalid time parameters' },
          { status: 400 }
        )
      }

      console.log(`🔍 Fetching cumulative upvotes for ${targetAddresses.length} addresses from ${new Date(startTimestamp).toISOString()} to ${new Date(endTimestamp).toISOString()} with ${intervalHours}h intervals`)

      // Check if we have cached data for single address
      if (targetAddresses.length === 1) {
        const cachedData = upvoteDataCollector.getCachedCumulativeData(targetAddresses[0])
        if (cachedData && 
            cachedData.startTime <= startTimestamp && 
            cachedData.endTime >= endTimestamp) {
          console.log(`📦 Using cached cumulative data for ${targetAddresses[0]}`)
          
          // Filter cached data to match requested time range
          const filteredData = cachedData.dataPoints.filter(point => 
            point.timestamp >= startTimestamp && point.timestamp <= endTimestamp
          )
          
          return NextResponse.json({
            addresses: targetAddresses,
            startTime: startTimestamp,
            endTime: endTimestamp,
            interval: intervalMs,
            data: filteredData,
            cached: true,
            cachedAt: cachedData.collectedAt
          })
        }
      }

      // Fallback to live data
      const cumulativeData = await netProtocolService.getCumulativeUpvotes(
        targetAddresses,
        startTimestamp,
        endTimestamp,
        intervalMs
      )

      return NextResponse.json({
        addresses: targetAddresses,
        startTime: startTimestamp,
        endTime: endTimestamp,
        interval: intervalMs,
        data: cumulativeData,
        cached: false
      })
    }

    // Otherwise, get current upvote data
    console.log(`🔍 Fetching current upvote data for ${targetAddresses.length} addresses`)
    
    // Check cache first for single address
    if (targetAddresses.length === 1) {
      const cachedData = upvoteDataCollector.getCachedUpvoteData(targetAddresses[0])
      if (cachedData) {
        console.log(`📦 Using cached upvote data for ${targetAddresses[0]}`)
                  return NextResponse.json({
            addresses: targetAddresses,
            data: [{
              address: cachedData.address,
              upvoteCount: cachedData.upvoteCount,
              lastUpdated: cachedData.timestamp
            }],
            timestamp: Date.now(),
            cached: true,
            cachedAt: cachedData.collectedAt
          })
      }
    }
    
    // Fallback to live data
    const upvoteData = await netProtocolService.getUpvotesForAddresses(targetAddresses)

    return NextResponse.json({
      addresses: targetAddresses,
      data: upvoteData,
      timestamp: Date.now(),
      cached: false
    })

  } catch (error) {
    console.error('❌ Error in net-protocol/upvotes API:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch upvote data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
