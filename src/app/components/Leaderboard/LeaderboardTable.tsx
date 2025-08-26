
import type { LeaderboardEntry } from '../../config/types'
import { formatNumber } from '../../utils/formatters'
import { components, layout } from '../../theme'
import { useState, useEffect } from 'react'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  isLoading: boolean
}

export function LeaderboardTable({ entries, isLoading }: LeaderboardTableProps) {
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <div className="flex items-center justify-center gap-2">
          <span className="animate-spin">⏳</span>
          Loading leaderboard...
        </div>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        No data available for this period
      </div>
    )
  }

  return (
    <div className="max-h-96 min-h-48 overflow-y-auto">
      <table className="w-full border-collapse">
        <thead className="bg-card/60">
          <tr className="border-b-2 border-primary/20">
            <th className="p-3 text-left text-sm font-semibold uppercase tracking-wider text-primary">Rank</th>
            <th className="p-3 text-left text-sm font-semibold uppercase tracking-wider text-primary">Wallet/Handle</th>
            <th className="p-3 text-left text-sm font-semibold uppercase tracking-wider text-primary">Transactions</th>
            <th className="p-3 text-left text-sm font-semibold uppercase tracking-wider text-primary">Total WANKR</th>
            <th className="p-3 text-left text-sm font-semibold uppercase tracking-wider text-primary">Link</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-primary/10">
          {entries.map((entry) => (
            <tr key={entry.address} className="transition-colors hover:bg-card/30">
              <td className="p-3 font-bold text-primary">#{entry.rank}</td>
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <div className="font-medium text-foreground">{entry.displayName}</div>
                  {entry.source !== 'shortened' && (
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                      entry.source === 'farcaster' 
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {entry.source === 'farcaster' ? 'FC' : 'BN'}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground font-mono mt-1">
                  {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                </div>
              </td>
              <td className="p-3 text-sm text-muted-foreground">{formatNumber(entry.transactionCount)} tx</td>
              <td className="p-3 font-semibold text-primary">{formatNumber(parseFloat(entry.totalWankr))} WANKR</td>
              <td className="p-3">
                <a 
                  href={`https://basescan.org/address/${entry.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded bg-primary/20 px-2 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/30"
                >
                  🔗
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
