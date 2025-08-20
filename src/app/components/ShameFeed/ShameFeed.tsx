"use client"

import { useEffect } from 'react'
import { useShameFeed } from '../../hooks/useShameFeed'
import { enhancedShameFeedService } from '../../services/enhancedShameFeedService'
import { ShameItem } from './ShameItem'
import { Button, Card } from '../ui'
import { components, layout } from '../../theme'

export function ShameFeed() {
  const { transactions, stats, loading, error, refresh } = useShameFeed()

  // Listen for refresh events from SendWankr component
  useEffect(() => {
    const handleRefresh = () => {
      console.log('🔔 ShameFeed: Received refresh event, calling refresh...')
      refresh()
    }

    window.addEventListener('refreshShameFeed', handleRefresh)
    console.log('👂 ShameFeed: Listening for refresh events')
    
    return () => {
      window.removeEventListener('refreshShameFeed', handleRefresh)
    }
  }, [refresh])

  if (loading) {
    return (
      <div className={layout.flex.center + ' py-8'}>
        <div className={components.status.loading}></div>
        <p className="mt-4 text-muted-foreground">Loading shame feed...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={layout.flex.center + ' py-8'}>
        <p className="text-destructive mb-4">Error: {error}</p>
        <Button variant="primary" onClick={refresh}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div>
      {/* Stats and Live Status on same line */}
      <Card variant="base" padding="sm" className="mb-4">
        <div className={layout.flex.between}>
          <div className="flex gap-4 text-sm">
            <span className="text-muted-foreground">
              Total Transactions: <span className="text-secondary font-semibold">{stats.totalTransactions}</span>
            </span>
            <span className="text-muted-foreground">
              Total Shame Delivered: <span className="text-secondary font-semibold">{stats.totalShameDelivered}</span>
            </span>
          </div>

          {/* Live Status */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-md border" style={{ 
            backgroundColor: error ? 'rgba(255, 71, 87, 0.1)' : 'rgba(46, 213, 115, 0.1)', 
            borderColor: error ? '#ff4757' : '#2ed573' 
          }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ 
              backgroundColor: error ? '#ff4757' : '#2ed573' 
            }}></div>
            <span className="text-xs font-medium" style={{ 
              color: error ? '#ff4757' : '#2ed573' 
            }}>
              {error ? 'Error' : 'Live'}
            </span>
          </div>
        </div>
      </Card>

      {/* Transactions */}
      <div className="max-h-80 overflow-y-auto space-y-3">
        {transactions.length === 0 ? (
          <div className={layout.flex.center + ' py-8 text-muted-foreground'}>
            No shame transactions yet...
          </div>
        ) : (
          transactions.map((shame, index) => (
            <ShameItem key={`${shame.hash}-${index}`} shame={shame} isNew={shame.isNew} />
          ))
        )}
      </div>
    </div>
  )
}
