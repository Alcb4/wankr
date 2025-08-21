import { netProtocolService } from './netProtocolService'

export interface CachedUpvoteData {
  address: string
  upvoteCount: string
  timestamp: number
  collectedAt: number
}

export interface CachedCumulativeData {
  address: string
  dataPoints: Array<{
    timestamp: number
    totalUpvotes: string
  }>
  startTime: number
  endTime: number
  interval: number
  collectedAt: number
}

export class UpvoteDataCollector {
  private static instance: UpvoteDataCollector | null = null
  private cache: Map<string, CachedUpvoteData> = new Map()
  private cumulativeCache: Map<string, CachedCumulativeData> = new Map()
  private collectionInterval: NodeJS.Timeout | null = null
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours (since data doesn't change frequently)
  private readonly COLLECTION_INTERVAL = 24 * 60 * 60 * 1000 // 24 hours

  private constructor() {}

  static getInstance(): UpvoteDataCollector {
    if (!UpvoteDataCollector.instance) {
      UpvoteDataCollector.instance = new UpvoteDataCollector()
    }
    return UpvoteDataCollector.instance
  }

  /**
   * Start collecting upvote data at regular intervals
   */
  startCollection(addresses: string[] = []) {
    if (this.collectionInterval) {
      console.log('🔄 Upvote data collection already running')
      return
    }

    console.log(`🚀 Starting upvote data collection for ${addresses.length} addresses every ${this.COLLECTION_INTERVAL / (60 * 60 * 1000)} hours (since upvote counts change slowly)`)

    // Initial collection
    this.collectData(addresses)

    // Set up recurring collection
    this.collectionInterval = setInterval(() => {
      this.collectData(addresses)
    }, this.COLLECTION_INTERVAL)
  }

  /**
   * Stop collecting data
   */
  stopCollection() {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval)
      this.collectionInterval = null
      console.log('⏹️ Stopped upvote data collection')
    }
  }

  /**
   * Collect upvote data for specified addresses
   */
  private async collectData(addresses: string[]) {
    if (addresses.length === 0) {
      console.log('⚠️ No addresses provided for upvote data collection')
      return
    }

    console.log(`📊 Collecting upvote data for ${addresses.length} addresses...`)
    const startTime = Date.now()

    try {
      const upvoteData = await netProtocolService.getUpvotesForAddresses(addresses)
      
      // Cache the data
      upvoteData.forEach(data => {
        const cacheKey = `upvote_${data.address}`
        this.cache.set(cacheKey, {
          address: data.address,
          upvoteCount: data.upvoteCount,
          timestamp: data.lastUpdated,
          collectedAt: startTime
        })
      })

      console.log(`✅ Collected upvote data for ${upvoteData.length} addresses in ${Date.now() - startTime}ms`)

      // Also collect cumulative data for the last 30 days
      await this.collectCumulativeData(addresses)

    } catch (error) {
      console.error('❌ Error collecting upvote data:', error)
    }
  }

  /**
   * Collect cumulative upvote data for historical analysis
   */
  private async collectCumulativeData(addresses: string[]) {
    const endTime = Date.now()
    const startTime = endTime - (30 * 24 * 60 * 60 * 1000) // 30 days ago
    const interval = 24 * 60 * 60 * 1000 // 24 hours

    console.log(`📈 Collecting cumulative upvote data for ${addresses.length} addresses over 30 days...`)

    try {
      const cumulativeData = await netProtocolService.getCumulativeUpvotes(
        addresses,
        startTime,
        endTime,
        interval
      )

      // Cache cumulative data for each address
      addresses.forEach(address => {
        const cacheKey = `cumulative_${address}`
        this.cumulativeCache.set(cacheKey, {
          address,
          dataPoints: cumulativeData.map(point => ({
            timestamp: point.timestamp,
            totalUpvotes: point.totalUpvotes
          })),
          startTime,
          endTime,
          interval,
          collectedAt: Date.now()
        })
      })

      console.log(`✅ Collected cumulative data for ${addresses.length} addresses`)

    } catch (error) {
      console.error('❌ Error collecting cumulative upvote data:', error)
    }
  }

  /**
   * Get cached upvote data for an address
   */
  getCachedUpvoteData(address: string): CachedUpvoteData | null {
    const cacheKey = `upvote_${address.toLowerCase()}`
    const cached = this.cache.get(cacheKey)
    
    if (!cached) return null
    
    // Check if cache is still valid
    if (Date.now() - cached.collectedAt > this.CACHE_DURATION) {
      this.cache.delete(cacheKey)
      return null
    }
    
    return cached
  }

  /**
   * Get cached cumulative data for an address
   */
  getCachedCumulativeData(address: string): CachedCumulativeData | null {
    const cacheKey = `cumulative_${address.toLowerCase()}`
    const cached = this.cumulativeCache.get(cacheKey)
    
    if (!cached) return null
    
    // Check if cache is still valid
    if (Date.now() - cached.collectedAt > this.CACHE_DURATION) {
      this.cumulativeCache.delete(cacheKey)
      return null
    }
    
    return cached
  }

  /**
   * Get all cached upvote data
   */
  getAllCachedUpvoteData(): CachedUpvoteData[] {
    const now = Date.now()
    const validData: CachedUpvoteData[] = []
    
    for (const [key, data] of this.cache.entries()) {
      if (now - data.collectedAt <= this.CACHE_DURATION) {
        validData.push(data)
      } else {
        this.cache.delete(key)
      }
    }
    
    return validData
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache() {
    const now = Date.now()
    
    // Clear expired upvote data
    for (const [key, data] of this.cache.entries()) {
      if (now - data.collectedAt > this.CACHE_DURATION) {
        this.cache.delete(key)
      }
    }
    
    // Clear expired cumulative data
    for (const [key, data] of this.cumulativeCache.entries()) {
      if (now - data.collectedAt > this.CACHE_DURATION) {
        this.cumulativeCache.delete(key)
      }
    }
    
    console.log(`🧹 Cleared expired cache entries. Cache size: ${this.cache.size} upvote, ${this.cumulativeCache.size} cumulative`)
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      upvoteCacheSize: this.cache.size,
      cumulativeCacheSize: this.cumulativeCache.size,
      isCollecting: !!this.collectionInterval,
      collectionInterval: this.COLLECTION_INTERVAL,
      cacheDuration: this.CACHE_DURATION
    }
  }
}

// Export singleton instance
export const upvoteDataCollector = UpvoteDataCollector.getInstance()
