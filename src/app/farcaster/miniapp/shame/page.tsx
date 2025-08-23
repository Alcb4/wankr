// src/app/farcaster/miniapp/shame/page.tsx

"use client"

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ethers } from 'ethers'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
// Reuse existing components and config
import { showError, showSuccess } from '../../../utils/ui'
import { FarcasterMiniAppService } from '../../../services/farcasterMiniAppService'

function FarcasterShameMiniAppContent() {
  const searchParams = useSearchParams()
  const targetAddress = searchParams.get('target')
  const postId = searchParams.get('postId')
  
  const [isConnected, setIsConnected] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [amount, setAmount] = useState(5)
  const [message, setMessage] = useState('')
  const [address, setAddress] = useState<string | null>(null)

  
  useEffect(() => {
    // Auto-connect for Farcaster Mini App
    if (targetAddress) {
      console.log('Quick shame Mini App loaded with target:', targetAddress)
    }
    
    // Simulate Farcaster wallet connection
    // In real implementation, this would come from Farcaster's embedded wallet
    setIsConnected(true)
    setAddress('0x1234567890123456789012345678901234567890') // Placeholder
  }, [targetAddress])

  const handleQuickShame = async (amount: number, message: string) => {
    if (!address || !targetAddress) {
      showError('Wallet not connected or target not found')
      return
    }

    try {
      setIsSubmitting(true)
      
      // For now, we'll use a placeholder since we need to implement proper Farcaster wallet integration
      // This will be replaced with actual Farcaster Mini App transaction flow
      showSuccess('Quick shame functionality ready! (Farcaster wallet integration to be implemented)')
      console.log('Quick shame request:', { targetAddress, amount, message })
      

      
    } catch (error) {
      console.error('Quick shame error:', error)
      showError('Failed to send quick shame')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-primary">WANKR Quick Shame</h1>
          <p className="text-muted-foreground">Send shame from Farcaster</p>
        </div>

        {/* Connection Status */}
        <div className="mb-4 p-3 rounded-lg border border-border">
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

        {/* Target Info */}
        {targetAddress && (
          <div className="mb-4 p-3 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">Target:</p>
            <p className="font-mono text-sm break-all">{targetAddress}</p>
          </div>
        )}

        {/* Quick Shame Interface */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Shame Amount (WANKR)</label>
            <select 
              className="w-full p-2 border border-border rounded-md bg-background"
              onChange={(e) => setAmount(parseInt(e.target.value))}
            >
              <option value={1}>1 WANKR</option>
              <option value={5}>5 WANKR</option>
              <option value={10}>10 WANKR</option>
              <option value={25}>25 WANKR</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Message</label>
            <textarea
              className="w-full p-2 border border-border rounded-md bg-background resize-none"
              rows={3}
              placeholder="Quick shame message..."
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <button
            onClick={() => handleQuickShame(amount, message)}
            disabled={!isConnected || isSubmitting}
            className="w-full py-2 px-4 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Sending...' : 'Send Quick Shame'}
          </button>
        </div>

        {/* Link to Full App */}
        <div className="mt-6 text-center">
          <a 
            href={`/farcaster/miniapp?target=${targetAddress}`}
            className="text-sm text-primary hover:underline"
          >
            Open Full WANKR App →
          </a>
        </div>
      </div>
    </div>
  )
}

export default function FarcasterShameMiniApp() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FarcasterShameMiniAppContent />
    </Suspense>
  )
}
