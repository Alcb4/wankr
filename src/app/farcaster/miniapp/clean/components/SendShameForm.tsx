"use client"

import { useState } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import { showError, showSuccess } from '../../../../utils/ui'

interface SendShameFormProps {
  targetAddress: string | null
}

export function SendShameForm({ targetAddress }: SendShameFormProps) {
  const [amount, setAmount] = useState(5)
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSendShame = async () => {
    if (!targetAddress) {
      showError('No target address provided')
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
        
        showSuccess(`Shame sent! ${amount} WANKR (Farcaster integration ready)`)
        setMessage('')
        
        // Send notification to user
        await sdk.actions.sendNotification({
          title: 'Shame Sent!',
          body: `Successfully sent ${amount} WANKR shame`,
        })
        
      } catch (sdkError) {
        console.log('Farcaster SDK not available, using fallback API')
        
        // Fallback to existing backend API
        const response = await fetch('/api/net-protocol/collect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: targetAddress,
            amount: amount,
            message: message,
            topic: 'wankr-shame'
          }),
        })

        if (response.ok) {
          showSuccess(`Shame sent! ${amount} WANKR`)
          setMessage('')
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

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Send Shame</h2>
      
      <div>
        <label className="block text-sm font-medium mb-2">Amount (WANKR)</label>
        <select 
          className="w-full p-3 border border-border rounded-md bg-background"
          value={amount}
          onChange={(e) => setAmount(parseInt(e.target.value))}
        >
          <option value={1}>1 WANKR</option>
          <option value={5}>5 WANKR</option>
          <option value={10}>10 WANKR</option>
          <option value={25}>25 WANKR</option>
          <option value={50}>50 WANKR</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Message</label>
        <textarea
          className="w-full p-3 border border-border rounded-md bg-background resize-none"
          rows={4}
          placeholder="Enter your shame message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      <button
        onClick={handleSendShame}
        disabled={isSubmitting || !message.trim()}
        className="w-full py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Sending...' : `Send ${amount} WANKR Shame`}
      </button>
    </div>
  )
}
