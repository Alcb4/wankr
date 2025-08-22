"use client"

import { useQuickStats } from '../../hooks/useQuickStats'

interface StatItemProps {
  label: string
  value: string | number
  isLoading?: boolean
  className?: string
}

function StatItem({ label, value, isLoading = false, className = '' }: StatItemProps) {
  return (
    <div className={`text-center hover-lift ${className}`}>
      <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary glow-animation">
        {isLoading ? (
          <div className="inline-block w-6 h-6 sm:w-8 sm:h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        ) : (
          value
        )}
      </div>
      <div className="text-xs sm:text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  )
}

export function QuickStats() {
  const { stats, loading, error } = useQuickStats()

  // Format numbers for display
  const formatNumber = (num: number) => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B'
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K'
    return num.toLocaleString()
  }

  const formatPrice = (price: number) => {
    if (price < 0.01) return `$${price.toFixed(6)}`
    if (price < 1) return `$${price.toFixed(4)}`
    return `$${price.toFixed(2)}`
  }

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`
    if (marketCap >= 1e3) return `$${(marketCap / 1e3).toFixed(2)}K`
    return `$${marketCap.toFixed(2)}`
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-destructive mb-2">Error loading stats</div>
        <div className="text-sm text-muted-foreground">{error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      {/* Current Price */}
      <StatItem
        label="Current Price"
        value={formatPrice(stats.currentPrice)}
        isLoading={loading}
      />
      
      {/* Market Cap */}
      <StatItem
        label="Market Cap"
        value={formatMarketCap(stats.marketCap)}
        isLoading={loading}
      />
      
      {/* 24h Volume */}
      <StatItem
        label="24h Volume"
        value={formatMarketCap(stats.volume24h)}
        isLoading={loading}
      />
      
      {/* Total Trades */}
      <StatItem
        label="Total Trades"
        value={formatNumber(stats.totalTrades)}
        isLoading={loading}
      />
      
      {/* Unique Holders */}
      <StatItem
        label="Unique Holders"
        value={formatNumber(stats.uniqueHolders)}
        isLoading={loading}
      />
      
      {/* Total Upvotes */}
      <StatItem
        label="Total Upvotes"
        value={formatNumber(stats.totalUpvotes)}
        isLoading={loading}
      />
      
      {/* Last Updated Indicator */}
      {!loading && (
        <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border/20">
          Last updated: {new Date(stats.lastUpdated).toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}
