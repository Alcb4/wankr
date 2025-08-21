"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { enhancedShameFeedService } from '../services/enhancedShameFeedService'
import type { ShameTransaction, ShameFeedStats } from '../types/shame-feed'

interface TransactionWithNewFlag extends ShameTransaction {
  isNew?: boolean
}

export function useShameFeed() {
  const [transactions, setTransactions] = useState<ShameTransaction[]>([])
  const [stats, setStats] = useState<ShameFeedStats>({
    totalTransactions: 0,
    totalShameDelivered: 0,
    uniqueShamers: 0,
    uniqueShamed: 0,
    lastUpdate: '',
    averageJudgment: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const previousTransactionHashes = useRef<Set<string>>(new Set())

  // Load shame data from enhanced service
  const loadData = useCallback(async () => {
    try {
      console.log('🔄 useShameFeed: Loading data from enhanced service...')
      setError(null)
  
      const data = await enhancedShameFeedService.getShameFeed()
      console.log('📊 useShameFeed: Received enhanced data', { 
        transactionCount: data.transactions.length,
        stats: data.stats 
      })
      
      const newTransactions = data.transactions as TransactionWithNewFlag[]
      
      // Mark new transactions
      newTransactions.forEach(tx => {
        if (tx.hash && !previousTransactionHashes.current.has(tx.hash)) {
          tx.isNew = true
          // Remove the new flag after animation completes
          setTimeout(() => {
            setTransactions(current => 
              current.map(t => 
                t.hash === tx.hash 
                  ? { ...t, isNew: false }
                  : t
              )
            )
          }, 500) // Match animation duration
        }
      })
      
      // Update the set of known transaction hashes
      previousTransactionHashes.current = new Set(
        newTransactions
          .map(tx => tx.hash)
          .filter((hash): hash is string => hash !== undefined)
      )
      
      setTransactions(newTransactions)
      setStats(data.stats)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shame feed')
      console.error('❌ Error loading enhanced shame feed:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Listen for refresh events
  useEffect(() => {
    const handleRefresh = () => {
      console.log('🔄 useShameFeed: Received refresh event')
      loadData()
    }

    window.addEventListener('refreshShameFeed', handleRefresh)
    return () => window.removeEventListener('refreshShameFeed', handleRefresh)
  }, [loadData])

  // Listen for handle resolution updates
  useEffect(() => {
    const cleanup = enhancedShameFeedService.listenForHandleUpdates((updatedTransaction) => {
      console.log('🎯 useShameFeed: Received handle resolution update:', updatedTransaction)
      
      // Update the transaction in the current state
      setTransactions(current => 
        current.map(tx => 
          tx.hash === updatedTransaction.hash 
            ? { ...tx, ...updatedTransaction }
            : tx
        )
      )
    })

    return cleanup
  }, [])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 35000) // Refresh every 35 seconds
    return () => clearInterval(interval)
  }, [loadData])

  return {
    transactions,
    stats,
    loading,
    error,
    refresh: loadData
  }
}
