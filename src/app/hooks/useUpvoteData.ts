import { useState, useEffect, useCallback } from 'react'

export interface UpvoteDataPoint {
  timestamp: number
  totalUpvotes: string
  addressCount: number
}

export interface UpvoteData {
  address: string
  upvoteCount: string
  lastUpdated: number
}

export interface UseUpvoteDataOptions {
  addresses: string[]
  startTime?: number
  endTime?: number
  interval?: number // in hours
  autoRefresh?: boolean
  refreshInterval?: number // in milliseconds
}

export interface UseUpvoteDataReturn {
  data: UpvoteDataPoint[] | UpvoteData[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  lastUpdated: number | null
}

export function useUpvoteData({
  addresses,
  startTime,
  endTime,
  interval = 24,
  autoRefresh = false,
  refreshInterval = 60 * 60 * 1000 // 1 hour (only for current data, not historical)
}: UseUpvoteDataOptions): UseUpvoteDataReturn {
  const [data, setData] = useState<UpvoteDataPoint[] | UpvoteData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)

  const fetchData = useCallback(async () => {
    if (addresses.length === 0) {
      setData([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      
      if (addresses.length === 1) {
        params.append('address', addresses[0])
      } else {
        params.append('addresses', addresses.join(','))
      }

      if (startTime && endTime) {
        params.append('startTime', startTime.toString())
        params.append('endTime', endTime.toString())
        params.append('interval', interval.toString())
      }

      const response = await fetch(`/api/net-protocol/upvotes?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.error) {
        throw new Error(result.error)
      }

      setData(result.data || [])
      setLastUpdated(Date.now())
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch upvote data'
      setError(errorMessage)
      console.error('❌ Error fetching upvote data:', err)
    } finally {
      setLoading(false)
    }
  }, [addresses, startTime, endTime, interval])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh (only for current data, not historical data)
  useEffect(() => {
    if (!autoRefresh || (startTime && endTime)) return

    const intervalId = setInterval(fetchData, refreshInterval)
    return () => clearInterval(intervalId)
  }, [autoRefresh, refreshInterval, fetchData, startTime, endTime])

  return {
    data,
    loading,
    error,
    refresh: fetchData,
    lastUpdated
  }
}
