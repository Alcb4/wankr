
import type { LeaderboardEntry } from '../../config/types'
import { formatNumber } from '../../utils/formatters'
import { components, layout } from '../../theme'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  isLoading: boolean
}

export function LeaderboardTable({ entries, isLoading }: LeaderboardTableProps) {
  if (isLoading) {
    return (
      <div className={layout.flex.center + ' py-8 text-muted-foreground'}>
        <div className="flex items-center justify-center gap-2">
          <span className="animate-spin">⏳</span>
          Loading leaderboard...
        </div>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className={layout.flex.center + ' py-8 text-muted-foreground'}>
        No data available for this period
      </div>
    )
  }

  return (
    <div className="max-h-96 overflow-y-auto min-h-48">
      {/* Desktop Table View */}
      <div className="hidden sm:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className={components.table.header}>
              <th className={components.table.header}>
                Rank
              </th>
              <th className={components.table.header}>
                Wallet/Handle
              </th>
              <th className={components.table.header}>
                Transactions
              </th>
              <th className={components.table.header}>
                Total WANKR
              </th>
              <th className={components.table.header}>
                Link
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.address} className={components.table.row}>
                <td className={components.table.cell + ' font-bold text-primary'}>
                  #{entry.rank}
                </td>
                <td className={components.table.cell}>
                  <div>
                    <div className="font-medium text-foreground">
                      {entry.displayName}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {entry.source}
                    </div>
                  </div>
                </td>
                <td className={components.table.cell + ' text-muted-foreground text-sm'}>
                  {formatNumber(entry.transactionCount)} tx
                </td>
                <td className={components.table.cell + ' font-semibold text-primary'}>
                  {formatNumber(parseFloat(entry.totalWankr))} WANKR
                </td>
                <td className={components.table.cell}>
                  <a 
                    href={`https://basescan.org/address/${entry.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={components.badge.primary + ' hover:bg-primary/20 hover:border-primary/40'}
                  >
                    🔗
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-3">
        {entries.map((entry) => (
          <div key={entry.address} className="bg-card/50 border border-border rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-3">
                <span className="font-bold text-primary text-lg">#{entry.rank}</span>
                <div>
                  <div className="font-medium text-foreground">
                    {entry.displayName}
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {entry.source}
                  </div>
                </div>
              </div>
              <a 
                href={`https://basescan.org/address/${entry.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className={components.badge.primary + ' hover:bg-primary/20 hover:border-primary/40'}
              >
                🔗
              </a>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {formatNumber(entry.transactionCount)} transactions
              </div>
              <div className="font-semibold text-primary">
                {formatNumber(parseFloat(entry.totalWankr))} WANKR
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
