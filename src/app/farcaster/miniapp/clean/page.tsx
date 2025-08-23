"use client"

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { sdk } from '@farcaster/miniapp-sdk'

// Core functionality components
import { SendShameForm } from './components/SendShameForm'
import { ShameAnalytics } from './components/ShameAnalytics'
import { ShameVerification } from './components/ShameVerification'

function FarcasterMiniAppContent() {
  const searchParams = useSearchParams()
  const targetAddress = searchParams.get('target')
  
  const [activeTab, setActiveTab] = useState<'send' | 'analytics' | 'verification'>('send')
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const initializeFarcasterMiniApp = async () => {
      try {
        // Initialize Farcaster SDK and hide splash screen
        await sdk.actions.ready()
        setIsReady(true)
        
        // Get user context from Farcaster
        const context = await sdk.context
        if (context?.user) {
          setIsConnected(true)
          // In a real implementation, you'd get the user's wallet address
          setAddress(context.user.fid ? `0x${context.user.fid.toString().padStart(40, '0')}` : null)
        }
        
        if (targetAddress) {
          console.log('Farcaster Mini App loaded with target:', targetAddress)
        }
      } catch (error) {
        console.error('Failed to initialize Farcaster Mini App:', error)
        // Fallback for non-Farcaster environments
        setIsReady(true)
        setIsConnected(true)
        setAddress('0x1234567890123456789012345678901234567890') // Placeholder
      }
    }

    initializeFarcasterMiniApp()
  }, [targetAddress])

  // Show loading while SDK initializes
  if (!isReady) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0C0A12 0%, #1A1620 100%)' }}>
        <div className="text-center">
          <div className="text-lg font-semibold text-white">Loading WANKR...</div>
          <div className="text-sm text-muted-foreground mt-2">Initializing Mini App</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ background: 'linear-gradient(135deg, #0C0A12 0%, #1A1620 100%)' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-cyber p-4 text-white">
        <div className="max-w-md mx-auto">
          <h1 className="text-xl font-bold">WANKR</h1>
          <p className="text-sm opacity-90">Shame & Verification</p>
        </div>
      </div>

      {/* Connection Status */}
      <div className="p-3 border-b border-border bg-cardDark">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white">Wallet:</span>
            <span className={isConnected ? 'text-success' : 'text-error'}>
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

      {/* Target Info */}
      {targetAddress && (
        <div className="p-3 border-b border-border bg-cardDark">
          <div className="max-w-md mx-auto">
            <p className="text-sm text-muted-foreground">Target:</p>
            <p className="font-mono text-sm break-all text-white">{targetAddress}</p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-border bg-cardDark">
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
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'analytics' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('verification')}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'verification' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Verification
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 bg-background">
        <div className="max-w-md mx-auto">
          {activeTab === 'send' && (
            <SendShameForm targetAddress={targetAddress} />
          )}

          {activeTab === 'analytics' && (
            <ShameAnalytics targetAddress={targetAddress} />
          )}

          {activeTab === 'verification' && (
            <ShameVerification targetAddress={targetAddress} />
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
