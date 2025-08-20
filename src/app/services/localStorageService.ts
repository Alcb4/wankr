import type { ShameTransaction, LocalStorageConfig } from '../types/shame-feed'

const DEFAULT_CONFIG: LocalStorageConfig = {
  prefix: 'wankr-shame-',
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  maxEntries: 1000
}

export const localStorageService = {
  // Store a single transaction
  storeTransaction: (transaction: ShameTransaction, config: Partial<LocalStorageConfig> = {}) => {
    const finalConfig = { ...DEFAULT_CONFIG, ...config }
    const key = `${finalConfig.prefix}${transaction.hash}`
    
    try {
      const data = {
        ...transaction,
        storedAt: Date.now()
      }
      localStorage.setItem(key, JSON.stringify(data))
      console.log('💾 Stored transaction in localStorage:', { 
        hash: transaction.hash?.slice(0, 10) + '...', 
        message: transaction.message?.slice(0, 30) + '...',
        amount: transaction.amount 
      })
      
      // Cleanup old entries
      localStorageService.cleanup(config)
      
      return true
    } catch (error) {
      console.error('Failed to store transaction:', error)
      return false
    }
  },

  // Store multiple transactions in bulk
  storeTransactions: (transactions: ShameTransaction[], config: Partial<LocalStorageConfig> = {}) => {
    const finalConfig = { ...DEFAULT_CONFIG, ...config }
    const results = transactions.map(tx => localStorageService.storeTransaction(tx, finalConfig))
    return results.every(Boolean)
  },

  // Get a single transaction
  getTransaction: (hash: string, config: Partial<LocalStorageConfig> = {}) => {
    const finalConfig = { ...DEFAULT_CONFIG, ...config }
    const key = `${finalConfig.prefix}${hash}`
    
    try {
      const data = localStorage.getItem(key)
      if (!data) return null
      
      const transaction = JSON.parse(data) as ShameTransaction & { storedAt: number }
      
      // Check TTL
      if (Date.now() - transaction.storedAt > finalConfig.ttl) {
        localStorage.removeItem(key)
        return null
      }
      
      return transaction
    } catch (error) {
      console.error('Failed to get transaction:', error)
      return null
    }
  },

  // Get all transactions in bulk
  getAllTransactions: (config: Partial<LocalStorageConfig> = {}) => {
    const finalConfig = { ...DEFAULT_CONFIG, ...config }
    const transactions: ShameTransaction[] = []
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(finalConfig.prefix)) {
          const transaction = localStorageService.getTransaction(
            key.replace(finalConfig.prefix, ''),
            finalConfig
          )
          if (transaction) {
            transactions.push(transaction)
          }
        }
      }
      
      // Sort by timestamp (newest first)
      const sortedTransactions = transactions.sort((a, b) => b.timestamp - a.timestamp)
      console.log('🗄️ Retrieved from localStorage:', sortedTransactions.map(tx => ({ 
        hash: tx.hash?.slice(0, 10) + '...', 
        message: tx.message?.slice(0, 30) + '...',
        amount: tx.amount 
      })))
      return sortedTransactions
    } catch (error) {
      console.error('Failed to get all transactions:', error)
      return []
    }
  },

  // Update transaction correlation
  updateCorrelation: (hash: string, netProtocolMessageId: string, config: Partial<LocalStorageConfig> = {}) => {
    const finalConfig = { ...DEFAULT_CONFIG, ...config }
    const transaction = localStorageService.getTransaction(hash, finalConfig)
    
    if (transaction) {
      const updatedTransaction = {
        ...transaction,
        netProtocolMessageId,
        isCorrelated: true
      }
      return localStorageService.storeTransaction(updatedTransaction, finalConfig)
    }
    
    return false
  },

  // Cleanup expired entries
  cleanup: (config: Partial<LocalStorageConfig> = {}) => {
    const finalConfig = { ...DEFAULT_CONFIG, ...config }
    const now = Date.now()
    const keysToRemove: string[] = []
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(finalConfig.prefix)) {
          const data = localStorage.getItem(key)
          if (data) {
            const transaction = JSON.parse(data) as ShameTransaction & { storedAt: number }
            if (now - transaction.storedAt > finalConfig.ttl) {
              keysToRemove.push(key)
            }
          }
        }
      }
      
      // Remove expired entries
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      // Limit total entries
      const allKeys = Object.keys(localStorage).filter(key => key.startsWith(finalConfig.prefix))
      if (allKeys.length > finalConfig.maxEntries) {
        const sortedKeys = allKeys.sort((a, b) => {
          const dataA = localStorage.getItem(a)
          const dataB = localStorage.getItem(b)
          if (!dataA || !dataB) return 0
          
          const transactionA = JSON.parse(dataA) as ShameTransaction & { storedAt: number }
          const transactionB = JSON.parse(dataB) as ShameTransaction & { storedAt: number }
          return transactionA.storedAt - transactionB.storedAt
        })
        
        const keysToRemove = sortedKeys.slice(0, allKeys.length - finalConfig.maxEntries)
        keysToRemove.forEach(key => localStorage.removeItem(key))
      }
    } catch (error) {
      console.error('Failed to cleanup localStorage:', error)
    }
  },

  // Get transactions within time range
  getTransactionsInRange: (startTime: number, endTime: number, config: Partial<LocalStorageConfig> = {}) => {
    const allTransactions = localStorageService.getAllTransactions(config)
    return allTransactions.filter(tx => tx.timestamp >= startTime && tx.timestamp <= endTime)
  },

  // Get uncorrelated transactions
  getUncorrelatedTransactions: (config: Partial<LocalStorageConfig> = {}) => {
    const allTransactions = localStorageService.getAllTransactions(config)
    return allTransactions.filter(tx => !tx.isCorrelated)
  },

  clearAllTransactions: () => {
    try {
      const keys = Object.keys(localStorage)
      const transactionKeys = keys.filter(key => key.startsWith(DEFAULT_CONFIG.prefix))
      transactionKeys.forEach(key => localStorage.removeItem(key))
      console.log(`🗑️ Cleared ${transactionKeys.length} transaction entries from localStorage`)
    } catch (error) {
      console.error('Error clearing all transactions:', error)
    }
  },

  /**
   * Clean up transactions that are missing proper hashes
   */
  cleanupInvalidTransactions(): void {
    try {
      const transactions = this.getAllTransactions()
      const validTransactions = transactions.filter(tx => 
        tx.hash && 
        !tx.hash.startsWith('blockchain-') && 
        tx.hash.length >= 10 // Basic validation for real transaction hashes
      )
      
      if (validTransactions.length !== transactions.length) {
        console.log(`🧹 Cleaned up ${transactions.length - validTransactions.length} invalid transactions`)
        this.clearAllTransactions()
        validTransactions.forEach(tx => this.storeTransaction(tx))
      }
    } catch (error) {
      console.error('Error cleaning up invalid transactions:', error)
    }
  }
}
