import { getAddress } from '@coinbase/onchainkit/identity'
import { base } from 'viem/chains'
import type { AddressResolution } from './addressResolutionService'

export interface BaseNamesResolution {
  address: string
  displayName: string
  handle: string
  platform: 'basenames'
  verified: boolean
  lastUpdated: number
}

export class AddressResolutionBaseNames {
  /**
   * Resolve Base Name to address
   */
  async resolveBasename(handle: string): Promise<AddressResolution> {
    try {
      // Clean the handle (remove @ if present)
      const cleanHandle = handle.replace(/^@/, '')
      
      // Ensure it has .base.eth suffix
      const basename = cleanHandle.endsWith('.base.eth') 
        ? cleanHandle 
        : `${cleanHandle}.base.eth`

      console.log(`🔍 Resolving Base Name: ${basename}`)

      // Use OnchainKit to resolve the Base Name
      const result = await getAddress({ 
        name: basename, 
        chain: base 
      })

      if (!result) {
        throw new Error(`Base Name not found: ${basename}`)
      }

      console.log(`✅ Base Name resolved: ${basename} → ${result}`)

      return {
        address: result.toLowerCase(),
        displayName: cleanHandle, // Show the clean handle without .base.eth
        source: 'basenames',
        handle: basename,
        platform: 'basenames',
        verified: true, // Base Names are on-chain verified
        lastUpdated: Date.now()
      }

    } catch (error) {
      console.error(`❌ Base Name resolution failed for ${handle}:`, error)
      
      if (error instanceof Error && error.message.includes('not found')) {
        throw new Error(`Base Name not found: ${handle}`)
      }
      
      throw new Error(`Failed to resolve Base Name: ${handle}`)
    }
  }

  /**
   * Validate if a handle looks like a Base Name
   */
  isValidBaseName(handle: string): boolean {
    const cleanHandle = handle.replace(/^@/, '')
    return cleanHandle.includes('.base.eth') || 
           (cleanHandle.length > 0 && cleanHandle.length <= 63) // ENS name length limit
  }
}
