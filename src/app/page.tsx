"use client"

import { Header } from './components/layout/Header'
import { WalletSection } from './components/layout/WalletSection'
import { MainContent } from './components/layout/MainContent'
import { BoxContainer } from './components/layout/BoxContainer'
import { SectionTitle } from './components/layout/SectionTitle'
import { ShameFeed } from './components/ShameFeed/ShameFeed'
import { SendWankr } from './components/SendWankr/SendWankr'
import { Leaderboard } from './components/Leaderboard/Leaderboard'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Footer } from './components/layout/Footer'
import { WalletConnect } from './components/Wallet/WalletConnect'

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Soft gradient blobs - from original repo */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div 
          className="absolute -top-32 -left-32 h-96 w-96 rounded-full blur-3xl"
          style={{background:'radial-gradient(circle,#F06BF2,transparent 70%)'}} 
        />
        <div 
          className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full blur-3xl"
          style={{background:'radial-gradient(circle,#04588C,transparent 70%)'}} 
        />
      </div>
      
      <Header />
      
      <MainContent>
        <WalletSection>
          <WalletConnect />
        </WalletSection>
        
        {/* Mobile-first grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-4 lg:mb-6">
          <BoxContainer padding="lg" minHeight="400px">
            <SectionTitle>Live Shame Feed</SectionTitle>
            <ErrorBoundary>
              <ShameFeed />
            </ErrorBoundary>
          </BoxContainer>
          
          <BoxContainer padding="lg" minHeight="400px">
            <SectionTitle>Send Shame</SectionTitle>
            <ErrorBoundary>
              <SendWankr />
            </ErrorBoundary>
          </BoxContainer>
        </div>
        
        <BoxContainer padding="lg" minHeight="400px" style={{ width: '100%' }}>
          <SectionTitle>Top $WANKR&apos;s</SectionTitle>
          <ErrorBoundary>
            <Leaderboard />
          </ErrorBoundary>
        </BoxContainer>
      </MainContent>
      
      <Footer />
    </div>
  )
}
