// src/app/components/SendWankr/SendWankr.tsx

"use client"

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Transaction, TransactionButton, type LifecycleStatus } from '@coinbase/onchainkit/transaction'
import { walletService } from '../../services/walletService'
import { addressResolutionService } from '../../services/addressResolutionService'
import { sdk } from '@farcaster/miniapp-sdk'

import { getWankrAmountComment } from '../../utils/formatters'
import type { SendShameForm } from '../../config/types'
import { showError, showSuccess } from '../../utils/ui'
import { WANKR_CONTRACT_ADDRESS, WANKR_ABI, SEND_SHAME_AND_MESSAGE_ADDRESS, SEND_SHAME_AND_MESSAGE_ABI, HELPER_CONTRACT_CONSTANTS } from '../../config/contract'

interface SendWankrProps {
  initialTarget?: string
  resolutionMode?: 'farcaster-only' | 'all-options' // New prop to control resolution options
  isFarcasterMiniApp?: boolean // New prop to detect Mini App context
  farcasterAddress?: string // Farcaster wallet address
}

export function SendWankr({ initialTarget, resolutionMode = 'all-options', isFarcasterMiniApp = false, farcasterAddress }: SendWankrProps = {}) {
  const [formData, setFormData] = useState<SendShameForm>({
    targetAddress: initialTarget || '',
    reason: '',
    amount: 5 // Default to middle amount
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResolving, setIsResolving] = useState(false)
  const [resolvedAddress, setResolvedAddress] = useState<string>('')
  const [showTransaction, setShowTransaction] = useState(false)
  const [transactionCalls, setTransactionCalls] = useState<Array<{
    to: `0x${string}`
    data: `0x${string}`
    value?: bigint
  }>>([])

  // Auto-resolve target if provided from Frame context
  useEffect(() => {
    if (initialTarget && !resolvedAddress) {
      console.log('Auto-resolving initial target:', initialTarget)
      // Try to auto-resolve the target
      handleAutoResolve(initialTarget)
    }
  }, [initialTarget, resolvedAddress])

  const handleAutoResolve = async (target: string) => {
    if (!target.trim()) return

    try {
      setIsResolving(true)
      console.log(`🔍 Auto-resolving target: ${target}`)
      
      // Only use Farcaster resolution for Mini App
      try {
        const resolution = await addressResolutionService.resolveHandle(target, 'farcaster')
        setResolvedAddress(resolution.address)
        console.log(`✅ Auto-resolved to: ${resolution.address} (${resolution.displayName}) via farcaster`)
      } catch (error) {
        console.log(`❌ Auto-resolve failed for farcaster:`, error)
        // If Farcaster resolution fails, try to use as direct address
        if (target.startsWith('0x') && target.length === 42) {
          setResolvedAddress(target)
          console.log(`✅ Using as direct address: ${target}`)
        }
      }
    } catch (error) {
      console.error('❌ Auto-resolve failed:', error)
    } finally {
      setIsResolving(false)
    }
  }

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

  const resolveWithPlatform = async (platform: 'wallet' | 'basenames' | 'farcaster' | 'x') => {
    if (!formData.targetAddress.trim()) {
      showError('Please enter a handle or address')
      return
    }

    try {
      setIsResolving(true)
      console.log(`🔍 Resolving with platform ${platform}: ${formData.targetAddress}`)
      
      const resolution = await addressResolutionService.resolveHandle(
        formData.targetAddress, 
        platform
      )
      
      setResolvedAddress(resolution.address)
      showSuccess(`Resolved to ${resolution.displayName} via ${platform}`)
    } catch (error) {
      console.error(`❌ Resolution failed for ${platform}:`, error)
      showError(`Failed to resolve via ${platform}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsResolving(false)
    }
  }

  const resolveHandle = async () => {
    if (!formData.targetAddress.trim()) {
      showError('Please enter a Farcaster handle')
      return
    }

    try {
      setIsResolving(true)
      console.log(`🔍 Resolving Farcaster handle: ${formData.targetAddress}`)
      
      const resolution = await addressResolutionService.resolveHandle(
        formData.targetAddress, 
        'farcaster'
      )
      
      setResolvedAddress(resolution.address)
      
      console.log(`✅ Resolved to: ${resolution.address} (${resolution.displayName})`)
      showSuccess(`Resolved: ${resolution.displayName}`)
      
    } catch (error) {
      console.error('❌ Handle resolution failed:', error)
      showError(error instanceof Error ? error.message : 'Failed to resolve Farcaster handle')
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
      showError('Please enter a Farcaster handle')
      return
    }

    // Check wallet connection based on context
    if (isFarcasterMiniApp) {
      if (!farcasterAddress) {
        showError('Please connect your Farcaster wallet first.')
        return
      }
    } else {
      const contractState = walletService.getContractState()
      if (!contractState.contract) {
        showError('Please connect your wallet first')
        return
      }
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
            'farcaster'
          )
          targetAddress = resolution.address
          setResolvedAddress(targetAddress)
          console.log('Debug: Address resolved to:', targetAddress)
        } catch (error) {
          console.error('Debug: Address resolution failed:', error)
          showError(error instanceof Error ? error.message : 'Failed to resolve Farcaster handle')
          return
        }
      }

      const amountInWei = ethers.parseUnits(formData.amount.toString(), 18)
      const hasReason = formData.reason.trim().length > 0
      
      // Handle wallet state based on context
      let walletAddress: string
      if (isFarcasterMiniApp) {
        walletAddress = farcasterAddress || ''
      } else {
        const walletState = walletService.getWalletState()
        walletAddress = walletState.address || ''
      }

      // For Mini App, skip approval check (Farcaster handles this)
      if (!isFarcasterMiniApp) {
        const contractState = walletService.getContractState()
        // Check if user has approved the helper contract
        const wankrContract = new ethers.Contract(WANKR_CONTRACT_ADDRESS, WANKR_ABI, contractState.signer)
        const allowance = await wankrContract.allowance(walletAddress, SEND_SHAME_AND_MESSAGE_ADDRESS)
        const requiredAmount = ethers.parseUnits(HELPER_CONTRACT_CONSTANTS.RECOMMENDED_APPROVAL_AMOUNT.toString(), 18)

        if (allowance < amountInWei) {
          // Need to approve first
          console.log('🔐 Approval needed. Requesting approval...')
          const approveTx = await wankrContract.approve(SEND_SHAME_AND_MESSAGE_ADDRESS, requiredAmount)
          showSuccess('Approval transaction submitted. Please wait for confirmation...')
          await approveTx.wait()
          showSuccess('Approval confirmed! Now sending shame...')
        }
      }

      // Prepare call to helper contract
      const helperInterface = new ethers.Interface(SEND_SHAME_AND_MESSAGE_ABI)
      const message = hasReason ? formData.reason : 'Shame delivered!'
      const topic = 'wankr-shame'
      
      const helperData = helperInterface.encodeFunctionData('sendShameAndMessage', [
        targetAddress,
        amountInWei,
        message,
        topic
      ])

      const calls = [{
        to: SEND_SHAME_AND_MESSAGE_ADDRESS as `0x${string}`,
        data: helperData as `0x${string}`,
        value: BigInt(0)
      }]

      console.log('🚀 HELPER CONTRACT TRANSACTION PREPARED!')
      console.log('Debug: Prepared call to helper contract:', calls)
      console.log('📊 Transaction breakdown:')
      console.log(`   - Helper Contract Call: ✅`)
      console.log(`   - Atomic WANKR Transfer + Message: ✅`)
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
    
    // Store transaction in local storage immediately (skip for Mini App to avoid errors)
    if (!isFarcasterMiniApp) {
      try {
        const { enhancedShameFeedService } = await import('../../services/enhancedShameFeedService')
        
        // Get sender address based on context
        let senderAddress: string
        if (isFarcasterMiniApp) {
          senderAddress = farcasterAddress || ''
        } else {
          senderAddress = walletService.getWalletState().address || ''
        }
        
        console.log('💾 Storing transaction in local storage:', {
          hash: transactionHash,
          from: senderAddress,
          to: resolvedAddress,
          amount: formData.amount,
          message: formData.reason.trim() || undefined,
          blockNumber
        })
        
        const stored = await enhancedShameFeedService.storeTransactionSuccess({
          hash: transactionHash,
          from: senderAddress,
          to: resolvedAddress,
          amount: formData.amount,
          message: formData.reason.trim() || undefined,
          blockNumber: Number(blockNumber) || 0
        })
        
        console.log('✅ Transaction stored successfully:', stored)
      } catch (error) {
        console.error('❌ Failed to store transaction:', error)
      }
    } else {
      console.log('📱 Skipping transaction storage for Mini App context')
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
    
    // Refresh shame feed (skip for Mini App to avoid errors)
    if (!isFarcasterMiniApp) {
      try {
        await refreshShameFeed()
      } catch (error) {
        console.error('❌ Failed to refresh shame feed:', error)
      }
    } else {
      console.log('📱 Skipping shame feed refresh for Mini App context')
    }
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

  // Farcaster Mini App specific transaction handling
  const handleFarcasterTransaction = async () => {
    if (!isFarcasterMiniApp || !farcasterAddress) {
      console.error('❌ Not in Farcaster Mini App context or no address')
      return
    }

    try {
      console.log('📱 Starting Farcaster transaction...')
      
      // First, check if approval is needed
      const wankrContract = new ethers.Contract(WANKR_CONTRACT_ADDRESS, WANKR_ABI)
      const amountInWei = ethers.parseUnits(formData.amount.toString(), 18)
      const requiredAmount = ethers.parseUnits(HELPER_CONTRACT_CONSTANTS.RECOMMENDED_APPROVAL_AMOUNT.toString(), 18)
      
      // Check current allowance
      const allowanceData = wankrContract.interface.encodeFunctionData('allowance', [
        farcasterAddress,
        SEND_SHAME_AND_MESSAGE_ADDRESS
      ])
      
      const allowanceResult = await sdk.wallet.ethProvider.request({
        method: 'eth_call',
        params: [{
          to: WANKR_CONTRACT_ADDRESS,
          data: allowanceData as `0x${string}`,
          from: farcasterAddress as `0x${string}`
        }, 'latest']
      }) as string
      
      const currentAllowance = ethers.formatUnits(allowanceResult, 18)
      console.log('🔍 Current allowance:', currentAllowance, 'WANKR')
      
      // If allowance is insufficient, request approval first
      if (parseFloat(currentAllowance) < formData.amount) {
        console.log('🔐 Approval needed. Requesting approval...')
        
        const approveData = wankrContract.interface.encodeFunctionData('approve', [
          SEND_SHAME_AND_MESSAGE_ADDRESS,
          requiredAmount
        ])
        
        const approveResult = await sdk.wallet.ethProvider.request({
          method: 'eth_sendTransaction',
          params: [{
            from: farcasterAddress as `0x${string}`,
            to: WANKR_CONTRACT_ADDRESS,
            data: approveData as `0x${string}`,
            value: '0x0',
            chainId: '0x2105' // Base mainnet chain ID
          }]
        })
        
        console.log('✅ Approval transaction submitted:', approveResult)
        showSuccess('Approval transaction submitted. Please wait for confirmation...')
        
        // Wait a bit for the approval to be processed
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
      
      // Now send the actual transaction
      const result = await sdk.wallet.ethProvider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: farcasterAddress as `0x${string}`,
          to: transactionCalls[0].to,
          data: transactionCalls[0].data,
          value: (transactionCalls[0].value?.toString() || '0x0') as `0x${string}`,
          chainId: '0x2105' // Base mainnet chain ID
        }]
      })

      console.log('✅ Farcaster transaction successful:', result)
      
      // Handle success without using OnchainKit types
      const txHash = result as string
      showSuccess(`${getWankrAmountComment(formData.amount.toString())} shame delivered! Transaction: ${txHash}`)
      
      // Reset form
      setFormData({
        targetAddress: '',
        amount: 1,
        reason: ''
      })
      setResolvedAddress('')
      setShowTransaction(false)
      setTransactionCalls([])
      setIsSubmitting(false)

    } catch (error) {
      console.error('❌ Farcaster transaction failed:', error)
      showError('Transaction failed. Please try again.')
      setIsSubmitting(false)
    }
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



  // Test contract connection on mount only if wallet is connected (web context only)
  useEffect(() => {
    if (!isFarcasterMiniApp) {
      const contractState = walletService.getContractState()
      if (contractState.contract) {
        testContractConnection()
      }
    }
  }, [isFarcasterMiniApp])

  // Calculate button text based on whether there's a message
  const getButtonText = () => {
    const baseText = `Send ${getWankrAmountComment(formData.amount.toString())}`
    return formData.reason.trim() ? `${baseText} + Message` : baseText
  }

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="space-y-2">
        {/* Target Address Input */}
        <div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              id="targetAddress"
              name="targetAddress"
              value={formData.targetAddress}
              onChange={handleInputChange}
              placeholder={resolutionMode === 'farcaster-only' 
                ? "To: Enter Farcaster handle (@username)"
                : "To: Enter handle, wallet, or address"
              }
              className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              disabled={isSubmitting || isResolving}
            />
            <button
              type="button"
              onClick={resolveHandle}
              disabled={!formData.targetAddress.trim() || isSubmitting || isResolving}
              className="px-3 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors sm:w-auto font-medium text-sm"
            >
              {isResolving ? 'Resolving...' : 'Resolve'}
            </button>
          </div>
          
          {/* Resolution Options - Only show for web version */}
          {resolutionMode === 'all-options' && (
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => resolveWithPlatform('wallet')}
                disabled={!formData.targetAddress.trim() || isSubmitting || isResolving}
                className="px-3 py-1 text-xs bg-muted text-muted-foreground rounded-md hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Wallet
              </button>
              <button
                type="button"
                onClick={() => resolveWithPlatform('basenames')}
                disabled={!formData.targetAddress.trim() || isSubmitting || isResolving}
                className="px-3 py-1 text-xs bg-muted text-muted-foreground rounded-md hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Base Names
              </button>
              <button
                type="button"
                onClick={() => resolveWithPlatform('farcaster')}
                disabled={!formData.targetAddress.trim() || isSubmitting || isResolving}
                className="px-3 py-1 text-xs bg-muted text-muted-foreground rounded-md hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Farcaster
              </button>
              <button
                type="button"
                onClick={() => resolveWithPlatform('x')}
                disabled={!formData.targetAddress.trim() || isSubmitting || isResolving}
                className="px-3 py-1 text-xs bg-muted text-muted-foreground rounded-md hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Twitter/X
              </button>
            </div>
          )}
        </div>

        {/* Reason for Shame Input */}
        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-white mb-1">
            Reason for Shame
          </label>
          <textarea
            id="reason"
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            placeholder="Why are you shaming them? (optional)"
            rows={2}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-sm"
            disabled={isSubmitting}
          />
        </div>

        {/* Amount Display and Slider */}
        <div>
          <div className="flex justify-between items-center mb-1">
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
          
          <div className="relative mt-1 mb-4">
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
          className="w-full py-2 px-4 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm mt-3"
        >
          {isSubmitting ? 'Preparing...' : getButtonText()}
        </button>
        
        {/* Address Resolution Status */}
        {!resolvedAddress && formData.targetAddress.trim() && (
          <div className="text-xs text-muted-foreground text-center">
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
              
              {/* Transaction Button - Different handling for Mini App vs Web */}
              <div className="flex-1">
                {isFarcasterMiniApp ? (
                  <button
                    onClick={handleFarcasterTransaction}
                    disabled={isSubmitting}
                    className="w-full py-2 px-4 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Transaction'}
                  </button>
                ) : (
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
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
