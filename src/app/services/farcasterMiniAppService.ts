// src/app/services/farcasterMiniAppService.ts

import { ethers } from 'ethers'
import { 
  WANKR_CONTRACT_ADDRESS, 
  WANKR_ABI, 
  SEND_SHAME_AND_MESSAGE_ADDRESS, 
  SEND_SHAME_AND_MESSAGE_ABI 
} from '../config/contract'

export interface MiniAppShameRequest {
  to: string
  amount: number
  message: string
  topic?: string
}

export interface MiniAppShameResponse {
  success: boolean
  transactionHash?: string
  error?: string
}

/**
 * Service for handling Farcaster Mini App transactions
 * Reuses existing backend logic but adapted for Mini App flow
 */
export class FarcasterMiniAppService {
  private provider: ethers.Provider
  private wankrContract: ethers.Contract
  private helperContract: ethers.Contract

  constructor(provider: ethers.Provider) {
    this.provider = provider
    this.wankrContract = new ethers.Contract(
      WANKR_CONTRACT_ADDRESS,
      WANKR_ABI,
      provider
    )
    this.helperContract = new ethers.Contract(
      SEND_SHAME_AND_MESSAGE_ADDRESS,
      SEND_SHAME_AND_MESSAGE_ABI,
      provider
    )
  }

  /**
   * Check if user has approved the helper contract
   */
  async checkApproval(userAddress: string, amount: bigint): Promise<boolean> {
    try {
      const allowance = await this.wankrContract.allowance(userAddress, SEND_SHAME_AND_MESSAGE_ADDRESS)
      return allowance >= amount
    } catch (error) {
      console.error('Error checking approval:', error)
      return false
    }
  }

  /**
   * Approve helper contract to spend WANKR tokens
   */
  async approveHelperContract(signer: ethers.Signer, amount: bigint): Promise<{ success: boolean; error?: string; transactionHash?: string }> {
    try {
      const wankrContractWithSigner = this.wankrContract.connect(signer) as ethers.Contract
      const tx = await wankrContractWithSigner.approve(SEND_SHAME_AND_MESSAGE_ADDRESS, amount)
      const receipt = await tx.wait()
      
      return {
        success: true,
        transactionHash: receipt?.hash
      }
    } catch (error) {
      console.error('Error approving helper contract:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Send shame transaction using helper contract
   */
  async sendShameTransaction(
    signer: ethers.Signer,
    request: MiniAppShameRequest
  ): Promise<MiniAppShameResponse> {
    try {
      const userAddress = await signer.getAddress()
      const amountInWei = ethers.parseUnits(request.amount.toString(), 18)
      const topic = request.topic || 'wankr-shame'

      // Check approval
      const hasApproval = await this.checkApproval(userAddress, amountInWei)
      if (!hasApproval) {
        return {
          success: false,
          error: 'Helper contract not approved. Please approve WANKR tokens first.'
        }
      }

      // Send transaction using helper contract
      const helperContractWithSigner = this.helperContract.connect(signer) as ethers.Contract
      const tx = await helperContractWithSigner.sendShameAndMessage(
        request.to,
        amountInWei,
        request.message,
        topic
      )

      const receipt = await tx.wait()

      return {
        success: true,
        transactionHash: receipt?.hash
      }

    } catch (error) {
      console.error('Mini App shame transaction error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get user's WANKR balance
   */
  async getBalance(userAddress: string): Promise<bigint> {
    try {
      return await this.wankrContract.balanceOf(userAddress)
    } catch (error) {
      console.error('Error getting balance:', error)
      return BigInt(0)
    }
  }
}
