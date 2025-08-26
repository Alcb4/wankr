"use client"

import { useState } from 'react'
import { useLeaderboard } from '../../hooks/useLeaderboard'
import { LeaderboardTable } from './LeaderboardTable'
import { Button } from '../ui'
import { components, layout } from '../../theme'

export function Leaderboard() {
  const {
    currentLeaderboard,
    isLoading,
    error,
    activeTab,
    timePeriod,
    setActiveTab,
    changeTimePeriod
  } = useLeaderboard()

  const [showAll, setShowAll] = useState(false)
  const displayedEntries = showAll ? currentLeaderboard : currentLeaderboard.slice(0, 10)

  if (error) {
    return (
      <div className={layout.flex.center + ' py-8 text-destructive'}>
        <div>Error: {error}</div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className={layout.flex.between + ' border-b border-border pb-4 mb-4'}>
        {/* Tab Buttons */}
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'received' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('received')}
            className={activeTab === 'received' ? 'bg-red-500 hover:bg-red-600 text-white' : ''}
          >
            📉 Biggest Wankrs
          </Button>
          <Button
            variant={activeTab === 'sent' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('sent')}
            className={activeTab === 'sent' ? 'bg-green-500 hover:bg-green-600 text-white' : ''}
          >
            📈 Top Shame Soldiers
          </Button>
        </div>

        {/* Time Period Select */}
        <div className="flex items-center gap-2">
          <select
            value={timePeriod}
            onChange={(e) => changeTimePeriod(e.target.value)}
            className={components.input.base + ' text-sm'}
          >
            <option value="all">All Time</option>
            <option value="week">This Week</option>
            <option value="day">Today</option>
          </select>
        </div>
      </div>

      {/* Leaderboard Table */}
      <LeaderboardTable 
        entries={displayedEntries} 
        isLoading={isLoading} 
      />

      {/* Expand Button */}
      {currentLeaderboard.length > 10 && (
        <div className={layout.flex.center + ' mt-4'}>
          <Button
            variant="secondary"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? `Show Top 10` : `Show All ${currentLeaderboard.length}`}
          </Button>
        </div>
      )}
    </div>
  )
}
