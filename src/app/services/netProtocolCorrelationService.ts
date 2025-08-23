// src/app/services/netProtocolCorrelationService.ts

import type { ShameTransaction, NetProtocolMessage } from '../types/shame-feed'

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  maxRequestsPerMinute: 30,
  maxBulkSize: 50,
  retryDelay: 2000, // 2 seconds
  maxRetries: 3
}

// Rate limiting state
let requestCount = 0
let lastResetTime = Date.now()

const resetRateLimit = () => {
  const now = Date.now()
  if (now - lastResetTime > 60000) { // 1 minute
    requestCount = 0
    lastResetTime = now
  }
}

const checkRateLimit = () => {
  resetRateLimit()
  if (requestCount >= RATE_LIMIT_CONFIG.maxRequestsPerMinute) {
    throw new Error('Rate limit exceeded. Please try again later.')
  }
  requestCount++
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const netProtocolCorrelationService = {
  // Correlate a single transaction with Net Protocol messages
  correlateTransaction: async (transaction: ShameTransaction): Promise<string | null> => {
    try {
      checkRateLimit()
      
      // Query Net Protocol for messages around the transaction time
      const startTime = transaction.timestamp - 300000 // 5 minutes before
      const endTime = transaction.timestamp + 300000 // 5 minutes after
      
      const messages = await netProtocolCorrelationService.getMessagesInRange(
        startTime,
        endTime,
        'wankr-shame'
      )
      
      // Find matching message by addresses
      const matchingMessage = messages.find(message => {
        const messageData = JSON.parse(message.data)
        return (
          messageData.from?.toLowerCase() === transaction.from.toLowerCase() &&
          messageData.to?.toLowerCase() === transaction.to.toLowerCase() &&
          Math.abs(message.timestamp - transaction.timestamp) < 1200000 // Within 20 minutes
        )
      })
      
      return matchingMessage?.id || null
    } catch (error) {
      console.error('Failed to correlate transaction:', error)
      return null
    }
  },

  // Correlate multiple transactions in bulk (rate limited)
  correlateTransactionsBulk: async (transactions: ShameTransaction[]): Promise<Map<string, string>> => {
    const correlations = new Map<string, string>()
    const chunks = []
    
    // Split into chunks to respect rate limits
    for (let i = 0; i < transactions.length; i += RATE_LIMIT_CONFIG.maxBulkSize) {
      chunks.push(transactions.slice(i, i + RATE_LIMIT_CONFIG.maxBulkSize))
    }
    
    for (const chunk of chunks) {
      try {
        // Process chunk with rate limiting
        const chunkCorrelations = await Promise.allSettled(
          chunk.map(async (transaction) => {
            const messageId = await netProtocolCorrelationService.correlateTransaction(transaction)
            return { hash: transaction.hash, messageId }
          })
        )
        
        // Collect successful correlations
        chunkCorrelations.forEach((result) => {
          if (result.status === 'fulfilled' && result.value.messageId) {
            correlations.set(result.value.hash, result.value.messageId)
          }
        })
        
        // Rate limiting delay between chunks
        if (chunks.indexOf(chunk) < chunks.length - 1) {
          await delay(RATE_LIMIT_CONFIG.retryDelay)
        }
      } catch (error) {
        console.error('Failed to process chunk:', error)
      }
    }
    
    return correlations
  },

  // Get messages in range (with retry logic)
  getMessagesInRange: async (startTime: number, endTime: number, topic: string, retryCount = 0): Promise<NetProtocolMessage[]> => {
    try {
      checkRateLimit()
      
      console.log(`🔍 Fetching Net Protocol messages (attempt ${retryCount + 1}):`, {
        topic,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString()
      })
      
      const response = await fetch(`/api/net-protocol/messages?startTime=${startTime}&endTime=${endTime}&topic=${topic}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('📭 Net Protocol API endpoint not found, returning empty array')
          return []
        }
        throw new Error(`Net Protocol API error: ${response.status}`)
      }
      
      const messages = await response.json()
      console.log(`📨 Received ${messages.length} Net Protocol messages`)
      return messages as NetProtocolMessage[]
    } catch (error) {
      if (retryCount < RATE_LIMIT_CONFIG.maxRetries && !(error instanceof Error && error.message.includes('404'))) {
        console.log(`⏳ Retrying Net Protocol request in ${RATE_LIMIT_CONFIG.retryDelay * (retryCount + 1)}ms`)
        await delay(RATE_LIMIT_CONFIG.retryDelay * (retryCount + 1))
        return netProtocolCorrelationService.getMessagesInRange(startTime, endTime, topic, retryCount + 1)
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (errorMessage.includes('missing revert data') || errorMessage.includes('require(false)')) {
        console.log('📭 No Net Protocol messages available (this is normal)')
      } else {
        console.log('📭 Net Protocol correlation unavailable:', errorMessage.split('(')[0])
      }
      return []
    }
  },

  // Get correlation status for multiple transactions
  getCorrelationStatus: async (transactions: ShameTransaction[]): Promise<Map<string, boolean>> => {
    const status = new Map<string, boolean>()
    
    try {
      const correlations = await netProtocolCorrelationService.correlateTransactionsBulk(transactions)
      
      transactions.forEach(transaction => {
        status.set(transaction.hash, correlations.has(transaction.hash))
      })
    } catch (error) {
      console.error('Failed to get correlation status:', error)
    }
    
    return status
  },

  // Batch correlation with progress callback
  correlateWithProgress: async (
    transactions: ShameTransaction[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<Map<string, string>> => {
    const correlations = new Map<string, string>()
    let completed = 0
    
    const chunks = []
    for (let i = 0; i < transactions.length; i += RATE_LIMIT_CONFIG.maxBulkSize) {
      chunks.push(transactions.slice(i, i + RATE_LIMIT_CONFIG.maxBulkSize))
    }
    
    for (const chunk of chunks) {
      const chunkCorrelations = await netProtocolCorrelationService.correlateTransactionsBulk(chunk)
      
      chunkCorrelations.forEach((messageId, hash) => {
        correlations.set(hash, messageId)
      })
      
      completed += chunk.length
      onProgress?.(completed, transactions.length)
      
      if (chunks.indexOf(chunk) < chunks.length - 1) {
        await delay(RATE_LIMIT_CONFIG.retryDelay)
      }
    }
    
    return correlations
  }
}
