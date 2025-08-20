import type { AddressResolution } from './addressResolutionService'

export class AddressResolutionFarcaster {
  /**
   * Resolve Farcaster handle to address
   * TODO: Implement with Neynar API
   */
  async resolveFarcasterHandle(handle: string): Promise<AddressResolution> {
    // TODO: Implement Farcaster handle resolution
    // This will use the Neynar API to resolve Farcaster handles to addresses
    
    throw new Error('Farcaster handle resolution not yet implemented')
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
