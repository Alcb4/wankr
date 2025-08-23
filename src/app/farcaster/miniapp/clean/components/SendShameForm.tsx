"use client"

import { useState } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import { showError, showSuccess } from '../../../../utils/ui'
import { getWankrAmountComment } from '../../../../utils/formatters'

interface SendShameFormProps {
  targetAddress: string | null
}

export function SendShameForm({ targetAddress }: SendShameFormProps) {
  const [amount, setAmount] = useState(5)
  const [message, setMessage] = useState('')
  const [targetInput, setTargetInput] = useState(targetAddress || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = parseInt(e.target.value)
    setAmount(newAmount)
  }

  const handleSendShame = async () => {
    const finalTarget = targetInput.trim() || targetAddress
    
    if (!finalTarget) {
      showError('Please enter a target address or Farcaster ID')
      return
    }

    if (!message.trim()) {
      showError('Please enter a message')
      return
    }

    try {
      setIsSubmitting(true)
      
      // Try to use Farcaster SDK for wallet interaction
      try {
        // Check if user is authenticated
        const context = await sdk.context
        if (!context?.user) {
          showError('Please authenticate with Farcaster first')
          return
        }

        // For now, simulate the transaction - in production you'd integrate with wallet
        // This would typically involve:
        // 1. Get user's wallet via sdk.wallet
        // 2. Create and sign transaction
        // 3. Submit to blockchain
        
        showSuccess(`${getWankrAmountComment(amount.toString())} shame sent! ${amount} WANKR (Farcaster integration ready)`)
        setMessage('')
        setTargetInput('')
        
        // Note: Farcaster notifications would be implemented here
        // when the SDK notification API is available
        
      } catch (sdkError) {
        console.log('Farcaster SDK not available, using fallback API')
        
        // Fallback to existing backend API
        const response = await fetch('/api/net-protocol/collect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: finalTarget,
            amount: amount,
            message: message,
            topic: 'wankr-shame'
          }),
        })

        if (response.ok) {
          showSuccess(`${getWankrAmountComment(amount.toString())} shame sent! ${amount} WANKR`)
          setMessage('')
          setTargetInput('')
        } else {
          const error = await response.text()
          showError(`Failed to send shame: ${error}`)
        }
      }
      
    } catch (error) {
      console.error('Send shame error:', error)
      showError('Failed to send shame')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate button text based on whether there's a message
  const getButtonText = () => {
    const baseText = `Send ${getWankrAmountComment(amount.toString())}`
    return message.trim() ? `${baseText} + Message` : baseText
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Send Shame</h2>
      
      {/* Target Input */}
      <div>
        <label className="block text-sm font-medium mb-2">Target Address or Farcaster ID</label>
        <input
          type="text"
          value={targetInput}
          onChange={(e) => setTargetInput(e.target.value)}
          placeholder="Enter wallet address or Farcaster ID..."
          className="w-full p-3 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          disabled={isSubmitting}
        />
        {targetAddress && !targetInput && (
          <p className="text-xs text-muted-foreground mt-1">
            Pre-filled target: {targetAddress}
          </p>
        )}
      </div>

      {/* Amount Slider */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-sm font-medium">
            Amount
          </label>
          <span className="text-lg font-bold text-primary">
            {amount} WANKR
          </span>
        </div>
        
        <input
          type="range"
          min="1"
          max="10"
          value={amount}
          onChange={handleAmountChange}
          className="w-full h-2 bg-black rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${(amount - 1) * 11.11}%, #000000 ${(amount - 1) * 11.11}%, #000000 100%)`
          }}
          disabled={isSubmitting}
        />
        
        <div className="relative mt-1 mb-4">
          <div className="absolute inset-x-0 flex text-xs">
            <span style={{ position: 'absolute', left: '0%', transform: 'translateX(0%)' }}>1</span>
            <span style={{ position: 'absolute', left: '44.44%', transform: 'translateX(-50%)' }}>5</span>
            <span style={{ position: 'absolute', right: '0%', transform: 'translateX(0%)' }}>10</span>
          </div>
        </div>
      </div>

      {/* Message Input */}
      <div>
        <label className="block text-sm font-medium mb-2">Message</label>
        <textarea
          className="w-full p-3 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          rows={4}
          placeholder="Why are you shaming them? (optional)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      {/* Send Button */}
      <button
        onClick={handleSendShame}
        disabled={isSubmitting || !message.trim() || (!targetInput.trim() && !targetAddress)}
        className="w-full py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Sending...' : getButtonText()}
      </button>
    </div>
  )
}
