import type { ShameTransaction, ShameFeedStats, LeaderboardData } from '../config/types'
import { withRetry, handleError } from '../utils/errorHandler'

// Use environment variable for API URL, fallback to same port as Next.js server  
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api'

class ApiService {
  // Get shame feed data
  async getShameFeed(): Promise<{ shameHistory: ShameTransaction[], stats: ShameFeedStats }> {
    return withRetry(async () => {
      const response = await fetch(`${API_BASE_URL}/shame-feed`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    }, { component: 'ApiService', action: 'getShameFeed' })
  }

  // Get leaderboard data
  async getLeaderboards(period: string = 'all'): Promise<LeaderboardData> {
    return withRetry(async () => {
      const response = await fetch(`${API_BASE_URL}/leaderboards/${period}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    }, { component: 'ApiService', action: 'getLeaderboards', userId: period })
  }

  // Resolve handles in bulk
  async resolveHandlesBulk(addresses: string[]): Promise<{ [address: string]: { displayName: string; source: string } }> {
    return withRetry(async () => {
      const response = await fetch(`${API_BASE_URL}/resolve-handles-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ addresses })
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    }, { component: 'ApiService', action: 'resolveHandlesBulk', userId: `${addresses.length} addresses` })
  }

  // Test Dune API
  async testDune(): Promise<{ success: boolean; data?: unknown; error?: string }> {
    return withRetry(async () => {
      const response = await fetch(`${API_BASE_URL}/test-dune`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    }, { component: 'ApiService', action: 'testDune' })
  }
}

// Export singleton instance
export const apiService = new ApiService()
