import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Dune query ID for unique daily holders
    const queryId = 5670106

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

    // Debug: Log the first few rows to see the data structure
    console.log('🔍 Raw Dune data structure:', JSON.stringify(result.result.rows.slice(0, 3), null, 2))

    // Transform the data to match our interface
    const data = result.result.rows.map((row: Record<string, unknown>, index: number) => {
      // Try to parse the date from the row data
      let date = null
      
      // Check for common date column names
      if (row.date && typeof row.date === 'string') {
        date = new Date(row.date)
      } else if (row.vote_date && typeof row.vote_date === 'string') {
        date = new Date(row.vote_date)
      } else if (row.created_at && typeof row.created_at === 'string') {
        date = new Date(row.created_at)
      }
      
      // Debug: Log what we found
      if (index < 3) {
        console.log(`🔍 Row ${index}:`, { row, parsedDate: date })
      }
      
      // For now, let's be more lenient with dates and just ensure we have valid data
      // If no date found, use a fallback based on index
      if (!date || isNaN(date.getTime())) {
        // Use a fallback date - assume data is recent and work backwards
        const fallbackDate = new Date()
        fallbackDate.setDate(fallbackDate.getDate() - (result.result.rows.length - index - 1))
        date = fallbackDate
        console.log(`🔍 Using fallback date for row ${index}:`, date)
      }
      
      // Only filter out dates that are clearly wrong (before 2025)
      const reasonableStartDate = new Date('2025-01-01')
      if (date < reasonableStartDate) {
        console.warn(`Date too old: ${date}, skipping.`)
        return null
      }
      
      return {
        date: date.toISOString().split('T')[0],
        unique_holders: parseInt(String(row.unique_holders || row.holders || 0))
      }
    }).filter(Boolean) // Remove null entries

    // Filter by date range if provided
    let filteredData = data
    if (startDate || endDate) {
      console.log('🔍 Filtering holders data:', { startDate, endDate, dataLength: data.length })
      filteredData = data.filter((item: { date: string; unique_holders: number }) => {
        const itemDate = new Date(item.date)
        const start = startDate ? new Date(startDate) : null
        const end = endDate ? new Date(endDate) : null
        
        if (start && itemDate < start) {
          console.log(`🔍 Filtering out ${item.date} (before ${startDate})`)
          return false
        }
        if (end && itemDate > end) {
          console.log(`🔍 Filtering out ${item.date} (after ${endDate})`)
          return false
        }
        return true
      })
      console.log('🔍 Filtered data length:', filteredData.length)
    }

    return NextResponse.json({
      data: filteredData,
      lastUpdated: Date.now(),
      queryId
    })

  } catch (error) {
    console.error('❌ Error fetching Dune holders data:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch holders data',
        data: []
      },
      { status: 500 }
    )
  }
}
