import type { AddressResolution } from './addressResolutionService'
import { resolveXHandleWithBankrBot } from './addressResolutionBankr'

export class AddressResolutionX {
  /**
   * Resolve X (Twitter) handle to address using Bankr Bot API
   */
  async resolveXHandle(handle: string): Promise<AddressResolution> {
    const cleanHandle = handle.replace(/^@/, '')
    
    if (!this.isValidXHandle(cleanHandle)) {
      throw new Error(`Invalid X handle format: ${handle}`)
    }

    try {
      const address = await resolveXHandleWithBankrBot(cleanHandle)
      
      if (!address) {
        throw new Error(`Could not resolve X handle: @${cleanHandle}`)
      }

      return {
        address: address.toLowerCase(),
        displayName: `@${cleanHandle}`,
        source: 'x',
        handle: cleanHandle,
        platform: 'twitter',
        verified: true,
        lastUpdated: Date.now()
      }
    } catch (error) {
      throw new Error(`Failed to resolve X handle @${cleanHandle}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Validate if a handle looks like an X handle
   */
  isValidXHandle(handle: string): boolean {
    const cleanHandle = handle.replace(/^@/, '')
    // X handles are typically 1-15 characters, alphanumeric + underscores
    return /^[a-zA-Z0-9_]{1,15}$/.test(cleanHandle)
  }
}
