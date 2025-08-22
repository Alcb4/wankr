"use client"

import { useState, useEffect, useRef, useCallback } from 'react'

interface RealtimeUpdate {
  type: string
  data: unknown
  timestamp: number
}

interface UseRealtimeUpdatesOptions {
  subscriptions?: string[]
  clientId?: string
  autoReconnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

export function useRealtimeUpdates(options: UseRealtimeUpdatesOptions = {}) {
  const {
    subscriptions = ['shame-feed'],
    clientId,
    autoReconnect = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<RealtimeUpdate | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isConnectingRef = useRef(false)

  const connect = useCallback(() => {
    if (isConnectingRef.current) return
    
    isConnectingRef.current = true
    setError(null)

    try {
      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }

      // Build URL with parameters
      const params = new URLSearchParams({
        subscriptions: subscriptions.join(','),
        ...(clientId && { clientId })
      })

      const url = `/api/realtime?${params.toString()}`
      
      const eventSource = new EventSource(url)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log('🔌 Connected to real-time updates')
        setIsConnected(true)
        setReconnectAttempts(0)
        isConnectingRef.current = false
      }

      eventSource.onmessage = (event) => {
        try {
          const update: RealtimeUpdate = JSON.parse(event.data)
          setLastUpdate(update)
          
          // Log different types of updates
          switch (update.type) {
            case 'connection':
              console.log('✅ Real-time connection established:', (update.data as { message?: string })?.message || 'Connected')
              break
            case 'heartbeat':
              // Silently handle heartbeats
              break
            case 'shame-feed-update':
              console.log('📊 Real-time shame feed update received')
              break
            case 'leaderboard-update':
              console.log('🏆 Real-time leaderboard update received')
              break
            case 'quick-stats-update':
              console.log('📈 Real-time quick stats update received')
              break
            default:
              console.log('📡 Real-time update received:', update.type)
          }
        } catch (parseError) {
          console.error('❌ Error parsing real-time update:', parseError)
        }
      }

      eventSource.onerror = (event) => {
        console.error('❌ Real-time connection error:', event)
        setIsConnected(false)
        isConnectingRef.current = false
        
        if (autoReconnect && reconnectAttempts < maxReconnectAttempts) {
          setError(`Connection lost. Reconnecting... (${reconnectAttempts + 1}/${maxReconnectAttempts})`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1)
            connect()
          }, reconnectInterval)
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          setError('Failed to reconnect after maximum attempts. Please refresh the page.')
        } else {
          setError('Connection lost')
        }
      }

    } catch (error) {
      console.error('❌ Error establishing real-time connection:', error)
      setError('Failed to establish connection')
      isConnectingRef.current = false
    }
  }, [subscriptions, clientId, autoReconnect, reconnectInterval, maxReconnectAttempts, reconnectAttempts])

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    setIsConnected(false)
    setError(null)
    isConnectingRef.current = false
  }, [])

  const reconnect = useCallback(() => {
    disconnect()
    setReconnectAttempts(0)
    connect()
  }, [disconnect, connect])

  // Connect on mount
  useEffect(() => {
    connect()
    
    // Cleanup on unmount
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  // Cleanup reconnect timeout on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [])

  return {
    isConnected,
    lastUpdate,
    error,
    reconnectAttempts,
    connect,
    disconnect,
    reconnect
  }
}
