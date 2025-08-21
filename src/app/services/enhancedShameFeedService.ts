import { localStorageService } from './localStorageService'
import { netProtocolCorrelationService } from './netProtocolCorrelationService'
import type { ShameTransaction, ShameFeedData, ShameFeedStats } from '../types/shame-feed'

// Event emitter for handle resolution updates
const eventEmitter = new EventTarget()

export const enhancedShameFeedService = {
  // Store transaction immediately after success
  storeTransactionSuccess: async (transactionData: {
    hash: string
    from: string
    to: string
    amount: number
    message?: string
    blockNumber: number
  }) => {
    const transaction: ShameTransaction = {
      ...transactionData,
      timestamp: Date.now(),
      isCorrelated: false
    }
    
    // Store locally immediately
    const stored = localStorageService.storeTransaction(transaction)
    
    if (stored && transactionData.message) {
      // Trigger correlation in background
      enhancedShameFeedService.correlateTransaction(transaction.hash)
    }
    
    return stored
  },

  // Correlate a single transaction
  correlateTransaction: async (hash: string) => {
    const transaction = localStorageService.getTransaction(hash)
    if (!transaction || transaction.isCorrelated) return false
    
    const messageId = await netProtocolCorrelationService.correlateTransaction(transaction)
    if (messageId) {
      return localStorageService.updateCorrelation(hash, messageId)
    }
    
    return false
  },

  // Get shame feed data (hybrid approach)
  getShameFeed: async (): Promise<ShameFeedData> => {
    try {
      // Clean up any invalid transactions first
      localStorageService.cleanupInvalidTransactions()
      
      // Get all local transactions
      const localTransactions = localStorageService.getAllTransactions()
      console.log('📦 Local transactions:', localTransactions.map(tx => ({ 
        hash: tx.hash?.slice(0, 10) + '...', 
        message: tx.message?.slice(0, 30) + '...',
        amount: tx.amount 
      })))
      
      // Get blockchain transactions from the server
      const response = await fetch('/api/shame-feed')
      let blockchainTransactions: ShameTransaction[] = []
      
      if (response.ok) {
        const data = await response.json()
        blockchainTransactions = data.shameHistory.map((tx: { transactionHash?: string; from: string; to: string; amount: string; reason?: string; timestamp: number; blockNumber?: number; fromDisplayName?: string; toDisplayName?: string; judgment?: string; fromSource?: string; toSource?: string }) => ({
          hash: tx.transactionHash || `blockchain-${tx.from}-${tx.to}-${tx.blockNumber || tx.timestamp}`, // Fallback hash for blockchain transactions
          from: tx.from,
          to: tx.to,
          amount: parseFloat(tx.amount),
          message: tx.reason || undefined,
          timestamp: tx.timestamp * 1000, // Convert to milliseconds
          blockNumber: tx.blockNumber || 0,
          netProtocolMessageId: undefined,
          isCorrelated: false,
          fromDisplayName: tx.fromDisplayName,
          toDisplayName: tx.toDisplayName,
          judgment: tx.judgment,
          fromSource: tx.fromSource,
          toSource: tx.toSource
        }))
      }
      
      // Combine and deduplicate transactions (merge local and blockchain data)
      const combinedTransactions = [...localTransactions]
      
      blockchainTransactions.forEach(blockchainTx => {
        // More robust deduplication: check by hash first, then by signature (from, to, amount, timestamp)
        const existingIndex = combinedTransactions.findIndex(localTx => {
          // Primary check: exact hash match
          if (localTx.hash === blockchainTx.hash && localTx.hash && !localTx.hash.startsWith('blockchain-')) {
            return true
          }
          
          // Secondary check: transaction signature match (for cases where hashes differ)
          const timeDiff = Math.abs(localTx.timestamp - blockchainTx.timestamp)
          return localTx.from.toLowerCase() === blockchainTx.from.toLowerCase() &&
                 localTx.to.toLowerCase() === blockchainTx.to.toLowerCase() &&
                 localTx.amount === blockchainTx.amount &&
                 timeDiff < 60000 // Within 1 minute
        })
        
        if (existingIndex === -1) {
          // New transaction from blockchain
          combinedTransactions.push(blockchainTx)
        } else {
          // Merge data: keep local message, add blockchain data
          const localTx = combinedTransactions[existingIndex]
          combinedTransactions[existingIndex] = {
            ...blockchainTx,
            message: localTx.message || blockchainTx.message, // Prefer local message
            isCorrelated: localTx.isCorrelated,
            netProtocolMessageId: localTx.netProtocolMessageId,
            hash: blockchainTx.hash || localTx.hash // Use blockchain hash if available
          }
        }
      })
      
      // Sort by timestamp (newest first)
      combinedTransactions.sort((a, b) => b.timestamp - a.timestamp)
      
      console.log('🔗 Combined transactions:', combinedTransactions.map(tx => ({ 
        hash: tx.hash?.slice(0, 10) + '...', 
        message: tx.message?.slice(0, 30) + '...',
        amount: tx.amount,
        from: tx.from.slice(0, 6) + '...',
        to: tx.to.slice(0, 6) + '...',
        timestamp: new Date(tx.timestamp).toLocaleTimeString(),
        source: tx.message ? 'local' : 'blockchain'
      })))
      
      console.log(`📊 Deduplication results: ${localTransactions.length} local + ${blockchainTransactions.length} blockchain = ${combinedTransactions.length} combined`)
      
      // Get uncorrelated transactions for background correlation
      const uncorrelated = localStorageService.getUncorrelatedTransactions()
      
      if (uncorrelated.length > 0) {
        // Correlate in background (non-blocking)
        enhancedShameFeedService.correlateUncorrelatedTransactions(uncorrelated)
      }
      
      // Calculate stats
      const stats = enhancedShameFeedService.calculateStats(combinedTransactions)
      
      return {
        transactions: combinedTransactions,
        stats
      }
    } catch (error) {
      console.error('Error getting shame feed:', error)
      
      // Fallback to local storage only
      const localTransactions = localStorageService.getAllTransactions()
      const stats = enhancedShameFeedService.calculateStats(localTransactions)
      
      return {
        transactions: localTransactions,
        stats
      }
    }
  },

  // Correlate uncorrelated transactions in background
  correlateUncorrelatedTransactions: async (transactions: ShameTransaction[]) => {
    try {
      const correlations = await netProtocolCorrelationService.correlateWithProgress(
        transactions,
        (completed, total) => {
          console.log(`Correlating transactions: ${completed}/${total}`)
        }
      )
      
      // Update local storage with correlations
      correlations.forEach((messageId, hash) => {
        localStorageService.updateCorrelation(hash, messageId)
      })
      
      console.log(`Correlated ${correlations.size} transactions`)
    } catch (error) {
      console.error('Background correlation failed:', error)
    }
  },

  // Calculate shame feed statistics
  calculateStats: (transactions: ShameTransaction[]): ShameFeedStats => {
    const uniqueShamers = new Set(transactions.map(tx => tx.from))
    const uniqueShamed = new Set(transactions.map(tx => tx.to))
    const totalShameDelivered = transactions.reduce((sum, tx) => sum + tx.amount, 0)
    const averageJudgment = transactions.length > 0 
      ? totalShameDelivered / transactions.length 
      : 0
    
    return {
      totalTransactions: transactions.length,
      totalShameDelivered,
      uniqueShamers: uniqueShamers.size,
      uniqueShamed: uniqueShamed.size,
      lastUpdate: new Date().toISOString(),
      averageJudgment
    }
  },

  // Get transactions by address
  getTransactionsByAddress: (address: string): ShameTransaction[] => {
    const allTransactions = localStorageService.getAllTransactions()
    return allTransactions.filter(tx => 
      tx.from.toLowerCase() === address.toLowerCase() || 
      tx.to.toLowerCase() === address.toLowerCase()
    )
  },

  // Get recent transactions (last N hours)
  getRecentTransactions: (hours: number = 24): ShameTransaction[] => {
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000)
    return localStorageService.getTransactionsInRange(cutoffTime, Date.now())
  },

  // Listen for handle resolution updates from server
  listenForHandleUpdates: (callback: (transaction: ShameTransaction) => void) => {
    const handleUpdate = (event: Event) => {
      const customEvent = event as CustomEvent
      callback(customEvent.detail)
    }
    
    eventEmitter.addEventListener('handleResolutionUpdate', handleUpdate)
    
    // Return cleanup function
    return () => {
      eventEmitter.removeEventListener('handleResolutionUpdate', handleUpdate)
    }
  },

  // Emit handle resolution update (called by server)
  emitHandleUpdate: (transaction: ShameTransaction) => {
    const event = new CustomEvent('handleResolutionUpdate', { detail: transaction })
    eventEmitter.dispatchEvent(event)
  },

  // Refresh shame feed (force correlation)
  refreshShameFeed: async (): Promise<ShameFeedData> => {
    const allTransactions = localStorageService.getAllTransactions()
    
    // Force correlation of all transactions
    const correlations = await netProtocolCorrelationService.correlateWithProgress(
      allTransactions,
      (completed, total) => {
        console.log(`Refreshing correlations: ${completed}/${total}`)
      }
    )
    
    // Update local storage
    correlations.forEach((messageId, hash) => {
      localStorageService.updateCorrelation(hash, messageId)
    })
    
    // Return updated feed
    const updatedTransactions = localStorageService.getAllTransactions()
    const stats = enhancedShameFeedService.calculateStats(updatedTransactions)
    
    return {
      transactions: updatedTransactions,
      stats
    }
  },

  // Clean up old data
  cleanup: () => {
    localStorageService.cleanup()
  },

  // Export data for backup
  exportData: (): string => {
    const transactions = localStorageService.getAllTransactions()
    return JSON.stringify(transactions, null, 2)
  },

  // Import data from backup
  importData: (data: string): boolean => {
    try {
      const transactions = JSON.parse(data) as ShameTransaction[]
      return localStorageService.storeTransactions(transactions)
    } catch (error) {
      console.error('Failed to import data:', error)
      return false
    }
  }
}
