import { useState, useEffect } from 'react'

export interface UserStats {
  address: string
  handle: string | null
  displayName: string
  handleSource: 'farcaster' | 'basenames' | 'shortened'
  shameScore: number
  verificationLevel: string
  shameFreeStreak: number
  totalShamesSent: number
  totalShamesReceived: number
  wankrSent: number
  wankrReceived: number
  lastActivity: string
  verificationBadge: boolean
  transactionCount: number
  uniqueShamers: number
  averageShamerReputation: number
  recentShameActivity: number
}

export function useUserStats(address: string | null) {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!address) {
      setStats(null)
      setError(null)
      return
    }

    const fetchStats = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`/api/user-stats/${address}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch stats: ${response.status}`)
        }
        
        const data = await response.json()
        setStats(data)
      } catch (err) {
        console.error('Error fetching user stats:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch stats')
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [address])

  const refreshStats = async () => {
    if (!address) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/user-stats/${address}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`)
      }
      
      const data = await response.json()
      setStats(data)
    } catch (err) {
      console.error('Error refreshing user stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to refresh stats')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    stats,
    isLoading,
    error,
    refreshStats
  }
}
