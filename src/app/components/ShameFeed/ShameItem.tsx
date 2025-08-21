
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
      {/* Main content - three-line layout */}
      <div className="flex flex-col gap-1">
        {/* Line 1: Transaction */}
        <div className="flex justify-between items-baseline">
          <div className="text-sm text-muted-foreground flex items-center gap-3">
            <span className="text-primary font-semibold break-all">{fromDisplay}</span>
            <span className="text-secondary font-medium text-xs uppercase tracking-wider">shamed</span>
            <span className="text-primary font-semibold break-all">{toDisplay}</span>
            <span className="text-xs font-medium text-cyan-400 leading-tight ml-4">
              {getWankrAmountComment(shame.amount.toString())}
            </span>
          </div>
          <div className="flex flex-col items-start justify-start">
            <div className="text-2xl font-extrabold leading-none text-primary text-center">
              {amount}
            </div>
            <div className="text-sm font-semibold uppercase tracking-wider opacity-90 text-primary text-center">
              WANKR
            </div>
          </div>
        </div>
        
        {/* Line 2: Message */}
        <div className="flex items-center min-h-3">
          <div className="text-foreground italic text-sm break-words">
            {shame.message ? `"${shame.message}"` : ''}
          </div>
        </div>
        
        {/* Line 3: Timestamp and link */}
        <div className="flex items-center gap-2 text-xs">
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
              🔗
            </a>
          )}
          
          {judgmentHTML && (
            <span className={components.badge.destructive}>
              {judgmentHTML}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
