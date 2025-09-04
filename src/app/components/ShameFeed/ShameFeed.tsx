"use client"

import { useEffect } from 'react'
import { useShameFeed } from '../../hooks/useShameFeed'
import { useRealtimeUpdates } from '../../hooks/useRealtimeUpdates'
// import { enhancedShameFeedService } from '../../services/enhancedShameFeedService'
import { ShameItem } from './ShameItem'
import { Button, Card } from '../ui'
import { layout } from '../../theme'
import { RealtimeStatus } from '../RealtimeStatus/RealtimeStatus'

export function ShameFeed() {
  const { transactions, stats, loading, error, refresh } = useShameFeed()
  
  // Real-time updates
  const { lastUpdate } = useRealtimeUpdates({
    subscriptions: ['shame-feed'],
    clientId: 'shame-feed-client'
  })

  // Handle real-time updates
  useEffect(() => {
    if (lastUpdate && lastUpdate.type === 'shame-feed-update') {
      console.log('🔄 ShameFeed: Received real-time update, refreshing data...')
      refresh()
    }
  }, [lastUpdate, refresh])

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
        <div className="inline-block w-8 h-8 border-4 border-muted border-t-primary rounded-full" style={{ animation: 'spin 1s linear infinite' }}></div>
        <p className="mt-4 text-muted-foreground">Loading shame feed...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={layout.flex.center + ' py-8'}>
        <p className="text-destructive mb-4">Error: {error}</p>
        <Button variant="default" onClick={refresh}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div>
      {/* Stats and Live Status */}
      <Card variant="base" padding="sm" className="mb-4">
        <div className="flex flex-row justify-between items-center gap-3">
          <div className="flex flex-row gap-4 text-sm overflow-x-auto">
            <span className="text-white whitespace-nowrap">
              Total Transactions: <span className="text-secondary font-semibold">{stats.totalTransactions}</span>
            </span>
            <span className="text-white whitespace-nowrap">
              Total Shame Delivered: <span className="text-secondary font-semibold">{stats.totalShameDelivered}</span>
            </span>
          </div>

          {/* Live Status */}
          <RealtimeStatus 
            subscriptions={['shame-feed']}
            clientId="shame-feed-client"
          />
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
