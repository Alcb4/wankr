"use client"

import { useShameFeed } from '../../hooks/useShameFeed'
import { ShameItemNew } from './ShameItemNew'

export function ShameFeedNew() {
  const { transactions, loading, error } = useShameFeed()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-muted-foreground">Loading shame feed...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-destructive">Error loading shame feed</div>
      </div>
    )
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-muted-foreground">No shame transactions yet</div>
      </div>
    )
  }

  return (
    <div className="relative h-full shame-feed-container">
      <div className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
        <div className="space-y-2 pb-8 px-2">
          {transactions.map((shame, index) => (
            <div
              key={shame.hash}
              className="animate-fade-in-up shame-item-wrapper"
              style={{
                animationDelay: `${index * 0.1}s`,
                animationFillMode: 'both'
              }}
            >
              <ShameItemNew shame={shame} />
            </div>
          ))}
        </div>
      </div>
      
      {/* Enhanced fade effect at bottom */}
      <div className="absolute bottom-0 left-0 right-2 h-16 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none"></div>
      
      {/* Subtle fade at top for symmetry */}
      <div className="absolute top-0 left-0 right-2 h-4 bg-gradient-to-b from-background/60 to-transparent pointer-events-none"></div>
    </div>
  )
}
