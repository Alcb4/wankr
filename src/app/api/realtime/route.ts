import { NextRequest } from 'next/server'
import { connections, sendInitialData } from './utils'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId') || `client_${Date.now()}_${Math.random()}`
  const subscriptions = searchParams.get('subscriptions')?.split(',') || ['shame-feed']

  // Set up SSE headers
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      const connection = {
        id: clientId,
        controller,
        lastActivity: Date.now()
      }
      
      connections.add(connection)
      
      // Send initial connection message
      const initialMessage = `data: ${JSON.stringify({
        type: 'connection',
        clientId,
        timestamp: Date.now(),
        message: 'Connected to real-time updates'
      })}\n\n`
      
      controller.enqueue(encoder.encode(initialMessage))
      
      // Send initial data for subscribed channels
      sendInitialData(connection, subscriptions)
      
      // Set up periodic updates
      const updateInterval = setInterval(() => {
        try {
          connection.lastActivity = Date.now()
          
          // Send heartbeat to keep connection alive
          const heartbeat = `data: ${JSON.stringify({
            type: 'heartbeat',
            timestamp: Date.now()
          })}\n\n`
          
          controller.enqueue(encoder.encode(heartbeat))
        } catch (error) {
          clearInterval(updateInterval)
          connections.delete(connection)
        }
      }, 30 * 1000) // Heartbeat every 30 seconds
      
      // Clean up on connection close
      request.signal.addEventListener('abort', () => {
        clearInterval(updateInterval)
        connections.delete(connection)
        try {
          controller.close()
        } catch (error) {
          // Already closed
        }
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  })
}


