"use client"

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Transaction, TransactionButton } from '@coinbase/onchainkit/transaction'
import { walletService } from '../../services/walletService'

import { getWankrAmountComment } from '../../utils/formatters'
import type { SendShameForm } from '../../config/types'
import { showError, showSuccess } from '../../utils/ui'
import { WANKR_CONTRACT_ADDRESS, WANKR_ABI, NET_CONTRACT_ADDRESS } from '../../config/contract'

export function SendWankr() {
  const [formData, setFormData] = useState<SendShameForm>({
    targetAddress: '',
    reason: '',
    amount: 5 // Default to middle amount
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resolvedAddress, setResolvedAddress] = useState<string>('')
  const [showTransaction, setShowTransaction] = useState(false)
  const [transactionCalls, setTransactionCalls] = useState<any[]>([])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear resolved address when input changes
    if (name === 'targetAddress') {
      setResolvedAddress('')
    }
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const amount = parseInt(e.target.value)
    setFormData(prev => ({
      ...prev,
      amount
    }))
  }

  const refreshShameFeed = async () => {
    try {
      console.log('🔄 Refreshing shame feed...')
      // Trigger a force refresh of the shame feed
      const response = await fetch('/api/shame-feed?refresh=true')
      if (response.ok) {
        console.log('✅ Shame feed refresh successful')
        // Dispatch a custom event to notify the shame feed to refresh
        window.dispatchEvent(new CustomEvent('refreshShameFeed'))
      } else {
        console.error('❌ Shame feed refresh failed:', response.status)
      }
    } catch (error) {
      console.error('Failed to refresh shame feed:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await prepareTransaction()
  }

  const prepareTransaction = async () => {
    if (!formData.targetAddress.trim()) {
      showError('Please enter a target address or handle')
      return
    }

    const contractState = walletService.getContractState()
    if (!contractState.contract) {
      showError('Please connect your wallet first')
      return
    }

    try {
      setIsSubmitting(true)

      console.log('Debug: Preparing transaction', {
        targetAddress: formData.targetAddress,
        resolvedAddress,
        amount: formData.amount,
        reason: formData.reason
      })

      // Resolve address if not already resolved
      let targetAddress = resolvedAddress
      if (!targetAddress) {
        try {
          console.log('Debug: Resolving address...')
          targetAddress = await walletService.resolveAddress(formData.targetAddress)
          setResolvedAddress(targetAddress)
          console.log('Debug: Address resolved to:', targetAddress)
        } catch (error) {
          console.error('Debug: Address resolution failed:', error)
          showError(error instanceof Error ? error.message : 'Failed to resolve address')
          return
        }
      }

      const amountInWei = ethers.parseUnits(formData.amount.toString(), 18)
      const hasReason = formData.reason.trim().length > 0
      const walletState = walletService.getWalletState()

      // Prepare calls for OnchainKit Transaction component
      const calls = []

      // Always add WANKR transfer call
      const wankrInterface = new ethers.Interface(WANKR_ABI)
      const wankrTransferData = wankrInterface.encodeFunctionData('transfer', [
        targetAddress,
        amountInWei
      ])
      
      calls.push({
        to: WANKR_CONTRACT_ADDRESS as `0x${string}`,
        data: wankrTransferData as `0x${string}`,
        value: BigInt(0)
      })

      // Add Net Protocol message call if reason provided
      if (hasReason) {
        const netMessage = `Shame delivered! ${walletState.address || 'Unknown'} sent ${formData.amount} WANKR to ${targetAddress} with reason: "${formData.reason}"`
        const netData = JSON.stringify({
          from: walletState.address,
          to: targetAddress,
          amount: formData.amount,
          reason: formData.reason,
          timestamp: Date.now()
        })

        const netInterface = new ethers.Interface([
          'function sendMessage(string text, string topic, bytes data) external'
        ])
        const netMessageData = netInterface.encodeFunctionData('sendMessage', [
          netMessage,
          'wankr-shame',
          ethers.toUtf8Bytes(netData)
        ])

        calls.push({
          to: NET_CONTRACT_ADDRESS as `0x${string}`,
          data: netMessageData as `0x${string}`,
          value: BigInt(0)
        })
      }

      console.log('Debug: Prepared calls for atomic transaction:', calls)
      setTransactionCalls(calls)
      setShowTransaction(true)

    } catch (error) {
      console.error('Failed to prepare transaction:', error)
      showError('Failed to prepare transaction')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTransactionSuccess = async (receipt: any) => {
    console.log('✅ Atomic transaction successful:', receipt)
    const shameLabel = getWankrAmountComment(formData.amount.toString())
    showSuccess(`${shameLabel} shame delivered! Transaction: ${receipt.hash}`)
    
    // Store transaction in local storage immediately
    const { enhancedShameFeedService } = await import('../../services/enhancedShameFeedService')
    console.log('💾 Storing transaction in local storage:', {
      hash: receipt.hash,
      from: walletService.getWalletState().address,
      to: resolvedAddress,
      amount: formData.amount,
      message: formData.reason.trim() || undefined,
      blockNumber: receipt.blockNumber
    })
    
    await enhancedShameFeedService.storeTransactionSuccess({
      hash: receipt.hash,
      from: walletService.getWalletState().address || '',
      to: resolvedAddress,
      amount: formData.amount,
      message: formData.reason.trim() || undefined,
      blockNumber: receipt.blockNumber
    })
    
    console.log('✅ Transaction stored successfully')
    
    // Reset form
    setFormData({
      targetAddress: '',
      reason: '',
      amount: 5
    })
    setResolvedAddress('')
    setShowTransaction(false)
    setTransactionCalls([])
    
    // Refresh shame feed
    await refreshShameFeed()
  }

  const handleTransactionError = (error: any) => {
    console.error('❌ Atomic transaction failed:', error)
    let errorMessage = 'Failed to deliver shame'
    if (error?.message) {
      if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient WANKR balance'
      } else if (error.message.includes('user rejected')) {
        errorMessage = 'Transaction was rejected'
      } else {
        errorMessage = error.message
      }
    }
    showError(errorMessage)
    setShowTransaction(false)
    setTransactionCalls([])
  }

  const handleTransactionStatus = (status: any) => {
    console.log('🔄 Transaction status:', status)
  }

  const testContractConnection = async () => {
    const contractState = walletService.getContractState()
    if (!contractState.contract) {
      console.log('No contract available - wallet not connected')
      return
    }

    try {
      console.log('Debug: Testing contract connection...')
      console.log('Debug: Contract address:', contractState.contract.target)
      console.log('Debug: Provider:', contractState.provider)
      
      // Test basic contract functions
      const name = await contractState.contract.name()
      const symbol = await contractState.contract.symbol()
      const decimals = await contractState.contract.decimals()
      
      console.log('Contract info:', { name, symbol, decimals })
      
      // Test if transfer function exists (standard ERC-20)
      const contractInterface = contractState.contract.interface
      const hasTransferFunction = contractInterface.hasFunction('transfer')
      console.log('Has transfer function:', hasTransferFunction)
      
      if (hasTransferFunction) {
        console.log('Transfer function signature:', contractInterface.getFunction('transfer')?.format())
      }
      
    } catch (error) {
      console.error('Contract test failed:', error)
    }
  }

  // Test contract connection on mount only if wallet is connected
  useEffect(() => {
    const contractState = walletService.getContractState()
    if (contractState.contract) {
      testContractConnection()
    }
  }, [])

  // Calculate button text based on whether there's a message
  const getButtonText = () => {
    const baseText = `Send ${getWankrAmountComment(formData.amount.toString())}`
    return formData.reason.trim() ? `${baseText} + Message` : baseText
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Target Address Input */}
        <div>
          <label htmlFor="targetAddress" className="block text-sm font-medium text-muted-foreground mb-2">
            Target Address or Handle
          </label>
          <input
            type="text"
            id="targetAddress"
            name="targetAddress"
            value={formData.targetAddress}
            onChange={handleInputChange}
            placeholder="Enter wallet address or handle"
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            disabled={isSubmitting}
          />
        </div>

        {/* Reason for Shame Input */}
        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-muted-foreground mb-2">
            Reason for Shame
          </label>
          <textarea
            id="reason"
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            placeholder="Why are you shaming them? (optional)"
            rows={2}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            disabled={isSubmitting}
          />
        </div>

        {/* Amount Display and Slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-muted-foreground">
              Amount
            </label>
            <span className="text-lg font-bold text-primary">
              {formData.amount} WANKR
            </span>
          </div>
          
          <input
            type="range"
            min="1"
            max="10"
            value={formData.amount}
            onChange={handleAmountChange}
            className="w-full h-2 bg-black rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${(formData.amount - 1) * 11.11}%, #000000 ${(formData.amount - 1) * 11.11}%, #000000 100%)`
            }}
            disabled={isSubmitting}
          />
          
          <div className="relative mt-1 mb-6">
            <div className="absolute inset-x-0 flex text-xs text-muted-foreground">
              <span style={{ position: 'absolute', left: '0%', transform: 'translateX(0%)' }}>1</span>
              <span style={{ position: 'absolute', left: '44.44%', transform: 'translateX(-50%)' }}>5</span>
              <span style={{ position: 'absolute', right: '0%', transform: 'translateX(0%)' }}>10</span>
            </div>
          </div>
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Preparing...' : getButtonText()}
        </button>
      </form>

      {/* Transaction Modal with OnchainKit */}
      {showTransaction && transactionCalls.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Transaction</h3>
            
            <div className="space-y-3 mb-6">
              <div>
                <span className="text-sm text-muted-foreground">To:</span>
                <p className="font-mono text-sm break-all">{resolvedAddress}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Amount:</span>
                <p className="font-semibold">{formData.amount} WANKR</p>
              </div>
              {formData.reason.trim() && (
                <div>
                  <span className="text-sm text-muted-foreground">Message:</span>
                  <p className="text-sm">{formData.reason}</p>
                </div>
              )}
              <div>
                <span className="text-sm text-muted-foreground">Transaction Type:</span>
                <p className="font-semibold text-primary">
                  {transactionCalls.length > 1 ? 'Atomic (WANKR + Message)' : 'Simple (WANKR only)'}
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowTransaction(false)
                  setTransactionCalls([])
                }}
                className="flex-1 py-2 px-4 border border-border rounded-md hover:bg-muted transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              
              {/* OnchainKit Transaction Component inside modal */}
              <div className="flex-1">
                <Transaction
                  calls={transactionCalls}
                  chainId={8453} // Base mainnet
                  onSuccess={handleTransactionSuccess}
                  onError={handleTransactionError}
                  onStatus={handleTransactionStatus}
                >
                  <TransactionButton 
                    text="Send Transaction"
                    className="w-full py-2 px-4 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  />
                </Transaction>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
