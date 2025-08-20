import { ethers } from 'ethers'
import { WANKR_CONTRACT_ADDRESS, WANKR_ABI } from '../config/contract'

// Net Protocol Contract Configuration
const NET_CONTRACT_ADDRESS = '0x00000000b24d62781db359b07880a105cd0b64e6'

// Multicall3 Contract (standard for batching transactions)
const MULTICALL3_ADDRESS = '0xca11bde05977b3631167028862be2a173976ca11'
const MULTICALL3_ABI = [
  'function aggregate3(tuple(address target, bool allowFailure, bytes callData)[] calls) external payable returns (tuple(bool success, bytes returnData)[] returnData)'
]

export interface BatchTransactionData {
  targetAddress: string
  amount: string
  reason: string
  netMessage: string
}

class BatchTransactionService {
  private provider: ethers.BrowserProvider | null = null
  private wankrContract: ethers.Contract | null = null
  private multicallContract: ethers.Contract | null = null

  async initialize(provider: ethers.BrowserProvider) {
    this.provider = provider
    this.wankrContract = new ethers.Contract(WANKR_CONTRACT_ADDRESS, WANKR_ABI, provider)
    this.multicallContract = new ethers.Contract(MULTICALL3_ADDRESS, MULTICALL3_ABI, provider)
  }

  async sendAtomicShame(data: BatchTransactionData): Promise<ethers.TransactionResponse> {
    if (!this.provider || !this.wankrContract || !this.multicallContract) {
      throw new Error('Batch transaction service not initialized')
    }

    const signer = await this.provider.getSigner()
    
    // Convert amount to wei
    const amountInWei = ethers.parseUnits(data.amount, 18)
    
    console.log('Debug: Preparing atomic shame transaction', {
      targetAddress: data.targetAddress,
      amount: data.amount,
      amountInWei: amountInWei.toString(),
      reason: data.reason,
      netMessage: data.netMessage
    })
    
    // Try atomic transactions with proper error handling
    try {
      // First try to check wallet capabilities
      try {
        const capabilities = await this.provider.send('wallet_getCapabilities', [])
        console.log('Debug: Wallet capabilities:', capabilities)
        
        if (capabilities && capabilities['Base Account'] && capabilities['Base Account'].atomic) {
          console.log('Debug: Attempting Base Account atomic transaction')
          return await this.sendBaseAtomicTransaction(data, amountInWei)
        }
      } catch (capError) {
        console.log('Debug: Could not check wallet capabilities:', capError)
      }
      
      // Try Multicall3 atomic transaction
      console.log('Debug: Attempting Multicall3 atomic transaction')
      return await this.sendMulticall3Transaction(data, amountInWei)
      
    } catch (atomicError) {
      console.error('Debug: Atomic transaction failed, falling back to simple transfer:', atomicError)
      
      // Final fallback: simple WANKR transfer only
      console.log('Debug: Using simple WANKR transfer fallback')
      const signer = await this.provider!.getSigner()
      const wankrContractWithSigner = this.wankrContract!.connect(signer) as ethers.Contract & {
        transfer: (to: string, amount: bigint) => Promise<ethers.TransactionResponse>
      }
      return await wankrContractWithSigner.transfer(data.targetAddress, amountInWei)
    }
  }

  private async sendBaseAtomicTransaction(data: BatchTransactionData, amountInWei: bigint): Promise<ethers.TransactionResponse> {
    const signer = await this.provider!.getSigner()
    
    // Prepare the transactions for atomic execution
    const transactions = [
      {
        to: WANKR_CONTRACT_ADDRESS,
        value: '0x0',
        data: this.wankrContract!.interface.encodeFunctionData('transfer', [
          data.targetAddress,
          amountInWei
        ])
      },
      {
        to: NET_CONTRACT_ADDRESS,
        value: '0x0',
        data: this.encodeNetProtocolMessage(data.netMessage, 'wankr-shame', JSON.stringify({
          from: await signer.getAddress(),
          to: data.targetAddress,
          amount: data.amount,
          reason: data.reason,
          timestamp: Date.now()
        }))
      }
    ]

    console.log('Debug: Sending OnchainKit atomic transaction with', transactions.length, 'calls')
    
    // Use OnchainKit's atomic transaction capabilities
    // This will use the Base Account atomic execution under the hood
    return await signer.sendTransaction({
      to: MULTICALL3_ADDRESS,
      data: this.multicallContract!.interface.encodeFunctionData('aggregate3', [
        {
          target: WANKR_CONTRACT_ADDRESS,
          allowFailure: false,
          callData: this.wankrContract!.interface.encodeFunctionData('transfer', [
            data.targetAddress,
            amountInWei
          ])
        },
        {
          target: NET_CONTRACT_ADDRESS,
          allowFailure: true,
          callData: this.encodeNetProtocolMessage(data.netMessage, 'wankr-shame', JSON.stringify({
            from: await signer.getAddress(),
            to: data.targetAddress,
            amount: data.amount,
            reason: data.reason,
            timestamp: Date.now()
          }))
        }
      ])
    })
  }

  private async sendMulticall3Transaction(data: BatchTransactionData, amountInWei: bigint): Promise<ethers.TransactionResponse> {
    const signer = await this.provider!.getSigner()
    
    // Prepare the calls for Multicall3
    const calls = [
      {
        target: WANKR_CONTRACT_ADDRESS,
        allowFailure: false,
        callData: this.wankrContract!.interface.encodeFunctionData('transfer', [
          data.targetAddress,
          amountInWei
        ])
      },
      {
        target: NET_CONTRACT_ADDRESS,
        allowFailure: true, // Allow Net Protocol to fail without failing the whole transaction
        callData: this.encodeNetProtocolMessage(data.netMessage, 'wankr-shame', JSON.stringify({
          from: await signer.getAddress(),
          to: data.targetAddress,
          amount: data.amount,
          reason: data.reason,
          timestamp: Date.now()
        }))
      }
    ]

    console.log('Debug: Sending Multicall3 transaction with', calls.length, 'calls')
    
    // Execute the batch transaction using Multicall3
    const encodedData = this.multicallContract!.interface.encodeFunctionData('aggregate3', [calls])
    
    return await signer.sendTransaction({
      to: MULTICALL3_ADDRESS,
      data: encodedData
    })
  }

  private encodeNetProtocolMessage(text: string, topic: string, data: string): string {
    // Encode the sendMessage function call
    const netAbi = ['function sendMessage(string text, string topic, bytes data) external']
    const netInterface = new ethers.Interface(netAbi)
    const dataBytes = ethers.toUtf8Bytes(data)
    
    return netInterface.encodeFunctionData('sendMessage', [text, topic, dataBytes])
  }
}

export const batchTransactionService = new BatchTransactionService()
