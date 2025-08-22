"use client"

import type { ShameTransaction } from '../../types/shame-feed'
import { shortenAddress, getTimeAgo, formatWankr, getWankrAmountComment } from '../../utils/formatters'

interface ShameItemNewProps {
  shame: ShameTransaction
  isNew?: boolean
}

export function ShameItemNew({ shame, isNew = false }: ShameItemNewProps) {
  const fromDisplay = shame.fromDisplayName || shortenAddress(shame.from)
  const toDisplay = shame.toDisplayName || shortenAddress(shame.to)
  const timeAgo = getTimeAgo(shame.timestamp)
  const judgmentHTML = shame.judgment ? `${shame.judgment}/10` : ''
  const amount = formatWankr(shame.amount.toString())
  
  const transactionLink = shame.hash && !shame.hash.startsWith('blockchain-') ? 
    `https://basescan.org/tx/${shame.hash}` : ''

  return (
    <div className={`
      group relative p-3 rounded-lg border transition-all duration-300 ease-out
      bg-card/30 border-border/50 hover:bg-card/50 hover:border-border
      hover:shadow-lg hover:scale-[1.01] hover:-translate-y-0.5
      h-[120px] flex flex-col justify-between
      backdrop-blur-sm
      transform-gpu
    `}
    style={{ transformOrigin: 'center center' }}
    >
      {/* Top Row: From -> To with Amount */}
      <div className="flex items-center justify-between">
        {/* Left: Transaction Flow */}
        <div className="flex items-center gap-2 flex-1">
          {/* From Address */}
          <div className="text-xs font-medium text-muted-foreground truncate max-w-[80px] transition-colors group-hover:text-foreground">
            {fromDisplay}
          </div>
          
          {/* Arrow */}
          <div className="flex-shrink-0 transition-transform group-hover:scale-110">
            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m0 0l-7-7m7 7l-7 7" />
            </svg>
          </div>
          
          {/* To Address */}
          <div className="text-xs font-medium text-muted-foreground truncate max-w-[80px] transition-colors group-hover:text-foreground">
            {toDisplay}
          </div>
        </div>
        
        {/* Right: Amount */}
        <div className="flex flex-col items-end">
          <div className="text-lg font-bold text-primary transition-all duration-300 group-hover:scale-110">
            {amount}
          </div>
          <div className="text-xs font-semibold text-primary uppercase tracking-wider">
            WANKR
          </div>
        </div>
      </div>
      
      {/* Middle Row: Message or Comment */}
      <div className="flex-1 flex items-center">
        {shame.message ? (
          <div className="text-sm text-foreground/80 italic leading-relaxed transition-colors group-hover:text-foreground/90">
            &ldquo;{shame.message}&rdquo;
          </div>
        ) : (
          <div className="flex-1"></div>
        )}
      </div>
      
      {/* Bottom Row: Time and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex-1"></div>
        
        <div className="flex flex-col items-end gap-1">
          {/* Amount Comment */}
          {getWankrAmountComment(shame.amount.toString()) && (
            <div className="text-xs text-cyan-400 font-medium transition-all duration-300 group-hover:scale-105">
              {getWankrAmountComment(shame.amount.toString())}
            </div>
          )}
          
          {/* Time and Actions */}
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground transition-colors group-hover:text-foreground/80">
              {timeAgo}
            </div>
            
            {transactionLink && (
              <a 
                href={transactionLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-110"
                title="View on BaseScan"
              >
                🔗
              </a>
            )}
            
            {judgmentHTML && (
              <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded transition-all duration-300 group-hover:bg-destructive/20 group-hover:scale-105">
                {judgmentHTML}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
