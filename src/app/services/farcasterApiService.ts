// src/app/services/farcasterApiService.ts

interface FarcasterPost {
  id: string
  author: {
    fid: string
    username: string
    displayName: string
    address: string
  }
  content: string
  timestamp: number
}

interface FarcasterCast {
  hash: string
  author: {
    fid: string
    username: string
    displayName: string
    address: string
  }
  content: string
  timestamp: number
}

interface FarcasterUser {
  fid: string
  username: string
  displayName: string
  address: string
  avatar?: string
  verified?: boolean
}

/**
 * Service for interacting with Farcaster API
 * Handles post/cast context extraction and user information
 */
export class FarcasterApiService {
  private farcasterApiKey: string | undefined
  private baseUrl = 'https://api.farcaster.xyz'

  constructor() {
    this.farcasterApiKey = process.env.FARCASTER_API_KEY
  }

  /**
   * Get post information by post ID
   * This would be called when a Frame is clicked to get the post author
   */
  async getPostById(postId: string): Promise<FarcasterPost | null> {
    if (!this.farcasterApiKey) {
      console.warn('Farcaster API key not configured')
      return null
    }

    try {
      const response = await fetch(`${this.baseUrl}/v2/cast?identifier=${postId}&type=url`, {
        headers: {
          'Authorization': `Bearer ${this.farcasterApiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.error(`Farcaster API error: ${response.status}`)
        return null
      }

      const data = await response.json()
      
      if (data.cast) {
        return {
          id: data.cast.hash,
          author: {
            fid: data.cast.author.fid,
            username: data.cast.author.username,
            displayName: data.cast.author.displayName,
            address: data.cast.author.verifiedAddresses?.eth?.[0] || ''
          },
          content: data.cast.text,
          timestamp: new Date(data.cast.timestamp).getTime()
        }
      }

      return null
    } catch (error) {
      console.error('Error fetching Farcaster post:', error)
      return null
    }
  }

  /**
   * Get cast information by cast hash
   */
  async getCastByHash(castHash: string): Promise<FarcasterCast | null> {
    if (!this.farcasterApiKey) {
      console.warn('Farcaster API key not configured')
      return null
    }

    try {
      const response = await fetch(`${this.baseUrl}/v2/cast?identifier=${castHash}&type=hash`, {
        headers: {
          'Authorization': `Bearer ${this.farcasterApiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.error(`Farcaster API error: ${response.status}`)
        return null
      }

      const data = await response.json()
      
      if (data.cast) {
        return {
          hash: data.cast.hash,
          author: {
            fid: data.cast.author.fid,
            username: data.cast.author.username,
            displayName: data.cast.author.displayName,
            address: data.cast.author.verifiedAddresses?.eth?.[0] || ''
          },
          content: data.cast.text,
          timestamp: new Date(data.cast.timestamp).getTime()
        }
      }

      return null
    } catch (error) {
      console.error('Error fetching Farcaster cast:', error)
      return null
    }
  }

  /**
   * Get user information by FID
   */
  async getUserByFid(fid: string): Promise<FarcasterUser | null> {
    if (!this.farcasterApiKey) {
      console.warn('Farcaster API key not configured')
      return null
    }

    try {
      const response = await fetch(`${this.baseUrl}/v2/user?fid=${fid}`, {
        headers: {
          'Authorization': `Bearer ${this.farcasterApiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.error(`Farcaster API error: ${response.status}`)
        return null
      }

      const data = await response.json()
      
      if (data.user) {
        return {
          fid: data.user.fid,
          username: data.user.username,
          displayName: data.user.displayName,
          address: data.user.verifiedAddresses?.eth?.[0] || '',
          avatar: data.user.pfp?.url,
          verified: data.user.verified
        }
      }

      return null
    } catch (error) {
      console.error('Error fetching Farcaster user:', error)
      return null
    }
  }

  /**
   * Get user information by username
   */
  async getUserByUsername(username: string): Promise<FarcasterUser | null> {
    if (!this.farcasterApiKey) {
      console.warn('Farcaster API key not configured')
      return null
    }

    try {
      const response = await fetch(`${this.baseUrl}/v2/user?username=${username}`, {
        headers: {
          'Authorization': `Bearer ${this.farcasterApiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.error(`Farcaster API error: ${response.status}`)
        return null
      }

      const data = await response.json()
      
      if (data.user) {
        return {
          fid: data.user.fid,
          username: data.user.username,
          displayName: data.user.displayName,
          address: data.user.verifiedAddresses?.eth?.[0] || '',
          avatar: data.user.pfp?.url,
          verified: data.user.verified
        }
      }

      return null
    } catch (error) {
      console.error('Error fetching Farcaster user:', error)
      return null
    }
  }

  /**
   * Extract author information from post context
   * This is the main function used by Frame context extraction
   */
  async extractAuthorFromContext(postId?: string, castId?: string): Promise<FarcasterUser | null> {
    if (postId) {
      const post = await this.getPostById(postId)
      if (post) {
        return {
          fid: post.author.fid,
          username: post.author.username,
          displayName: post.author.displayName,
          address: post.author.address
        }
      }
    }

    if (castId) {
      const cast = await this.getCastByHash(castId)
      if (cast) {
        return {
          fid: cast.author.fid,
          username: cast.author.username,
          displayName: cast.author.displayName,
          address: cast.author.address
        }
      }
    }

    return null
  }

  /**
   * Get user's primary Ethereum address
   */
  async getPrimaryAddress(fid: string): Promise<string | null> {
    if (!this.farcasterApiKey) {
      console.warn('Farcaster API key not configured')
      return null
    }

    try {
      const response = await fetch(`${this.baseUrl}/fc/primary-address?fid=${fid}&protocol=ethereum`, {
        headers: {
          'Authorization': `Bearer ${this.farcasterApiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.error(`Farcaster API error: ${response.status}`)
        return null
      }

      const data = await response.json()
      
      if (data.result?.address) {
        return data.result.address
      }

      return null
    } catch (error) {
      console.error('Error fetching primary address:', error)
      return null
    }
  }
}

export const farcasterApiService = new FarcasterApiService()
