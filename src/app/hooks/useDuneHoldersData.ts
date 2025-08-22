import { useState, useEffect, useCallback } from 'react'

export interface DailyHoldersData {
  date: string
  unique_holders: number
}

export interface UseDuneHoldersDataOptions {
  startDate?: string
  endDate?: string
  autoRefresh?: boolean
  refreshInterval?: number // in milliseconds
}

export interface UseDuneHoldersDataReturn {
  data: DailyHoldersData[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  lastUpdated: number | null
}

export function useDuneHoldersData({
  startDate,
  endDate,
  autoRefresh = false,
  refreshInterval = 12 * 60 * 60 * 1000 // 12 hours (matches Dune refresh)
}: UseDuneHoldersDataOptions = {}): UseDuneHoldersDataReturn {
  const [data, setData] = useState<DailyHoldersData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      
      if (startDate) {
        params.append('startDate', startDate)
      }
      
      if (endDate) {
        params.append('endDate', endDate)
      }

      const response = await fetch(`/api/dune/holders?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.error) {
        throw new Error(result.error)
      }

      setData(result.data || [])
      setLastUpdated(result.lastUpdated || Date.now())
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch Dune holders data'
      setError(errorMessage)
      console.error('❌ Error fetching Dune holders data:', err)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const intervalId = setInterval(fetchData, refreshInterval)
    return () => clearInterval(intervalId)
  }, [autoRefresh, refreshInterval, fetchData])

  return {
    data,
    loading,
    error,
    refresh: fetchData,
    lastUpdated
  }
}
