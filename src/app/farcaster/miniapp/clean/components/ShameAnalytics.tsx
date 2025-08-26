"use client"

import { useState, useEffect } from 'react'

interface ShameAnalyticsProps {
  targetAddress: string | null
}

interface ShameStats {
  totalShames: number
  totalAmount: number
  averageAmount: number
  shameScore: number
  shameFreeStreak: number
  uniqueShamers: number
  recentShames: Array<{
    from: string
    amount: number
    message: string
    timestamp: string
  }>
}

export function ShameAnalytics({ targetAddress }: ShameAnalyticsProps) {
  const [stats, setStats] = useState<ShameStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Function to interpret shame score
  const getShameScoreInfo = (score: number) => {
    if (score === 0) {
      return {
        level: 'Pristine',
        description: 'No shame received - clean reputation!',
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        emoji: '✨'
      }
    } else if (score <= 10) {
      return {
        level: 'Light',
        description: 'Minimal shame - mostly clean',
        color: 'text-green-400',
        bgColor: 'bg-green-400/10',
        emoji: '😊'
      }
    } else if (score <= 25) {
      return {
        level: 'Moderate',
        description: 'Some shame - watch out',
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        emoji: '⚠️'
      }
    } else if (score <= 50) {
      return {
        level: 'High',
        description: 'Significant shame - concerning',
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
        emoji: '😬'
      }
    } else if (score <= 75) {
      return {
        level: 'Very High',
        description: 'Heavy shame - major red flags',
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        emoji: '🚨'
      }
    } else {
      return {
        level: 'Extreme',
        description: 'Maximum shame - avoid at all costs',
        color: 'text-red-600',
        bgColor: 'bg-red-600/10',
        emoji: '💀'
      }
    }
  }

  useEffect(() => {
    if (!targetAddress) return

    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        
        // Use our new user stats API for faster loading
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
        
        const response = await fetch(`/api/user-stats/${targetAddress}`, {
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        if (response.ok) {
          const data = await response.json()
          
          setStats({
            totalShames: data.totalShamesReceived || 0,
            totalAmount: data.wankrReceived || 0,
            averageAmount: data.totalShamesReceived > 0 ? (data.wankrReceived / data.totalShamesReceived) : 0,
            shameScore: data.shameScore || 0,
            shameFreeStreak: data.shameFreeStreak || 0,
            uniqueShamers: data.uniqueShamers || 0,
            recentShames: [] // We'll add this later if needed
          })
        } else {
          setError('Failed to load analytics')
        }
      } catch (err) {
        console.error('Analytics error:', err)
        setError('Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [targetAddress])

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Shame Analytics</h2>
        <div className="text-center py-8">
          <div className="text-muted-foreground">Loading analytics...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Shame Analytics</h2>
        <div className="text-center py-8">
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Shame Analytics</h2>
        <div className="text-center py-8">
          <div className="text-muted-foreground">No data available</div>
        </div>
      </div>
    )
  }

  const scoreInfo = getShameScoreInfo(stats.shameScore)

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Shame Analytics</h2>
      
      {/* Shame Score Card */}
      <div className={`p-4 rounded-lg border ${scoreInfo.bgColor} ${scoreInfo.color}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Shame Score</h3>
          <span className="text-2xl">{scoreInfo.emoji}</span>
        </div>
        <div className="text-3xl font-bold mb-2">{stats.shameScore}/100</div>
        <div className="text-sm font-medium mb-2">{scoreInfo.level}</div>
        <p className="text-sm opacity-90">{scoreInfo.description}</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-muted rounded-lg text-center">
          <div className="text-2xl font-bold text-primary">{stats.totalShames}</div>
          <div className="text-xs text-muted-foreground">Total Shames</div>
        </div>
        <div className="p-3 bg-muted rounded-lg text-center">
          <div className="text-2xl font-bold text-primary">{stats.totalAmount}</div>
          <div className="text-xs text-muted-foreground">Total WANKR</div>
        </div>
        <div className="p-3 bg-muted rounded-lg text-center">
          <div className="text-2xl font-bold text-primary">{stats.averageAmount.toFixed(1)}</div>
          <div className="text-xs text-muted-foreground">Avg Amount</div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-muted rounded-lg text-center">
          <div className="text-lg font-bold text-primary">{stats.uniqueShamers}</div>
          <div className="text-xs text-muted-foreground">Unique Shamers</div>
        </div>
        <div className="p-3 bg-muted rounded-lg text-center">
          <div className="text-lg font-bold text-primary">{stats.shameFreeStreak}</div>
          <div className="text-xs text-muted-foreground">Shame-Free Days</div>
        </div>
      </div>

      {/* Recent Shames */}
      <div>
        <h3 className="text-md font-medium mb-3">Recent Shames</h3>
        <div className="space-y-2">
          {stats.recentShames.map((shame, index) => (
            <div key={index} className="p-3 border border-border rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-mono">
                  {shame.from.slice(0, 6)}...{shame.from.slice(-4)}
                </span>
                <span className="text-sm font-bold text-primary">
                  {shame.amount} WANKR
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{shame.message}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(shame.timestamp).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
