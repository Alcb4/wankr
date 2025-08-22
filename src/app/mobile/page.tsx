"use client"

import { MobileLayout, MobileCard, MobileSection, MobileGrid, MobileButton } from '../components/layout/MobileLayout'
import { ShameFeedNew } from '../components/ShameFeed/ShameFeedNew'
import { SendWankr } from '../components/SendWankr/SendWankr'
import { QuickStats } from '../components/QuickStats/QuickStats'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { useState } from 'react'

type ActiveTab = 'shame-feed' | 'send-shame' | 'stats'

export default function MobileDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('shame-feed')

  const renderTabContent = () => {
    switch (activeTab) {
      case 'shame-feed':
        return (
          <MobileCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-primary">Live Shame Feed</h2>
              <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                Real-time
              </div>
            </div>
            <div className="h-[60vh] overflow-y-auto">
              <ErrorBoundary>
                <ShameFeedNew />
              </ErrorBoundary>
            </div>
          </MobileCard>
        )
      
      case 'send-shame':
        return (
          <MobileCard>
            <h2 className="text-xl font-bold text-primary mb-4">Send Shame</h2>
            <div className="h-[60vh] overflow-y-auto">
              <ErrorBoundary>
                <SendWankr />
              </ErrorBoundary>
            </div>
          </MobileCard>
        )
      
      case 'stats':
        return (
          <MobileCard>
            <h2 className="text-xl font-bold text-primary mb-4">Quick Stats</h2>
            <div className="h-[60vh] overflow-y-auto">
              <ErrorBoundary>
                <QuickStats />
              </ErrorBoundary>
            </div>
          </MobileCard>
        )
      
      default:
        return null
    }
  }

  return (
    <MobileLayout showNavigation={false}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-primary">WANKR Mobile</h1>
            <p className="text-xs text-muted-foreground">Shame-as-a-Service</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-4 py-2 bg-card/50 border-b border-border">
        <div className="flex gap-1">
          {(['shame-feed', 'send-shame', 'stats'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card'
              }`}
            >
              {tab === 'shame-feed' && 'Shame Feed'}
              {tab === 'send-shame' && 'Send Shame'}
              {tab === 'stats' && 'Stats'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <MobileSection>
        {renderTabContent()}
      </MobileSection>

      {/* Quick Actions */}
      <MobileSection className="pt-0">
        <MobileCard>
          <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
          <MobileGrid>
            <MobileButton
              variant="primary"
              onClick={() => window.open('https://swap.cow.fi/#/8453/swap/ETH/Wankr', '_blank')}
            >
              🚀 Buy $WANKR
            </MobileButton>
            <MobileButton
              variant="outline"
              onClick={() => window.open('https://github.com/mrpapawheelie/wankr/blob/main/assets/WANKR_Whitepaper.pdf', '_blank')}
            >
              📄 Read Whitepaper
            </MobileButton>
            <MobileButton
              variant="secondary"
              onClick={() => window.open('https://x.com/wankergyatt', '_blank')}
            >
              🐦 Follow @wankergyatt
            </MobileButton>
          </MobileGrid>
        </MobileCard>
      </MobileSection>
    </MobileLayout>
  )
}
