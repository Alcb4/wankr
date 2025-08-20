"use client"

import { useShameFeed } from '../../hooks/useShameFeed'
import { ShameItem } from './ShameItem'
import { Button, Card } from '../ui'
import { components, layout } from '../../theme'

export function ShameFeed() {
  const { transactions, stats, loading, error, refresh } = useShameFeed()

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
          <div className={components.status.live}>
            <div className="w-2 h-2 bg-liveStatus rounded-full animate-pulse"></div>
            <span className="text-xs text-liveStatus font-medium">Live</span>
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
            <ShameItem key={`${shame.transactionHash}-${index}`} shame={shame} isNew={shame.isNew} />
          ))
        )}
      </div>
    </div>
  )
}
