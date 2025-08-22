import { NextRequest, NextResponse } from 'next/server'
import { duneUpvoteService } from '../../../../src/server/services/duneUpvoteService'

export async function GET(request: NextRequest) {
  try {
    // Fetch data from multiple sources in parallel
    const [upvotesData, holdersData, tradesData, tokenData] = await Promise.allSettled([
      // Total Upvotes
      duneUpvoteService.getLatestUpvoteCount(),
      
      // Unique Holders
      fetch(`${request.nextUrl.origin}/api/dune/holders`).then(res => res.json()),
      
      // Total Trades
      fetch(`${request.nextUrl.origin}/api/dune/trades`).then(res => res.json()),
      
      // Token Price & Market Cap
      fetch(`${request.nextUrl.origin}/api/token-info`).then(res => res.json())
    ])

    // Extract data with fallbacks
    const totalUpvotes = upvotesData.status === 'fulfilled' ? upvotesData.value : 0
    
    const uniqueHolders = holdersData.status === 'fulfilled' && holdersData.value.data 
      ? holdersData.value.data.length > 0 
        ? holdersData.value.data[holdersData.value.data.length - 1].unique_holders 
        : 0
      : 0
    
    const totalTrades = tradesData.status === 'fulfilled' ? tradesData.value.totalTrades : 0
    
    const currentPrice = tokenData.status === 'fulfilled' ? tokenData.value.priceUsd : 0
    const marketCap = tokenData.status === 'fulfilled' ? tokenData.value.marketCap : 0

    const quickStats = {
      totalUpvotes,
      uniqueHolders,
      totalTrades,
      currentPrice,
      marketCap,
      volume24h: tokenData.status === 'fulfilled' ? tokenData.value.volume24h : 0,
      liquidity: tokenData.status === 'fulfilled' ? tokenData.value.liquidity : 0,
      lastUpdated: Date.now()
    }

    return NextResponse.json(quickStats)

  } catch (error) {
    console.error('❌ Error fetching quick stats:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch quick stats',
        totalUpvotes: 0,
        uniqueHolders: 0,
        totalTrades: 0,
        currentPrice: 0,
        marketCap: 0,
        volume24h: 0,
        liquidity: 0,
        lastUpdated: Date.now()
      },
      { status: 500 }
    )
  }
}
