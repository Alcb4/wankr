
import type { ShameTransaction } from '../../types/shame-feed'
import { shortenAddress, getTimeAgo, formatWankr, getWankrAmountComment } from '../../utils/formatters'
import { components } from '../../theme'

interface ShameItemProps {
  shame: ShameTransaction
  isNew?: boolean
}

export function ShameItem({ shame, isNew = false }: ShameItemProps) {
  const fromDisplay = shame.fromDisplayName || shortenAddress(shame.from)
  const toDisplay = shame.toDisplayName || shortenAddress(shame.to)
  const timeAgo = getTimeAgo(shame.timestamp)
  const judgmentHTML = shame.judgment ? `${shame.judgment}/10` : ''
  const amount = formatWankr(shame.amount.toString())
  
  const transactionLink = shame.hash ? 
    `https://basescan.org/tx/${shame.hash}` : ''

  return (
    <div className={`
      rounded-lg p-3 transition-all duration-300 backdrop-blur-md mb-2 min-h-12
      ${isNew 
        ? 'bg-primary/10 border border-primary/60 animate-pulse' 
        : 'bg-card/50 border border-border hover:bg-card/70'
      }
    `}>
      {/* Main content - single row layout */}
      <div className="flex justify-between items-center gap-3 h-full">
        {/* Left side - transaction details */}
        <div className="flex-1 min-w-0">
          {/* Transaction line */}
          <div className="text-sm text-muted-foreground flex items-center gap-3 mb-1">
            <span className="text-primary font-semibold">{fromDisplay}</span>
            <span className="text-secondary font-medium text-xs uppercase tracking-wider">shamed</span>
            <span className="text-primary font-semibold">{toDisplay}</span>
          </div>
          
          {/* Dedicated shame message line */}
          <div className="min-h-4 mb-1 flex items-center">
            {shame.message && (
              <div className="text-foreground italic leading-tight text-sm flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                {`"${shame.message}"`}
              </div>
            )}
          </div>
          
          {/* Time and link line */}
          <div className="flex items-center gap-2 text-xs">
            <div className="text-muted-foreground font-medium whitespace-nowrap">
              {timeAgo}
            </div>
            
            {transactionLink && (
              <a 
                href={transactionLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className={components.badge.primary + ' hover:bg-primary/20 hover:border-primary/40'}
                title="View on BaseScan"
              >
                🔗 View
              </a>
            )}
          </div>
          
          {judgmentHTML && (
            <div className="mt-1">
              <span className={components.badge.destructive}>
                {judgmentHTML}
              </span>
            </div>
          )}
        </div>
        
        {/* Center - amount comment */}
        <div className="flex flex-col items-center justify-center flex-shrink-0">
          <div className="text-xs font-medium text-center opacity-80 text-secondary leading-tight max-w-16">
            {getWankrAmountComment(shame.amount.toString())}
          </div>
        </div>
        
        {/* Right side - amount */}
        <div className="flex flex-col items-center gap-1 ml-2 flex-shrink-0 justify-center self-center">
          <div className="text-xl font-extrabold leading-none text-primary">
            {amount}
          </div>
          <div className="text-xs font-semibold uppercase tracking-wider opacity-90 text-primary">
            WANKR
          </div>
        </div>
      </div>
    </div>
  )
}
