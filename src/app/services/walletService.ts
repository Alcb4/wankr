import { ethers } from 'ethers'
import { WANKR_CONTRACT_ADDRESS, WANKR_ABI } from '../config/contract'
import type { WalletState, ContractState } from '../config/types'
import { showError, showSuccess } from '../utils/ui'

class WalletService {
  private walletState: WalletState = {
    address: null,
    balance: null,
    isConnected: false,
    isConnecting: false
  }

  constructor() {
    // Auto-reconnect if previously connected
    this.initializeConnection()
  }

  private async initializeConnection() {
    if (typeof window === 'undefined') return
    
    try {
      const wasConnected = localStorage.getItem('wankr-wallet-connected')
      if (wasConnected === 'true' && window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[]
        if (accounts.length > 0) {
          await this.connectWallet(true) // true = skip signature for auto-reconnect
        }
      }
    } catch (error) {
      console.log('Auto-reconnect failed:', error)
    }
  }

  private contractState: ContractState = {
    contract: null,
    provider: null,
    signer: null
  }

  private listeners: ((state: WalletState) => void)[] = []

  // Subscribe to wallet state changes
  subscribe(listener: (state: WalletState) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  // Notify all listeners of state changes
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.walletState))
  }

  // Get current wallet state
  getWalletState(): WalletState {
    return { ...this.walletState }
  }

  // Get contract state
  getContractState(): ContractState {
    return { ...this.contractState }
  }

  // Connect wallet
  async connectWallet(skipSignature = false): Promise<void> {
    try {
      this.walletState.isConnecting = true
      this.notifyListeners()

      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed. Please install MetaMask to use WANKR.')
      }

      // Request account access - force fresh connection
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      }) as string[]

      if (accounts.length === 0) {
        throw new Error('No accounts found')
      }

      const address = accounts[0]

      // Set up provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      // Force user to sign a message to ensure fresh connection (unless auto-reconnecting)
      if (!skipSignature) {
        const message = `Connect to WANKR App\n\nTimestamp: ${Date.now()}`
        await signer.signMessage(message)
      }

      // Create contract instance
      const contract = new ethers.Contract(WANKR_CONTRACT_ADDRESS, WANKR_ABI, signer)

      // Update state
      this.walletState = {
        address,
        balance: null,
        isConnected: true,
        isConnecting: false
      }

      this.contractState = {
        contract,
        provider,
        signer
      }

      // Update balance
      await this.updateBalance()

      // Set up event listeners
      this.setupEventListeners()

      // Remember connection for auto-reconnect
      localStorage.setItem('wankr-wallet-connected', 'true')

      if (!skipSignature) {
        showSuccess('Wallet connected successfully!')
      }
      this.notifyListeners()

    } catch (error) {
      this.walletState.isConnecting = false
      this.notifyListeners()
      showError(error instanceof Error ? error.message : 'Failed to connect wallet')
      throw error
    }
  }

  // Update WANKR balance
  async updateBalance(): Promise<void> {
    if (!this.contractState.contract || !this.walletState.address) return

    try {
      const balance = await this.contractState.contract.balanceOf(this.walletState.address)
      const formattedBalance = ethers.formatUnits(balance, 18)
      
      this.walletState.balance = formattedBalance
      this.notifyListeners()
    } catch (error) {
      console.error('Failed to update balance:', error)
    }
  }

  // Setup MetaMask event listeners
  private setupEventListeners(): void {
    if (typeof window.ethereum === 'undefined') return

    window.ethereum.on('accountsChanged', (accounts: unknown) => {
      if (Array.isArray(accounts) && accounts.length === 0) {
        // Disconnect if no accounts
        this.disconnectWallet()
      } else if (Array.isArray(accounts) && accounts.length > 0) {
        // Update address if accounts changed
        this.walletState.address = accounts[0] as string
        this.updateBalance()
      }
    })

    window.ethereum.on('chainChanged', this.handleChainChange)
  }

  private handleChainChange = () => {
    // Reload the page when chain changes
    window.location.reload()
  }

  // Disconnect wallet
  disconnectWallet(): void {
    this.walletState = {
      address: null,
      balance: null,
      isConnected: false,
      isConnecting: false
    }
    this.contractState = {
      contract: null,
      provider: null,
      signer: null
    }
    
    // Clear connection memory
    localStorage.removeItem('wankr-wallet-connected')
    
    this.notifyListeners()
    showSuccess('Wallet disconnected')
  }

  // Resolve address or handle to wallet address
  async resolveAddress(input: string): Promise<string> {
    // For now, only support direct Ethereum addresses
    // TODO: Implement Base Names, Farcaster, and X handle resolution
    if (ethers.isAddress(input)) {
      return input
    }
    
    throw new Error(`Invalid address format: ${input}. Only Ethereum addresses are currently supported.`)
  }
}

// Export singleton instance
export const walletService = new WalletService()
