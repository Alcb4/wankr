import { NextRequest, NextResponse } from 'next/server'

// WANKR token address on Base
const WANKR_TOKEN_ADDRESS = '0xa207c6e67cea08641503947ac05c65748bb9bb07'

export async function GET(_request: NextRequest) {
  try {
    // DexScreener API endpoint for WANKR token
    const dexScreenerUrl = `https://api.dexscreener.com/latest/dex/tokens/${WANKR_TOKEN_ADDRESS}`
    
    const response = await fetch(dexScreenerUrl, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`DexScreener API error: ${response.status}`)
    }

    const result = await response.json()
    
    if (!result.pairs || result.pairs.length === 0) {
      throw new Error('No trading pairs found for WANKR token')
    }

    // Get the most relevant pair (usually the one with highest liquidity)
    const mainPair = result.pairs[0]
    
    const tokenInfo = {
      priceUsd: parseFloat(mainPair.priceUsd || '0'),
      priceChange24h: parseFloat(mainPair.priceChange?.h24 || '0'),
      marketCap: parseFloat(mainPair.marketCap || '0'),
      volume24h: parseFloat(mainPair.volume?.h24 || '0'),
      liquidity: parseFloat(mainPair.liquidity?.usd || '0'),
      fdv: parseFloat(mainPair.fdv || '0'),
      lastUpdated: Date.now()
    }

    return NextResponse.json(tokenInfo)

  } catch (error) {
    console.error('❌ Error fetching token info:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch token info',
        priceUsd: 0,
        priceChange24h: 0,
        marketCap: 0,
        volume24h: 0,
        liquidity: 0,
        fdv: 0,
        lastUpdated: Date.now()
      },
      { status: 500 }
    )
  }
}
