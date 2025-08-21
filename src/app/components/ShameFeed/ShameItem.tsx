
import type { ShameTransaction } from '../../types/shame-feed'
import { shortenAddress, getTimeAgo, formatWankr, getWankrAmountComment } from '../../utils/formatters'
import { components } from '../../theme'

interface ShameItemProps {
  shame: ShameTransaction
  isNew?: boolean
}

export function ShameItem({ shame, isNew = false }: ShameItemProps) {
  // Debug logging for message display
  if (shame.message) {
    console.log('📝 ShameItem received message:', { 
      hash: shame.hash?.slice(0, 10) + '...', 
      message: shame.message,
      amount: shame.amount 
    })
  }
  
  const fromDisplay = shame.fromDisplayName || shortenAddress(shame.from)
  const toDisplay = shame.toDisplayName || shortenAddress(shame.to)
  const timeAgo = getTimeAgo(shame.timestamp)
  const judgmentHTML = shame.judgment ? `${shame.judgment}/10` : ''
  const amount = formatWankr(shame.amount.toString())
  
  const transactionLink = shame.hash && !shame.hash.startsWith('blockchain-') ? 
    `https://basescan.org/tx/${shame.hash}` : ''

  return (
    <div className={`
      rounded-lg p-3 transition-all duration-300 backdrop-blur-md mb-2
      ${isNew 
        ? 'bg-primary/10 border border-primary/60 animate-pulse' 
        : 'bg-card/50 border border-border hover:bg-card/70'
      }
    `}>
      {/* Main content - natural flow layout */}
      <div className="flex items-start gap-3">
        {/* Left side - transaction details */}
        <div className="flex-1 min-w-0">
          {/* Transaction line */}
          <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-2 mb-1">
            <span className="text-primary font-semibold break-all">{fromDisplay}</span>
            <span className="text-secondary font-medium text-xs uppercase tracking-wider">shamed</span>
            <span className="text-primary font-semibold break-all">{toDisplay}</span>
          </div>
          
          {/* Shame message */}
          {shame.message && (
            <div className="text-foreground italic text-sm mb-2 break-words">
              {`"${shame.message}"`}
            </div>
          )}
          
          {/* Bottom row - time, link, and judgment */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="text-muted-foreground font-medium">
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
            
            {judgmentHTML && (
              <span className={components.badge.destructive}>
                {judgmentHTML}
              </span>
            )}
          </div>
        </div>
        
        {/* Right side - amount and comment */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {/* Amount comment - only show on desktop */}
          <div className="hidden sm:block">
            <div className="text-xs font-medium text-right opacity-80 text-secondary leading-tight max-w-16">
              {getWankrAmountComment(shame.amount.toString())}
            </div>
          </div>
          
          {/* Amount */}
          <div className="flex flex-col items-end gap-0.5">
            <div className="text-lg font-extrabold leading-none text-primary">
              {amount}
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider opacity-90 text-primary">
              WANKR
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
