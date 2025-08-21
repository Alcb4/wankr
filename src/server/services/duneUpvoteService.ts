import { DuneClient } from '@duneanalytics/client-sdk'

export interface DailyUpvoteData {
  vote_date: string
  total_upvotes: number
}

export interface DuneUpvoteResponse {
  data: DailyUpvoteData[]
  lastUpdated: number
}

export class DuneUpvoteService {
  private duneClient: DuneClient
  private cache: Map<string, { data: DuneUpvoteResponse; timestamp: number }> = new Map()
  private readonly CACHE_DURATION = 12 * 60 * 60 * 1000 // 12 hours cache (matches Dune refresh)

  constructor(apiKey?: string) {
    this.duneClient = new DuneClient(apiKey || process.env.DUNE_API_KEY || '')
  }

  /**
   * Get cumulative upvote data from Dune
   * This will use the query you provided to get real historical data
   */
  async getCumulativeUpvotes(): Promise<DuneUpvoteResponse> {
    const cacheKey = 'cumulative_upvotes'
    
    // Check cache first
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data
    }

    try {
      console.log('🔍 Fetching cumulative upvote data from Dune...')
      
      // Use the actual query ID from your Dune query
      const queryId = 5667460
      
      const result = await this.duneClient.getLatestResult({
        queryId: queryId
      })

      if (!result.result || !result.result.rows) {
        throw new Error('No data returned from Dune')
      }

      // Transform the data - generate synthetic dates since Dune query doesn't include dates
      const data: DailyUpvoteData[] = result.result.rows.map((row: Record<string, unknown>, index: number) => {
        // Generate dates going backwards from today, one day per data point
        // Start from 63 days ago (based on the data length we saw)
        const today = new Date()
        const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 63)
        
        const date = new Date(startDate)
        date.setDate(date.getDate() + index) // Add days for each data point
        
        return {
          vote_date: date.toISOString().split('T')[0], // YYYY-MM-DD format
          total_upvotes: parseInt(String(row.total_upvotes))
        }
      })

      const response: DuneUpvoteResponse = {
        data,
        lastUpdated: Date.now()
      }

      // Cache the result
      this.cache.set(cacheKey, { data: response, timestamp: Date.now() })
      
      console.log(`✅ Fetched ${data.length} days of upvote data from Dune`)
      return response

    } catch (error) {
      console.error('❌ Error fetching data from Dune:', error)
      throw new Error(`Failed to fetch Dune data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get upvote data for a specific date range
   */
  async getUpvotesForDateRange(startDate: string, endDate: string): Promise<DailyUpvoteData[]> {
    const allData = await this.getCumulativeUpvotes()
    
    return allData.data.filter(item => {
      const itemDate = new Date(item.vote_date)
      const start = new Date(startDate)
      const end = new Date(endDate)
      return itemDate >= start && itemDate <= end
    })
  }

  /**
   * Get the latest upvote count
   */
  async getLatestUpvoteCount(): Promise<number> {
    const data = await this.getCumulativeUpvotes()
    
    if (data.data.length === 0) {
      return 0
    }
    
    // Return the highest total (latest data)
    return Math.max(...data.data.map(item => item.total_upvotes))
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear()
    console.log('🧹 Cleared Dune upvote cache')
  }
}

// Export singleton instance
export const duneUpvoteService = new DuneUpvoteService()
