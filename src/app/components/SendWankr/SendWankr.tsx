"use client"

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Transaction, TransactionButton, type LifecycleStatus } from '@coinbase/onchainkit/transaction'
import { walletService } from '../../services/walletService'
import { addressResolutionService, type ResolutionPlatform } from '../../services/addressResolutionService'

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
  const [selectedPlatform, setSelectedPlatform] = useState<ResolutionPlatform>('wallet')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResolving, setIsResolving] = useState(false)
  const [resolvedAddress, setResolvedAddress] = useState<string>('')
  const [showTransaction, setShowTransaction] = useState(false)
  const [transactionCalls, setTransactionCalls] = useState<Array<{
    to: `0x${string}`
    data: `0x${string}`
    value?: bigint
  }>>([])

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

  const handlePlatformChange = (platform: ResolutionPlatform) => {
    setSelectedPlatform(platform)
    setResolvedAddress('')
  }

  const resolveHandle = async () => {
    if (!formData.targetAddress.trim()) {
      showError('Please enter a target address or handle')
      return
    }

    try {
      setIsResolving(true)
      console.log(`🔍 Resolving ${selectedPlatform} handle: ${formData.targetAddress}`)
      
      const resolution = await addressResolutionService.resolveHandle(
        formData.targetAddress, 
        selectedPlatform
      )
      
      setResolvedAddress(resolution.address)
      
      console.log(`✅ Resolved to: ${resolution.address} (${resolution.displayName})`)
      showSuccess(`Resolved: ${resolution.displayName}`)
      
    } catch (error) {
      console.error('❌ Handle resolution failed:', error)
      showError(error instanceof Error ? error.message : 'Failed to resolve handle')
      setResolvedAddress('')
    } finally {
      setIsResolving(false)
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
          const resolution = await addressResolutionService.resolveHandle(
            formData.targetAddress, 
            selectedPlatform
          )
          targetAddress = resolution.address
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

      console.log('🚀 TRANSACTION PREPARED!')
      console.log('Debug: Prepared calls for atomic transaction:', calls)
      console.log('📊 Transaction breakdown:')
      console.log(`   - WANKR Transfer: ${calls.length >= 1 ? '✅' : '❌'}`)
      console.log(`   - Net Protocol Message: ${calls.length >= 2 ? '✅' : '❌'}`)
      console.log(`   - Total calls: ${calls.length}`)
      setTransactionCalls(calls)
      setShowTransaction(true)

    } catch (error) {
      console.error('Failed to prepare transaction:', error)
      showError('Failed to prepare transaction')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTransactionSuccess = async (receipt: unknown) => {
    console.log('🎉 TRANSACTION SUCCESS HANDLER CALLED!')
    console.log('✅ Atomic transaction successful:', receipt)
    
    // Extract transaction hash from OnchainKit receipt
    let transactionHash: string | undefined
    let blockNumber: number | undefined
    
    if (receipt && typeof receipt === 'object' && 'transactionReceipts' in receipt) {
      const receipts = (receipt as { transactionReceipts: Array<{ hash?: string; transactionHash?: string; blockNumber?: number }> }).transactionReceipts
      if (Array.isArray(receipts) && receipts.length > 0) {
        const firstReceipt = receipts[0]
        transactionHash = firstReceipt.hash || firstReceipt.transactionHash
        blockNumber = firstReceipt.blockNumber
        console.log('🔍 Extracted from receipt:', { transactionHash, blockNumber })
      }
    }
    
    if (!transactionHash) {
      console.error('❌ Could not extract transaction hash from receipt')
      showError('Transaction successful but could not get transaction hash')
      return
    }
    
    const shameLabel = getWankrAmountComment(formData.amount.toString())
    showSuccess(`${shameLabel} shame delivered! Transaction: ${transactionHash}`)
    
    // Store transaction in local storage immediately
    const { enhancedShameFeedService } = await import('../../services/enhancedShameFeedService')
    console.log('💾 Storing transaction in local storage:', {
      hash: transactionHash,
      from: walletService.getWalletState().address,
      to: resolvedAddress,
      amount: formData.amount,
      message: formData.reason.trim() || undefined,
      blockNumber
    })
    
    try {
      const stored = await enhancedShameFeedService.storeTransactionSuccess({
        hash: transactionHash,
        from: walletService.getWalletState().address || '',
        to: resolvedAddress,
        amount: formData.amount,
        message: formData.reason.trim() || undefined,
        blockNumber: Number(blockNumber) || 0
      })
      
      console.log('✅ Transaction stored successfully:', stored)
    } catch (error) {
      console.error('❌ Failed to store transaction:', error)
    }
    
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

  const handleTransactionError = (error: Error | { message?: string }) => {
    console.log('💥 TRANSACTION ERROR HANDLER CALLED!')
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

  const handleTransactionStatus = (status: LifecycleStatus) => {
    console.log('📊 TRANSACTION STATUS HANDLER CALLED!')
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
          <label htmlFor="targetAddress" className="block text-sm font-medium text-white mb-2">
            Target Address or Handle
          </label>
          
          {/* Platform Selection Buttons */}
          <div className="flex gap-1 sm:gap-2 mb-2">
            <button
              type="button"
              onClick={() => handlePlatformChange('wallet')}
              className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-full transition-colors flex-1 sm:flex-none ${
                selectedPlatform === 'wallet'
                  ? 'bg-primary text-white shadow-lg'
                  : 'text-muted-foreground hover:bg-muted/80 border border-black'
              }`}
            >
              Wallet
            </button>
            <button
              type="button"
              onClick={() => handlePlatformChange('basenames')}
              className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-full transition-colors flex-1 sm:flex-none ${
                selectedPlatform === 'basenames'
                  ? 'bg-primary text-white shadow-lg'
                  : 'text-muted-foreground hover:bg-muted/80 border border-black'
              }`}
            >
              Base Names
            </button>
            <button
              type="button"
              onClick={() => handlePlatformChange('farcaster')}
              className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-full transition-colors flex-1 sm:flex-none ${
                selectedPlatform === 'farcaster'
                  ? 'bg-primary text-white shadow-lg'
                  : 'text-muted-foreground hover:bg-muted/80 border border-black'
              }`}
            >
              Farcaster
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              id="targetAddress"
              name="targetAddress"
              value={formData.targetAddress}
              onChange={handleInputChange}
              placeholder={
                selectedPlatform === 'wallet' ? 'Enter wallet address (0x...)' :
                selectedPlatform === 'basenames' ? 'Enter Base Name (username.base.eth)' :
                'Enter Farcaster handle (@username)'
              }
              className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isSubmitting || isResolving}
            />
            <button
              type="button"
              onClick={resolveHandle}
              disabled={!formData.targetAddress.trim() || isSubmitting || isResolving}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors sm:w-auto"
            >
              {isResolving ? 'Resolving...' : 'Resolve'}
            </button>
          </div>


        </div>

        {/* Reason for Shame Input */}
        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-white mb-2">
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
            <label className="text-sm font-medium text-white">
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
            <div className="absolute inset-x-0 flex text-xs text-white">
              <span style={{ position: 'absolute', left: '0%', transform: 'translateX(0%)' }}>1</span>
              <span style={{ position: 'absolute', left: '44.44%', transform: 'translateX(-50%)' }}>5</span>
              <span style={{ position: 'absolute', right: '0%', transform: 'translateX(0%)' }}>10</span>
            </div>
          </div>
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={isSubmitting || !resolvedAddress}
          className="w-full py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Preparing...' : getButtonText()}
        </button>
        
        {/* Address Resolution Status */}
        {!resolvedAddress && formData.targetAddress.trim() && (
          <div className="text-sm text-muted-foreground text-center">
            ⚠️ Please resolve the address before sending
          </div>
        )}


      </form>

      {/* Transaction Modal with OnchainKit */}
      {showTransaction && transactionCalls.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-lg p-4 sm:p-6 max-w-md w-full">
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

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
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
