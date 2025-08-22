import type { AddressResolution } from './addressResolutionService'
import { handleError } from '../utils/errorHandler'

export class AddressResolutionFarcaster {
  constructor() {
    // API calls will be made through our own API route
  }

  /**
   * Resolve Farcaster handle to address using our API route
   */
  async resolveFarcasterHandle(handle: string): Promise<AddressResolution> {
    const cleanHandle = handle.replace(/^@/, '')
    
    if (!this.isValidFarcasterHandle(cleanHandle)) {
      throw new Error(`Invalid Farcaster handle format: ${handle}`)
    }

    try {
      const response = await fetch(`/api/resolve-farcaster-handle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ handle: cleanHandle })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `API error: ${response.status}`)
      }

      const data = await response.json()
      
      return {
        address: data.address.toLowerCase() as `0x${string}`,
        displayName: `@${data.username}`,
        source: 'farcaster',
        verified: true,
        lastUpdated: Date.now()
      }

    } catch (error) {
      const errorResponse = handleError(error, {
        component: 'AddressResolutionFarcaster',
        action: 'resolveFarcasterHandle',
        userId: handle
      })
      throw new Error(errorResponse.userMessage)
    }
  }

  /**
   * Resolve multiple Farcaster handles in parallel
   */
  async resolveFarcasterHandlesBulk(handles: string[]): Promise<AddressResolution[]> {
    const cleanHandles = handles.map(h => h.replace(/^@/, ''))
    const validHandles = cleanHandles.filter(h => this.isValidFarcasterHandle(h))
    
    if (validHandles.length === 0) {
      return []
    }

    try {
      const response = await fetch(`/api/resolve-farcaster-handle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ handles: validHandles })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      
      return (data.results || []).map((result: { address?: string; username?: string }) => ({
        address: result.address?.toLowerCase() as `0x${string}`,
        displayName: `@${result.username}`,
        source: 'farcaster',
        verified: true,
        lastUpdated: Date.now()
      })).filter((result: AddressResolution) => result.address)

    } catch (error) {
      const errorResponse = handleError(error, {
        component: 'AddressResolutionFarcaster',
        action: 'resolveFarcasterHandlesBulk',
        userId: `${validHandles.length} handles`
      })
      console.error('Bulk Farcaster resolution failed:', errorResponse.technicalMessage)
      return []
    }
  }

  /**
   * Validate if a handle looks like a Farcaster handle
   */
  isValidFarcasterHandle(handle: string): boolean {
    const cleanHandle = handle.replace(/^@/, '')
    // Farcaster handles are typically 3-16 characters, alphanumeric + underscores
    return /^[a-zA-Z0-9_]{3,16}$/.test(cleanHandle)
  }
}
