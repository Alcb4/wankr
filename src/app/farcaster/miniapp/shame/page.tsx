// src/app/farcaster/miniapp/shame/page.tsx

"use client"

import { useState, useEffect, Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
// Reuse existing components and config
import { showError, showSuccess } from '../../../utils/ui'

interface FrameContext {
  targetAddress?: string
  targetHandle?: string
  postId?: string
  castId?: string
  authorFid?: string
  context?: 'frame' | 'standalone'
}

function FarcasterShameMiniAppContent() {
  const searchParams = useSearchParams()
  
  // Extract all context parameters using useMemo to prevent unnecessary re-renders
  const frameContext: FrameContext = useMemo(() => ({
    targetAddress: searchParams.get('target') || undefined,
    targetHandle: searchParams.get('handle') || undefined,
    postId: searchParams.get('postId') || undefined,
    castId: searchParams.get('castId') || undefined,
    authorFid: searchParams.get('authorFid') || undefined,
    context: (searchParams.get('context') as 'frame' | 'standalone') || 'standalone'
  }), [searchParams])
  
  const [isConnected, setIsConnected] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [amount, setAmount] = useState(5)
  const [message, setMessage] = useState('')
  const [address, setAddress] = useState<string | null>(null)
  const [targetDisplay, setTargetDisplay] = useState<string>('')

  useEffect(() => {
    // Auto-connect for Farcaster Mini App
    if (frameContext.targetAddress || frameContext.targetHandle) {
      console.log('Quick shame Mini App loaded with context:', frameContext)
      
      // Set target display
      if (frameContext.targetHandle) {
        setTargetDisplay(`@${frameContext.targetHandle}`)
      } else if (frameContext.targetAddress) {
        setTargetDisplay(frameContext.targetAddress)
      }
    }
    
    // Simulate Farcaster wallet connection
    // In real implementation, this would come from Farcaster's embedded wallet
    setIsConnected(true)
    setAddress('0x1234567890123456789012345678901234567890') // Placeholder
  }, [frameContext])

  const handleQuickShame = async (amount: number, message: string) => {
    if (!address || (!frameContext.targetAddress && !frameContext.targetHandle)) {
      showError('Wallet not connected or target not found')
      return
    }

    try {
      setIsSubmitting(true)
      
      // For now, we'll use a placeholder since we need to implement proper Farcaster wallet integration
      // This will be replaced with actual Farcaster Mini App transaction flow
      showSuccess('Quick shame functionality ready! (Farcaster wallet integration to be implemented)')
      console.log('Quick shame request:', { 
        frameContext,
        amount, 
        message,
        targetAddress: frameContext.targetAddress,
        targetHandle: frameContext.targetHandle
      })
      
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
          <p className="text-muted-foreground">
            {frameContext.context === 'frame' ? 'Send shame from Farcaster Frame' : 'Send shame from Farcaster'}
          </p>
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
        {targetDisplay && (
          <div className="mb-4 p-3 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">Target:</p>
            <p className="font-mono text-sm break-all">{targetDisplay}</p>
            {frameContext.context === 'frame' && frameContext.postId && (
              <p className="text-xs text-muted-foreground mt-1">
                From post: {frameContext.postId}
              </p>
            )}
          </div>
        )}

        {/* Quick Shame Interface */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Shame Amount (WANKR)</label>
            <select 
              className="w-full p-2 border border-border rounded-md bg-background"
              value={amount}
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
              value={message}
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
            href={`/farcaster/miniapp?target=${frameContext.targetAddress}&handle=${frameContext.targetHandle}`}
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
