"use client"

import Link from 'next/link'
import { NewHeader } from './components/layout/NewHeader'
import { ShameFeedNew } from './components/ShameFeed/ShameFeedNew'
import { SendWankr } from './components/SendWankr/SendWankr'
import { Leaderboard } from './components/Leaderboard/Leaderboard'
import { DuneUpvoteChart } from './components/DuneUpvoteChart/DuneUpvoteChart'
import { QuickStats } from './components/QuickStats/QuickStats'
import { ErrorBoundary } from './components/ErrorBoundary'

export default function HomeNew() {
  return (
    <div className="min-h-screen text-foreground relative overflow-hidden bg-background">
      {/* Soft gradient blobs - from original repo */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div 
          className="absolute -top-32 -left-32 h-96 w-96 rounded-full blur-3xl float-animation"
          style={{background:'radial-gradient(circle,#F06BF2,transparent 70%)'}} 
        />
        <div 
          className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full blur-3xl float-animation"
          style={{background:'radial-gradient(circle,#04588C,transparent 70%)', animationDelay: '3s'}} 
        />
      </div>
      
      <NewHeader />
      
      <main className="pt-8 px-3 md:px-4 pb-6 md:pb-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="font-wankr text-2xl font-bold text-primary mb-2">WANKR Dashboard</h1>
          </div>
          
          {/* Primary Grid - Three Equal Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Shame Feed - 1/3 */}
            <div className="md:col-span-1">
              <div className="glassmorphism-dark rounded-xl p-3 md:p-4 h-[350px] md:h-[450px] overflow-hidden shadow-xl smooth-transition hover:shadow-2xl card-hover border border-border/30">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <h2 className="font-wankr text-2xl md:text-3xl font-semibold text-primary">Live Shame Feed</h2>
                  <div className="text-xs text-muted-foreground bg-primary/10 px-2 py-1 rounded-full pulse-glow">Real-time</div>
                </div>
                <ErrorBoundary><ShameFeedNew /></ErrorBoundary>
              </div>
            </div>
            
            {/* Send Shame - 1/3 */}
            <div className="md:col-span-1">
              <div className="glassmorphism-dark rounded-xl p-3 md:p-4 h-[350px] md:h-[450px] shadow-xl smooth-transition hover:shadow-2xl card-hover border border-border/30">
                <h2 className="font-wankr text-2xl md:text-3xl font-semibold text-primary mb-3 md:mb-4">Send Shame</h2>
                <ErrorBoundary><SendWankr /></ErrorBoundary>
              </div>
            </div>
            
            {/* Quick Stats Component */}
            <div className="md:col-span-2 lg:col-span-1">
              <div className="glassmorphism-dark rounded-xl p-3 md:p-4 h-[350px] md:h-[450px] shadow-xl smooth-transition hover:shadow-2xl card-hover border border-border/30">
                <h2 className="font-wankr text-2xl md:text-3xl font-semibold text-primary mb-3 md:mb-4">Quick Stats</h2>
                <ErrorBoundary>
                  <QuickStats />
                </ErrorBoundary>
              </div>
            </div>
          </div>
          
          {/* Secondary Grid - Upvote Chart and Leaderboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Upvote Chart */}
            <div className="glassmorphism-dark rounded-xl p-3 md:p-4 shadow-xl smooth-transition hover:shadow-2xl card-hover border border-border/30">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h2 className="font-wankr text-2xl md:text-3xl font-semibold text-primary">Upvote Analytics</h2>
                <div className="text-xs text-muted-foreground bg-primary/10 px-2 py-1 rounded-full">Dune Data</div>
              </div>
              <div className="h-[400px] md:h-[500px]">
                <ErrorBoundary>
                  <DuneUpvoteChart
                    startDate="2025-06-20"
                    endDate="2025-08-21"
                    className="w-full h-full"
                  />
                </ErrorBoundary>
              </div>
            </div>
            
            {/* Leaderboard */}
            <div className="glassmorphism-dark rounded-xl p-3 md:p-4 shadow-xl smooth-transition hover:shadow-2xl card-hover border border-border/30">
              <h2 className="font-wankr text-2xl md:text-3xl font-semibold text-primary mb-3 md:mb-4">Top $WANKR&apos;s</h2>
              <ErrorBoundary>
                <Leaderboard />
              </ErrorBoundary>
            </div>
          </div>
          
          {/* Third Row - DexScreener Chart */}
          <div className="grid grid-cols-1 gap-4">
            <div className="glassmorphism-dark rounded-xl p-3 md:p-4 shadow-xl smooth-transition hover:shadow-2xl card-hover border border-border/30">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h2 className="font-wankr text-2xl md:text-3xl font-semibold text-primary">$WANKR Price Chart</h2>
                <div className="text-xs text-muted-foreground bg-primary/10 px-2 py-1 rounded-full">DexScreener</div>
              </div>
              <div className="h-[400px] md:h-[500px]">
                <style jsx>{`
                  #dexscreener-embed {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                  }
                  #dexscreener-embed iframe {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    top: 0;
                    left: 0;
                    border: 0;
                    border-radius: 0.5rem;
                    transform: scale(1.02);
                    transform-origin: center;
                  }
                `}</style>
                <div id="dexscreener-embed">
                  <iframe
                    src="https://dexscreener.com/base/0x888AC1fF2De3e880004765A7667f95e494f82C44?embed=1&loadChartSettings=0&trades=0&info=0&chartLeftToolbar=0&chartTheme=dark&theme=dark&chartStyle=0&chartType=usd&interval=60"
                    title="WANKR Price Chart"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
