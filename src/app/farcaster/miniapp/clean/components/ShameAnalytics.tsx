"use client"

import { useState, useEffect } from 'react'

interface ShameAnalyticsProps {
  targetAddress: string | null
}

interface ShameStats {
  totalShames: number
  totalAmount: number
  averageAmount: number
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

  useEffect(() => {
    if (!targetAddress) return

    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        
        // Use existing shame feed API to get data
        const response = await fetch('/api/shame-feed')
        if (response.ok) {
          const data = await response.json()
          
          // Filter for target address and calculate stats
          const targetShames = data.shames?.filter((shame: { to?: string; amount?: number; from?: string; message?: string; timestamp?: string }) => 
            shame.to?.toLowerCase() === targetAddress.toLowerCase()
          ) || []

          const totalShames = targetShames.length
          const totalAmount = targetShames.reduce((sum: number, shame: { amount?: number }) => sum + (shame.amount || 0), 0)
          const averageAmount = totalShames > 0 ? totalAmount / totalShames : 0

          setStats({
            totalShames,
            totalAmount,
            averageAmount,
            recentShames: targetShames.slice(0, 5).map((shame: { from?: string; amount?: number; message?: string; timestamp?: string }) => ({
              from: shame.from || 'Unknown',
              amount: shame.amount || 0,
              message: shame.message || '',
              timestamp: shame.timestamp || new Date().toISOString()
            }))
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

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Shame Analytics</h2>
      
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
