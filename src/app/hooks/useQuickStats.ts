"use client"

import { useState, useEffect, useCallback } from 'react'
import { handleError } from '../utils/errorHandler'

interface QuickStats {
  totalUpvotes: number
  uniqueHolders: number
  totalTrades: number
  currentPrice: number
  marketCap: number
  volume24h: number
  liquidity: number
  lastUpdated: number
}

export function useQuickStats() {
  const [stats, setStats] = useState<QuickStats>({
    totalUpvotes: 0,
    uniqueHolders: 0,
    totalTrades: 0,
    currentPrice: 0,
    marketCap: 0,
    volume24h: 0,
    liquidity: 0,
    lastUpdated: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/quick-stats')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setStats(data)
      
    } catch (err) {
      const errorResponse = handleError(err, { 
        component: 'useQuickStats', 
        action: 'fetchStats' 
      })
      setError(errorResponse.userMessage)
      console.error('❌ Error fetching quick stats:', errorResponse.technicalMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    refresh: fetchStats
  }
}
