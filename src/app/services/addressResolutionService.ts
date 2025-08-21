import { AddressResolutionBaseNames } from './addressResolutionBaseNames'
import { AddressResolutionFarcaster } from './addressResolutionFarcaster'
import { AddressResolutionX } from './addressResolutionX'

export interface AddressResolution {
  address: string
  displayName: string
  source: 'wallet' | 'basenames' | 'farcaster' | 'x'
  handle?: string
  platform?: string
  verified?: boolean
  lastUpdated: number
}

export type ResolutionPlatform = 'wallet' | 'basenames' | 'farcaster' | 'x'

export class AddressResolutionService {
  private cache: Map<string, AddressResolution> = new Map()
  private basenamesResolver: AddressResolutionBaseNames
  private farcasterResolver: AddressResolutionFarcaster
  private xResolver: AddressResolutionX

  constructor() {
    this.basenamesResolver = new AddressResolutionBaseNames()
    this.farcasterResolver = new AddressResolutionFarcaster()
    this.xResolver = new AddressResolutionX()
  }

  /**
   * Resolve handle to address based on platform
   */
  async resolveHandle(handle: string, platform: ResolutionPlatform): Promise<AddressResolution> {
    const cacheKey = `${platform}:${handle.toLowerCase()}`
    
    // Check cache first
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.lastUpdated < 300000) { // 5 minute cache
      return cached
    }

    let resolution: AddressResolution

    switch (platform) {
      case 'wallet':
        resolution = this.resolveWalletAddress(handle)
        break
      case 'basenames':
        resolution = await this.basenamesResolver.resolveBasename(handle)
        break
      case 'farcaster':
        resolution = await this.farcasterResolver.resolveFarcasterHandle(handle)
        break
      case 'x':
        resolution = await this.xResolver.resolveXHandle(handle)
        break
      default:
        throw new Error(`Unsupported platform: ${platform}`)
    }

    // Cache the result
    this.cache.set(cacheKey, resolution)
    
    return resolution
  }

  /**
   * Resolve direct wallet address
   */
  private resolveWalletAddress(address: string): AddressResolution {
    // Basic Ethereum address validation
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      // Provide helpful error messages based on input format
      if (address.includes('.base.eth') || address.includes('.eth')) {
        throw new Error(`"${address}" looks like a Base Name. Please select "Base Names" instead of "Wallet".`)
      } else if (address.startsWith('@')) {
        throw new Error(`"${address}" looks like a Farcaster handle. Please select "Farcaster" instead of "Wallet".`)
      } else {
        throw new Error(`Invalid wallet address format. Expected format: 0x followed by 40 hexadecimal characters.`)
      }
    }

    return {
      address: address.toLowerCase(),
      displayName: this.shortenAddress(address),
      source: 'wallet',
      handle: address,
      platform: 'ethereum',
      verified: true,
      lastUpdated: Date.now()
    }
  }

  /**
   * Shorten address for display
   */
  private shortenAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  /**
   * Clear cache for a specific handle/platform
   */
  clearCache(handle: string, platform: ResolutionPlatform): void {
    const cacheKey = `${platform}:${handle.toLowerCase()}`
    this.cache.delete(cacheKey)
  }

  /**
   * Bulk resolve handles by platform
   */
  async resolveHandlesBulk(handles: string[], platform: ResolutionPlatform): Promise<Map<string, AddressResolution>> {
    const results = new Map<string, AddressResolution>()
    
    if (handles.length === 0) return results
    
    // Check cache first
    const uncachedHandles: string[] = []
    handles.forEach(handle => {
      const cacheKey = `${platform}:${handle.toLowerCase()}`
      const cached = this.cache.get(cacheKey)
      if (cached && Date.now() - cached.lastUpdated < 300000) { // 5 minute cache
        results.set(handle, cached)
      } else {
        uncachedHandles.push(handle)
      }
    })
    
    if (uncachedHandles.length === 0) {
      return results
    }
    
    console.log(`🔍 Bulk resolving ${uncachedHandles.length} handles for platform: ${platform}`)
    
    try {
      let bulkResults: Map<string, AddressResolution>
      
      switch (platform) {
        case 'basenames':
          bulkResults = await this.basenamesResolver.resolveBasenamesBulk(uncachedHandles)
          break
        case 'farcaster':
          // TODO: Implement bulk Farcaster resolution
          bulkResults = new Map()
          break
        case 'x':
          // TODO: Implement bulk X resolution
          bulkResults = new Map()
          break
        case 'wallet':
          // For wallet addresses, just validate them
          bulkResults = new Map()
          uncachedHandles.forEach(handle => {
            try {
              const resolution = this.resolveWalletAddress(handle)
              bulkResults.set(handle, resolution)
            } catch (error) {
              console.error(`❌ Invalid wallet address: ${handle}`)
            }
          })
          break
        default:
          throw new Error(`Unsupported platform for bulk resolution: ${platform}`)
      }
      
      // Cache and return results
      bulkResults.forEach((resolution, handle) => {
        const cacheKey = `${platform}:${handle.toLowerCase()}`
        this.cache.set(cacheKey, resolution)
        results.set(handle, resolution)
      })
      
      console.log(`✅ Bulk resolution completed: ${results.size}/${handles.length} successful`)
      return results
      
    } catch (error) {
      console.error('❌ Bulk resolution failed:', error)
      return results
    }
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.cache.clear()
  }
}

// Export singleton instance
export const addressResolutionService = new AddressResolutionService()
