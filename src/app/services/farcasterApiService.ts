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
  private neynarApiKey: string | undefined
  private baseUrl = 'https://api.neynar.com/v2'

  constructor() {
    this.neynarApiKey = process.env.NEXT_PUBLIC_NEYNAR_API_KEY || process.env.NEYNAR_API_KEY
  }

  /**
   * Get post information by post ID
   * This would be called when a Frame is clicked to get the post author
   */
  async getPostById(postId: string): Promise<FarcasterPost | null> {
    if (!this.neynarApiKey) {
      console.warn('Neynar API key not configured')
      return null
    }

    try {
      const response = await fetch(`${this.baseUrl}/farcaster/cast?identifier=${postId}&type=url`, {
        headers: {
          'x-api-key': this.neynarApiKey,
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
            displayName: data.cast.author.display_name,
            address: data.cast.author.verified_addresses?.eth_addresses?.[0] || ''
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
    if (!this.neynarApiKey) {
      console.warn('Neynar API key not configured')
      return null
    }

    try {
      const response = await fetch(`${this.baseUrl}/farcaster/cast?identifier=${castHash}&type=hash`, {
        headers: {
          'x-api-key': this.neynarApiKey,
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
            displayName: data.cast.author.display_name,
            address: data.cast.author.verified_addresses?.eth_addresses?.[0] || ''
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
    if (!this.neynarApiKey) {
      console.warn('Neynar API key not configured')
      return null
    }

    try {
      const response = await fetch(`${this.baseUrl}/farcaster/user?fid=${fid}`, {
        headers: {
          'x-api-key': this.neynarApiKey,
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
          displayName: data.user.display_name,
          address: data.user.verified_addresses?.eth_addresses?.[0] || '',
          avatar: data.user.pfp_url,
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
    if (!this.neynarApiKey) {
      console.warn('Neynar API key not configured')
      return null
    }

    try {
      const response = await fetch(`${this.baseUrl}/farcaster/user?username=${username}`, {
        headers: {
          'x-api-key': this.neynarApiKey,
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
          displayName: data.user.display_name,
          address: data.user.verified_addresses?.eth_addresses?.[0] || '',
          avatar: data.user.pfp_url,
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
   * This is the main method used by Frames to get the target
   */
  async extractAuthorFromContext(postId?: string, castId?: string): Promise<{
    address: string
    handle: string
    displayName: string
    fid: string
  } | null> {
    try {
      let post: FarcasterPost | FarcasterCast | null = null

      if (postId) {
        post = await this.getPostById(postId)
      } else if (castId) {
        post = await this.getCastByHash(castId)
      }

      if (post) {
        return {
          address: post.author.address,
          handle: post.author.username,
          displayName: post.author.displayName,
          fid: post.author.fid
        }
      }

      return null
    } catch (error) {
      console.error('Error extracting author from context:', error)
      return null
    }
  }
}

// Export singleton instance
export const farcasterApiService = new FarcasterApiService()
