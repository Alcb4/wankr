// src/app/farcaster/miniapp/page.tsx

"use client"

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

// Reuse existing components and config
import { SendWankr } from '../../components/SendWankr/SendWankr'
import { ShameFeed } from '../../components/ShameFeed/ShameFeed'

function FarcasterMiniAppContent() {
  const searchParams = useSearchParams()
  const targetAddress = searchParams.get('target')
  
  const [activeTab, setActiveTab] = useState<'send' | 'feed' | 'analytics'>('send')
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  
  useEffect(() => {
    // Auto-connect for Farcaster Mini App
    if (targetAddress) {
      console.log('Farcaster Mini App loaded with target:', targetAddress)
    }
    
    // Simulate Farcaster wallet connection
    // In real implementation, this would come from Farcaster's embedded wallet
    setIsConnected(true)
    setAddress('0x1234567890123456789012345678901234567890') // Placeholder
  }, [targetAddress])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="max-w-md mx-auto">
          <h1 className="text-xl font-bold">WANKR App</h1>
          <p className="text-sm opacity-90">Shame management & verification</p>
        </div>
      </div>

      {/* Connection Status */}
      <div className="p-4 border-b border-border">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between">
            <span className="text-sm">Farcaster Wallet:</span>
            <span className={`text-sm ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
              {isConnected ? 'Connected' : 'Not Connected'}
            </span>
          </div>
          {address && (
            <p className="text-xs text-muted-foreground mt-1">
              {address.slice(0, 6)}...{address.slice(-4)}
            </p>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-border">
        <div className="max-w-md mx-auto flex">
          <button
            onClick={() => setActiveTab('send')}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'send' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Send Shame
          </button>
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'feed' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Shame Feed
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'analytics' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Analytics
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="max-w-md mx-auto">
          {activeTab === 'send' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Send Shame</h2>
              {targetAddress && (
                <div className="mb-4 p-3 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground">Target:</p>
                  <p className="font-mono text-sm break-all">{targetAddress}</p>
                </div>
              )}
              {/* Reuse existing SendWankr component */}
              <SendWankr />
            </div>
          )}

          {activeTab === 'feed' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Recent Shames</h2>
              {/* Reuse existing ShameFeed component */}
              <ShameFeed />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Shame Analytics</h2>
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-border">
                  <h3 className="font-medium mb-2">Your Shame Stats</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Shames Sent:</span>
                      <span className="font-mono">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>WANKR Spent:</span>
                      <span className="font-mono">0 WANKR</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shame Score:</span>
                      <span className="font-mono">0</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-border">
                  <h3 className="font-medium mb-2">Verification Status</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Authenticity Score:</span>
                      <span className="text-green-500 font-medium">High</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Shame-Free Days:</span>
                      <span className="font-mono">30</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Verification Badge:</span>
                      <span className="text-blue-500 font-medium">✓ Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function FarcasterMiniApp() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FarcasterMiniAppContent />
    </Suspense>
  )
}
