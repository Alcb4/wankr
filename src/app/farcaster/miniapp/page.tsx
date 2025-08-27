// src/app/farcaster/miniapp/page.tsx

"use client"

import { useState, useEffect, Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { SendWankr } from '../../components/SendWankr/SendWankr'
import { shameScoreService } from '../../services/shameScoreService'
import { verificationService } from '../../services/verificationService'
import { useFarcasterLeaderboard } from '../../hooks/useFarcasterLeaderboard'
import { useUserStats } from '../../hooks/useUserStats'
import { Send, User, Search, Trophy, BarChart3, TrendingUp, TrendingDown } from 'lucide-react'

// Import Farcaster Mini App SDK
import { sdk } from '@farcaster/miniapp-sdk'

interface FrameContext {
  targetAddress?: string
  targetHandle?: string
  postId?: string
  castId?: string
  authorFid?: string
  context?: 'frame' | 'standalone'
}

interface UserProfile {
  handle: string
  address: string
  shameScore: number
  verificationLevel: 'unverified' | 'verified' | 'trusted'
  shameFreeStreak: number
  totalShamesSent: number
  totalShamesReceived: number
  wankrSent: string
  wankrReceived: string
  lastActivity: string
  verificationBadge: boolean
  checkInStreak: number
  totalCheckIns: number
  lastCheckIn: number
  canCheckIn: boolean
  timeUntilNextCheckIn: string
}

type TabType = 'send' | 'profile' | 'verify' | 'leaderboard' | 'analytics'

function FarcasterMiniAppContent() {
  const searchParams = useSearchParams()
  const frameContext: FrameContext = useMemo(() => ({
    targetAddress: searchParams.get('target') || undefined,
    targetHandle: searchParams.get('handle') || undefined,
    postId: searchParams.get('postId') || undefined,
    castId: searchParams.get('castId') || undefined,
    authorFid: searchParams.get('authorFid') || undefined,
    context: (searchParams.get('context') as 'frame' | 'standalone') || 'standalone'
  }), [searchParams])

  // State management
  const [activeTab, setActiveTab] = useState<TabType>('send')
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string>('')
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isAppReady, setIsAppReady] = useState(false)
  
  // Real user stats from on-chain data
  const { stats: realUserStats, isLoading: isLoadingRealStats, error: statsError, refreshStats } = useUserStats(address || null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserProfile | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [showCheckInNotification, setShowCheckInNotification] = useState(false)
  const [hasCheckedIn, setHasCheckedIn] = useState(false)
  const [currentStreakInfo, setCurrentStreakInfo] = useState<{
    message: string
    emoji: string
    color: string
  } | null>(null)
  const [sendShameTarget, setSendShameTarget] = useState<string>('')

  // Leaderboard data
  const {
    topEntries,
    isLoading: isLeaderboardLoading,
    error: leaderboardError,
    activeTab: leaderboardTab,
    timePeriod,
    setActiveTab: setLeaderboardTab,
    changeTimePeriod,
    refresh: refreshLeaderboard
  } = useFarcasterLeaderboard()

  // FIXED: Initialize Farcaster Mini App and call ready()
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize Farcaster wallet connection
        const accounts = await sdk.wallet.ethProvider.request({ method: 'eth_accounts' })
        
        if (accounts && accounts.length > 0) {
          setIsConnected(true)
          setAddress(accounts[0])
          console.log('✅ Farcaster wallet connected:', accounts[0])
        } else {
          console.log('⚠️ No Farcaster wallet connected')
          // For testing, use demo address
          setAddress('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')
          setIsConnected(true)
        }

        // Call ready() to hide splash screen
        await sdk.actions.ready()
        setIsAppReady(true)
        console.log('✅ Mini App ready - splash screen hidden')
        
      } catch (error) {
        console.error('❌ Failed to initialize Mini App:', error)
        // Still call ready() even if wallet connection fails
        try {
          await sdk.actions.ready()
          setIsAppReady(true)
        } catch (readyError) {
          console.error('❌ Failed to call ready():', readyError)
        }
      }
    }

    initializeApp()
  }, [])

  // FIXED: Show check-in immediately on app load, then load site data
  useEffect(() => {
    if (!isAppReady) return // Wait for app to be ready

    const performAutoCheckIn = async () => {
      try {
        // Show check-in notification immediately
        setShowCheckInNotification(true)
        
        // Simulate auto check-in
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Get current streak day for messaging
        const currentStreak = realUserStats?.checkInStreak || 0
        const newStreak = currentStreak + 1
        const streakInfo = verificationService.getStreakDayMessage(newStreak)
        
        setHasCheckedIn(true)
        
        // Store streak info for display
        setCurrentStreakInfo(streakInfo)
        
        // Hide notification after 4 seconds (longer for milestone messages)
        setTimeout(() => {
          setShowCheckInNotification(false)
        }, 4000)
      } catch (error) {
        console.error('Auto check-in failed:', error)
      }
    }

    // Perform check-in immediately when component mounts
    performAutoCheckIn()
  }, [isAppReady, realUserStats?.checkInStreak]) // Added isAppReady dependency

  // Load user profile in background
  const loadUserProfile = async () => {
    if (!isAppReady) return // Wait for app to be ready
    
    setIsLoadingProfile(true)
    try {
      // Use connected address or demo address
      const userAddress = address || '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
      setAddress(userAddress)
      
      // Real data will be loaded via useUserStats hook
      // The hook will automatically fetch data when address is set
    } catch (error) {
      console.error('Failed to load profile:', error)
    } finally {
      setIsLoadingProfile(false)
    }
  }

  useEffect(() => {
    // Load profile data in background after check-in
    const timer = setTimeout(() => {
      loadUserProfile()
    }, 100) // Small delay to ensure check-in shows first
    
    return () => clearTimeout(timer)
  }, [frameContext, isAppReady, address])

  // Search functionality
  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockAddress = '0x' + Math.random().toString(16).slice(2, 42)
      const mockTransactions = Array.from({ length: Math.floor(Math.random() * 20) }, (_, i) => ({
        from: Math.random() > 0.6 ? mockAddress : '0x' + Math.random().toString(16).slice(2, 42),
        to: Math.random() > 0.6 ? '0x' + Math.random().toString(16).slice(2, 42) : mockAddress,
        amount: (Math.random() * 25 + 1).toFixed(1),
        timestamp: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
        transactionHash: '0x' + Math.random().toString(16).slice(2, 66)
      }))
      
      const accountCreatedAt = Date.now() - (Math.random() * 365 * 24 * 60 * 60 * 1000)
      const stats = shameScoreService.calculateUserStats(mockAddress, mockTransactions, accountCreatedAt, Math.random() > 0.3)
      
      const searchResult: UserProfile = {
        handle: searchQuery.startsWith('@') ? searchQuery.slice(1) : searchQuery,
        address: mockAddress,
        shameScore: stats.shameScore,
        verificationLevel: shameScoreService.getVerificationLevel(stats.shameScore),
        shameFreeStreak: stats.shameFreeStreak,
        totalShamesSent: stats.totalShamesSent,
        totalShamesReceived: stats.totalShamesReceived,
        wankrSent: stats.totalWankrSent,
        wankrReceived: stats.totalWankrReceived,
        lastActivity: shameScoreService.formatLastActivity(stats.lastActivity),
        verificationBadge: shameScoreService.getVerificationBadge(stats.shameScore, stats.accountAgeDays),
        checkInStreak: Math.floor(Math.random() * 7),
        totalCheckIns: Math.floor(Math.random() * 30),
        lastCheckIn: Date.now() - Math.random() * 24 * 60 * 60 * 1000,
        canCheckIn: Math.random() > 0.5,
        timeUntilNextCheckIn: Math.random() > 0.5 ? 'Available now' : '12h 30m'
      }
      
      setSearchResults(searchResult)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const getVerificationColor = (level: string) => {
    switch (level) {
      case 'trusted': return 'text-green-400'
      case 'verified': return 'text-blue-400'
      default: return 'text-gray-400'
    }
  }

  const getVerificationIcon = (level: string) => {
    switch (level) {
      case 'trusted': return '🛡️'
      case 'verified': return '✓'
      default: return '❓'
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Check-in Notification Overlay */}
      {showCheckInNotification && currentStreakInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-8 max-w-sm mx-4 text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <span className="text-2xl">{currentStreakInfo.emoji}</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Check-in Successful!</h3>
            <p className={`mb-4 font-medium ${currentStreakInfo.color}`}>
              {currentStreakInfo.message}
            </p>
            <div className="bg-muted rounded-lg p-3 mb-4">
              <p className="text-sm text-muted-foreground">
                Keep checking in daily to maintain your streak and boost your verification score!
              </p>
            </div>
            <button
              onClick={() => setShowCheckInNotification(false)}
              className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Main App Content - Only show when check-in is dismissed */}
      {!showCheckInNotification && (
        <>
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-accent p-4 shadow-lg">
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Image
                    src="/wankr-logo.svg"
                    alt="WANKR Logo"
                    width={32}
                    height={32}
                    className="animate-float"
                  />
                  <div>
                    <h1 className="text-xl font-bold font-wankr text-gradient-hero">WANKR</h1>
                    <p className="text-xs text-white/80">
                      {frameContext.context === 'frame' ? 'From Frame' : 'Mini App'}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-white/60 text-right">
                  <p>Shame Economy</p>
                </div>
              </div>
            </div>
          </div>

          {/* Minimal Connection Indicator - Only show if not connected */}
          {!isConnected && (
            <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20">
              <div className="max-w-md mx-auto">
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></div>
                  <span>Connecting to Farcaster...</span>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 p-4 pb-24">
            <div className="max-w-md mx-auto space-y-4">
          {/* Send Shame Tab */}
          {activeTab === 'send' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-card to-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                    <Send className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold">Send Shame</h2>
                    <p className="text-xs text-muted-foreground">Shame the wankrs</p>
                  </div>
                </div>
                <SendWankr 
                  initialTarget={sendShameTarget || (frameContext.targetHandle ? `@${frameContext.targetHandle}` : frameContext.targetAddress)}
                  resolutionMode="farcaster-only"
                  isFarcasterMiniApp={true}
                  farcasterAddress={address}
                />
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-4">

              {/* Profile Stats */}
              <div className="bg-gradient-to-br from-card to-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4 shadow-lg">
                <h3 className="text-base font-semibold mb-3">Your Profile</h3>
                {isLoadingProfile || isLoadingRealStats ? (
                  <div className="p-8 text-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading profile...</p>
                  </div>
                ) : realUserStats ? (
                  <div className="space-y-6">
                    {/* Profile Header */}
                    <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-semibold">@{realUserStats.handle || 'user'}</h4>
                          <p className="text-xs text-muted-foreground font-mono">{realUserStats.address.slice(0, 6)}...{realUserStats.address.slice(-4)}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVerificationColor(realUserStats.verificationLevel)} bg-muted`}>
                            {getVerificationIcon(realUserStats.verificationLevel)} {realUserStats.verificationLevel}
                          </span>
                          {realUserStats.verificationBadge && (
                            <div className="text-xs text-blue-400 mt-1">✓ Verified Badge</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg p-3 border border-border">
                        <div className="text-lg font-bold text-primary">{realUserStats.shameScore}/100</div>
                        <div className="text-xs text-muted-foreground">Shame Score</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {realUserStats.shameScore <= 20 ? 'Pristine' : 
                           realUserStats.shameScore <= 40 ? 'Light' : 
                           realUserStats.shameScore <= 60 ? 'Moderate' : 
                           realUserStats.shameScore <= 80 ? 'High' : 'Extreme'}
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-green-500/10 to-green-600/20 rounded-lg p-3 border border-border">
                        <div className="text-lg font-bold text-green-400">{realUserStats.shameFreeStreak}</div>
                        <div className="text-xs text-muted-foreground">Shame-Free Days</div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/20 rounded-lg p-3 border border-border">
                        <div className="text-lg font-bold text-blue-400">{realUserStats.totalShamesSent}</div>
                        <div className="text-xs text-muted-foreground">Shames Sent</div>
                      </div>
                      <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/20 rounded-lg p-3 border border-border">
                        <div className="text-lg font-bold text-orange-400">{realUserStats.totalShamesReceived}</div>
                        <div className="text-xs text-muted-foreground">Shames Received</div>
                      </div>
                    </div>

                    {/* Shame Activity */}
                    <div className="bg-muted rounded-lg p-3">
                      <h4 className="text-sm font-semibold mb-2">WANKR Activity</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Transactions Sent:</span>
                          <span className="font-mono">{realUserStats.totalShamesSent}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Transactions Received:</span>
                          <span className="font-mono">{realUserStats.totalShamesReceived}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">WANKR Sent:</span>
                          <span className="font-mono">{realUserStats.wankrSent} WANKR</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">WANKR Received:</span>
                          <span className="font-mono">{realUserStats.wankrReceived} WANKR</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Last Activity:</span>
                          <span>{realUserStats.lastActivity}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">⚠️</span>
                    </div>
                    <p>Failed to load profile</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Verify Users Tab */}
          {activeTab === 'verify' && (
            <div className="space-y-4">
              {/* Search Section */}
              <div className="bg-gradient-to-br from-card to-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <Search className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold">Verify Users</h2>
                    <p className="text-xs text-muted-foreground">Check user reputation</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Farcaster handle..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 p-2 bg-background/50 border border-border/50 rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button
                    onClick={handleSearch}
                    disabled={isSearching || !searchQuery.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-lg text-sm font-semibold hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 shadow-md border-2 border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-w-[80px] flex items-center justify-center"
                  >
                    {isSearching ? (
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span className="text-xs">...</span>
                      </div>
                    ) : (
                      'Search'
                    )}
                  </button>
                </div>
              </div>

              {/* Verification Info */}
              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-border/50 rounded-2xl p-4 shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs">ℹ️</span>
                  </div>
                  <h3 className="text-sm font-semibold">How to Get Verified</h3>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• <strong>Low Shame Score:</strong> Keep your shame score below 20</p>
                  <p>• <strong>Active Participation:</strong> Send shame to bad actors</p>
                  <p>• <strong>Consistent Activity:</strong> Regular engagement over time</p>
                  <p>• <strong>Community Trust:</strong> Build reputation through good behavior</p>
                </div>
              </div>

              {/* Search Results */}
              {searchResults && (
                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-border/50 rounded-2xl p-4 shadow-lg animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">@{searchResults.handle.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">@{searchResults.handle}</h3>
                        <p className="text-xs text-muted-foreground">Farcaster User</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVerificationColor(searchResults.verificationLevel)} bg-muted/50 backdrop-blur-sm`}>
                      {getVerificationIcon(searchResults.verificationLevel)} {searchResults.verificationLevel}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-muted/50 backdrop-blur-sm rounded-lg p-2 border border-border/30">
                      <p className="text-xs text-muted-foreground">Shame Score</p>
                      <p className="text-sm font-bold">{searchResults.shameScore}/100</p>
                    </div>
                    <div className="bg-muted/50 backdrop-blur-sm rounded-lg p-2 border border-border/30">
                      <p className="text-xs text-muted-foreground">Shame-Free</p>
                      <p className="text-sm font-bold text-green-400">{searchResults.shameFreeStreak} days</p>
                    </div>
                    <div className="bg-muted/50 backdrop-blur-sm rounded-lg p-2 border border-border/30">
                      <p className="text-xs text-muted-foreground">Total Sent</p>
                      <p className="text-sm font-bold">{searchResults.totalShamesSent}</p>
                    </div>
                    <div className="bg-muted/50 backdrop-blur-sm rounded-lg p-2 border border-border/30">
                      <p className="text-xs text-muted-foreground">Total Received</p>
                      <p className="text-sm font-bold">{searchResults.totalShamesReceived}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSendShameTarget(`@${searchResults.handle}`)
                      setActiveTab('send')
                    }}
                    className="w-full py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg text-sm font-semibold hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-lg border-2 border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  >
                    Send Shame to @{searchResults.handle}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Leaderboards</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => refreshLeaderboard()}
                      className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                      disabled={isLeaderboardLoading}
                    >
                      <Trophy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Time Period Selector */}
                <div className="flex gap-2 mb-4">
                  {(['all', 'week', 'day'] as const).map((period) => (
                    <button
                      key={period}
                      onClick={() => changeTimePeriod(period)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        timePeriod === period
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {period === 'all' ? 'All Time' : period === 'week' ? 'This Week' : 'Today'}
                    </button>
                  ))}
                </div>

                                        {/* Tab Selector */}
                        <div className="flex gap-2 mb-4">
                          <button
                            onClick={() => setLeaderboardTab('received')}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              leaderboardTab === 'received'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-muted text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            <TrendingDown className="w-4 h-4" />
                            Biggest Wankrs
                          </button>
                          <button
                            onClick={() => setLeaderboardTab('sent')}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              leaderboardTab === 'sent'
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-muted text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            <TrendingUp className="w-4 h-4" />
                            Top Shame Soldiers
                          </button>
                        </div>
              </div>

              {/* Leaderboard Content */}
              <div className="bg-card border border-border rounded-lg p-6">
                {isLeaderboardLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading leaderboard...</p>
                  </div>
                ) : leaderboardError ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">⚠️</span>
                    </div>
                    <p className="text-muted-foreground mb-2">Failed to load leaderboard</p>
                    <p className="text-sm text-muted-foreground">{leaderboardError}</p>
                    <button
                      onClick={() => refreshLeaderboard()}
                      className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                ) : topEntries.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trophy className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">No leaderboard data available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                                                <h3 className="font-semibold mb-4">
                              {leaderboardTab === 'received' ? 'Biggest Wankrs' : 'Top Shame Soldiers'} - {timePeriod === 'all' ? 'All Time' : timePeriod === 'week' ? 'This Week' : 'Today'}
                            </h3>
                    
                    {topEntries.map((entry, index) => (
                      <div
                        key={`${entry.address}-${entry.period}`}
                        className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-yellow-500 text-yellow-900' :
                            index === 1 ? 'bg-gray-400 text-gray-900' :
                            index === 2 ? 'bg-orange-500 text-orange-900' :
                            'bg-muted-foreground/20 text-muted-foreground'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{entry.displayName}</p>
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
                            <p className="text-xs text-muted-foreground font-mono">
                              {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{entry.totalWankr} WANKR</p>
                          <p className="text-xs text-muted-foreground">
                            {entry.transactionCount} transaction{entry.transactionCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    <div className="text-center pt-4 space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Data from Dune Analytics • Updated every 5 minutes
                      </p>
                      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <span className="w-3 h-3 bg-purple-500/20 border border-purple-500/30 rounded"></span>
                          <span>FC = Farcaster</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-3 h-3 bg-blue-500/20 border border-blue-500/30 rounded"></span>
                          <span>BN = Base Names</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}


            </div>
          </div>

          {/* Footer Navigation */}
          <div className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-xl border-t border-border/50 shadow-2xl">
            <div className="max-w-md mx-auto">
              <div className="flex justify-around py-3">
                <button
                  onClick={() => {
                    setActiveTab('send')
                    // Clear target when manually switching to send tab
                    if (activeTab !== 'send') {
                      setSendShameTarget('')
                    }
                  }}
                  className={`flex flex-col items-center py-2 px-4 rounded-xl transition-all duration-300 ${
                    activeTab === 'send' 
                      ? 'text-primary bg-primary/20 shadow-lg' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Send className="w-5 h-5 mb-1" />
                  <span className="text-xs font-medium">Send</span>
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex flex-col items-center py-2 px-4 rounded-xl transition-all duration-300 ${
                    activeTab === 'profile' 
                      ? 'text-primary bg-primary/20 shadow-lg' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <User className="w-5 h-5 mb-1" />
                  <span className="text-xs font-medium">Profile</span>
                </button>
                <button
                  onClick={() => setActiveTab('verify')}
                  className={`flex flex-col items-center py-2 px-4 rounded-xl transition-all duration-300 ${
                    activeTab === 'verify' 
                      ? 'text-primary bg-primary/20 shadow-lg' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Search className="w-5 h-5 mb-1" />
                  <span className="text-xs font-medium">Verify</span>
                </button>
                <button
                  onClick={() => setActiveTab('leaderboard')}
                  className={`flex flex-col items-center py-2 px-4 rounded-xl transition-all duration-300 ${
                    activeTab === 'leaderboard' 
                      ? 'text-primary bg-primary/20 shadow-lg' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Trophy className="w-5 h-5 mb-1" />
                  <span className="text-xs font-medium">Leaderboard</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function FarcasterMiniApp() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <FarcasterMiniAppContent />
    </Suspense>
  )
}
