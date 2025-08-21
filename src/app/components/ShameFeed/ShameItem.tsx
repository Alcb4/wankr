
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
      rounded-lg p-3 sm:p-4 transition-all duration-300 backdrop-blur-md mb-3 min-h-12
      ${isNew 
        ? 'bg-primary/10 border border-primary/60 animate-pulse' 
        : 'bg-card/50 border border-border hover:bg-card/70'
      }
    `}>
      {/* Mobile-first responsive layout */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 h-full">
        {/* Left side - transaction details */}
        <div className="flex-1 min-w-0">
          {/* Transaction line - responsive text sizes */}
          <div className="text-sm sm:text-base text-muted-foreground flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
            <span className="text-primary font-semibold break-all">{fromDisplay}</span>
            <span className="text-secondary font-medium text-xs uppercase tracking-wider">shamed</span>
            <span className="text-primary font-semibold break-all">{toDisplay}</span>
          </div>
          
          {/* Dedicated shame message line */}
          <div className="min-h-4 mb-2 flex items-center">
            {shame.message && (
              <div className="text-foreground italic leading-tight text-sm sm:text-base flex-1 min-w-0 break-words">
                {`"${shame.message}"`}
              </div>
            )}
          </div>
          
          {/* Time and link line */}
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
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
            <div className="mt-2">
              <span className={components.badge.destructive}>
                {judgmentHTML}
              </span>
            </div>
          )}
        </div>
        
        {/* Right side - amount and comment (stacked on mobile, side-by-side on desktop) */}
        <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-2 sm:gap-1 sm:ml-2 flex-shrink-0 self-stretch sm:self-center">
          {/* Amount comment - hidden on mobile to save space */}
          <div className="hidden sm:flex flex-col items-center justify-center">
            <div className="text-xs font-medium text-center opacity-80 text-secondary leading-tight max-w-16">
              {getWankrAmountComment(shame.amount.toString())}
            </div>
          </div>
          
          {/* Amount */}
          <div className="flex flex-col items-center gap-1 justify-center">
            <div className="text-lg sm:text-xl font-extrabold leading-none text-primary">
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
