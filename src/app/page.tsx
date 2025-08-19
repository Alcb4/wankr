"use client"

import { Header } from './components/layout/Header'
import { Footer } from './components/layout/Footer'
import { PageContainer } from './components/layout/PageContainer'
import { MainContent } from './components/layout/MainContent'
import { WalletSection } from './components/layout/WalletSection'
import { BoxContainer } from './components/layout/BoxContainer'
import { SectionTitle } from './components/layout/SectionTitle'
import { ShameFeed } from './components/ShameFeed/ShameFeed'
import { SendWankr } from './components/SendWankr/SendWankr'
import { Leaderboard } from './components/Leaderboard/Leaderboard'
import { WalletConnect } from './components/Wallet/WalletConnect'
import { ErrorBoundary } from './components/ErrorBoundary'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-section">
      <PageContainer>
        <Header />
        <WalletSection>
          <WalletConnect />
        </WalletSection>
        <MainContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <BoxContainer minHeight="350px" padding="1.75rem">
              <SectionTitle>🎭 Live Shame Feed</SectionTitle>
              <ErrorBoundary>
                <ShameFeed />
              </ErrorBoundary>
            </BoxContainer>
            
            <BoxContainer minHeight="350px" padding="1.75rem">
              <SectionTitle>🎭 Deliver Shame</SectionTitle>
              <ErrorBoundary>
                <SendWankr />
              </ErrorBoundary>
            </BoxContainer>
          </div>
          
          <BoxContainer padding="1.75rem" style={{ width: '100%' }}>
            <SectionTitle textAlign="center">🏆 Leaderboards</SectionTitle>
            <ErrorBoundary>
              <Leaderboard />
            </ErrorBoundary>
          </BoxContainer>
        </MainContent>
        <Footer />
      </PageContainer>
    </div>
  )
}
