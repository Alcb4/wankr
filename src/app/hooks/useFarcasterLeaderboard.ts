"use client"

import { useState, useEffect, useCallback } from 'react'
import type { LeaderboardData, LeaderboardEntry } from '../config/types'

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://wankr.xyz/api' 
  : typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : '/api'

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
      
      console.log(`🔍 Loading leaderboards for period: ${period}`)
      console.log(`🌐 API URL: ${API_BASE_URL}/leaderboards/${period}`)
      
      const response = await fetch(`${API_BASE_URL}/leaderboards/${period}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout for Mini App context
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log(`✅ Leaderboard data loaded:`, data)
      setLeaderboardData(data)
    } catch (err) {
      console.error('❌ Failed to load leaderboards:', err)
      
      // Provide fallback data for Mini App context
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timeout - please try again')
      } else if (err instanceof Error && err.message.includes('Failed to fetch')) {
        setError('Network error - check your connection')
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load leaderboards')
      }
      
      // Set fallback data to prevent empty state
      setLeaderboardData({
        received: [
          { rank: 1, address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', displayName: 'Demo User', transactionCount: 15, totalWankr: '1,234', period: 'all', source: 'farcaster' },
          { rank: 2, address: '0x1234567890123456789012345678901234567890', displayName: 'Test User', transactionCount: 8, totalWankr: '567', period: 'all', source: 'farcaster' }
        ],
        sent: [
          { rank: 1, address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', displayName: 'Demo User', transactionCount: 12, totalWankr: '890', period: 'all', source: 'farcaster' },
          { rank: 2, address: '0x1234567890123456789012345678901234567890', displayName: 'Test User', transactionCount: 6, totalWankr: '456', period: 'all', source: 'farcaster' }
        ]
      })
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
