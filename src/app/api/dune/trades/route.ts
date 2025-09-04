import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest) {
  try {
    // Dune query ID for total trades
    const queryId = 5670305

    // Build the Dune API URL
    const duneUrl = `https://api.dune.com/api/v1/query/${queryId}/results`
    
    const response = await fetch(duneUrl, {
      headers: {
        'X-Dune-API-Key': process.env.DUNE_API_KEY || '',
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Dune API error: ${response.status}`)
    }

    const result = await response.json()
    
    if (!result.result || !result.result.rows) {
      throw new Error('Invalid response from Dune API')
    }

    // Extract total trades from the first row
    const totalTrades = result.result.rows[0]?.total_trades || 0

    return NextResponse.json({
      totalTrades: parseInt(totalTrades),
      lastUpdated: Date.now(),
      queryId
    })

  } catch (error) {
    console.error('❌ Error fetching Dune trades data:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch trades data',
        totalTrades: 0
      },
      { status: 500 }
    )
  }
}
