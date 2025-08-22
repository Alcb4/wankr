import { ShameFeedService } from '../../../../src/server/services/shameFeedService'
import { LeaderboardService } from '../../../../src/server/services/leaderboardService'

// Store active connections
export const connections = new Set<{
  id: string
  controller: ReadableStreamDefaultController
  lastActivity: number
}>()

// Cleanup inactive connections every 30 seconds
setInterval(() => {
  const now = Date.now()
  for (const connection of connections) {
    if (now - connection.lastActivity > 5 * 60 * 1000) { // 5 minutes timeout
      try {
        connection.controller.close()
      } catch (error) {
        // Connection already closed
      }
      connections.delete(connection)
    }
  }
}, 30 * 1000)

export async function sendInitialData(connection: { id: string; controller: ReadableStreamDefaultController; lastActivity: number }, subscriptions: string[]) {
  const encoder = new TextEncoder()
  
  try {
    for (const subscription of subscriptions) {
      switch (subscription) {
        case 'shame-feed':
          const shameFeedService = new ShameFeedService()
          const shameData = await shameFeedService.getShameFeed()
          const shameMessage = `data: ${JSON.stringify({
            type: 'shame-feed-update',
            data: shameData,
            timestamp: Date.now()
          })}\n\n`
          connection.controller.enqueue(encoder.encode(shameMessage))
          break
          
        case 'leaderboards':
          const leaderboardService = new LeaderboardService()
          const leaderboardData = await leaderboardService.getLeaderboards('all')
          const leaderboardMessage = `data: ${JSON.stringify({
            type: 'leaderboard-update',
            data: leaderboardData,
            timestamp: Date.now()
          })}\n\n`
          connection.controller.enqueue(encoder.encode(leaderboardMessage))
          break
          
        case 'quick-stats':
          // Quick stats are aggregated from multiple sources
          const quickStatsMessage = `data: ${JSON.stringify({
            type: 'quick-stats-update',
            data: { message: 'Quick stats will be updated via polling' },
            timestamp: Date.now()
          })}\n\n`
          connection.controller.enqueue(encoder.encode(quickStatsMessage))
          break
      }
    }
  } catch (error) {
    console.error('Error sending initial data:', error)
  }
}

// Function to broadcast updates to all connected clients
export function broadcastUpdate(type: string, data: unknown, subscriptions?: string[]) {
  const encoder = new TextEncoder()
  const message = `data: ${JSON.stringify({
    type,
    data,
    timestamp: Date.now()
  })}\n\n`
  
  const encodedMessage = encoder.encode(message)
  
  for (const connection of connections) {
    try {
      // If subscriptions are specified, only send to clients subscribed to those channels
      if (!subscriptions || subscriptions.some(sub => connection.id.includes(sub))) {
        connection.controller.enqueue(encodedMessage)
        connection.lastActivity = Date.now()
      }
    } catch (error) {
      // Remove broken connections
      connections.delete(connection)
    }
  }
}

// Function to get connection stats
export function getConnectionStats() {
  return {
    activeConnections: connections.size,
    connections: Array.from(connections).map(conn => ({
      id: conn.id,
      lastActivity: conn.lastActivity
    }))
  }
}
