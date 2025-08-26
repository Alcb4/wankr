"use client"

import { useState, useEffect, useCallback } from 'react'
import type { LeaderboardData, LeaderboardEntry } from '../config/types'

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://wankr.xyz/api' 
  : 'http://localhost:3000/api'

export function useFarcasterLeaderboard() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData>({ received: [], sent: [] })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received')
  const [timePeriod, setTimePeriod] = useState<'all' | 'week' | 'day'>('all')

  // Load leaderboard data
  const loadLeaderboards = useCallback(async (period: 'all' | 'week' | 'day' = timePeriod) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`${API_BASE_URL}/leaderboards/${period}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setLeaderboardData(data)
    } catch (err) {
      console.error('Failed to load leaderboards:', err)
      setError(err instanceof Error ? err.message : 'Failed to load leaderboards')
    } finally {
      setIsLoading(false)
    }
  }, [timePeriod])

  // Change time period
  const changeTimePeriod = useCallback((period: 'all' | 'week' | 'day') => {
    setTimePeriod(period)
    loadLeaderboards(period)
  }, [loadLeaderboards])

  // Get current leaderboard based on active tab
  const getCurrentLeaderboard = useCallback((): LeaderboardEntry[] => {
    return activeTab === 'received' ? leaderboardData.received : leaderboardData.sent
  }, [activeTab, leaderboardData])

  // Get top 10 entries for mobile display
  const getTopEntries = useCallback((count: number = 10): LeaderboardEntry[] => {
    return getCurrentLeaderboard().slice(0, count)
  }, [getCurrentLeaderboard])

  useEffect(() => {
    loadLeaderboards()
  }, [loadLeaderboards])

  return {
    leaderboardData,
    currentLeaderboard: getCurrentLeaderboard(),
    topEntries: getTopEntries(),
    isLoading,
    error,
    activeTab,
    timePeriod,
    setActiveTab,
    changeTimePeriod,
    refresh: () => loadLeaderboards()
  }
}
