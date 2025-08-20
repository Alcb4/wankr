"use client"

import { useState } from 'react'
import { ethers } from 'ethers'
import { walletService } from '../../services/walletService'
import { STANDARD_SHAME_AMOUNT } from '../../config/contract'
import type { SendShameForm } from '../../config/types'
import { showError, showSuccess } from '../../utils/ui'
import { Button, Input } from '../ui'
import { components } from '../../theme'

export function SendWankr() {
  const [formData, setFormData] = useState<SendShameForm>({
    targetAddress: '',
    reason: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.targetAddress.trim()) {
      showError('Please enter a target address')
      return
    }

    if (!formData.reason.trim()) {
      showError('Please enter a reason for the shame')
      return
    }

    const contractState = walletService.getContractState()
    if (!contractState.contract) {
      showError('Please connect your wallet first')
      return
    }

    try {
      setIsSubmitting(true)

      // Validate address format
      if (!ethers.isAddress(formData.targetAddress)) {
        throw new Error('Invalid Ethereum address')
      }

      // Send the shame transaction
      const tx = await contractState.contract.deliverShame(
        formData.targetAddress,
        formData.reason
      )

      showSuccess('Shame transaction sent! Waiting for confirmation...')

      // Wait for transaction confirmation
      const receipt = await tx.wait()
      
      showSuccess(`Shame delivered! Transaction: ${receipt.hash}`)

      // Reset form
      setFormData({
        targetAddress: '',
        reason: ''
      })

    } catch (error) {
      console.error('Failed to deliver shame:', error)
      showError(error instanceof Error ? error.message : 'Failed to deliver shame')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Target Address"
        name="targetAddress"
        value={formData.targetAddress}
        onChange={handleInputChange}
        placeholder="0x..."
      />

      <div className="flex flex-col gap-2">
        <label className="font-medium text-muted-foreground">
          Reason for Shame
        </label>
        <textarea
          name="reason"
          value={formData.reason}
          onChange={handleInputChange}
          placeholder="Why are you delivering shame?"
          rows={3}
          className={components.input.base + ' resize-vertical'}
        />
      </div>

      <div className={components.badge.primary}>
        <strong>Standard Shame Amount:</strong> {ethers.formatUnits(STANDARD_SHAME_AMOUNT, 18)} WANKR
      </div>

      <Button
        type="submit"
        isLoading={isSubmitting}
        size="lg"
      >
        {isSubmitting ? 'Delivering Shame...' : 'Deliver 10 WANKR Shame'}
      </Button>
    </form>
  )
}
