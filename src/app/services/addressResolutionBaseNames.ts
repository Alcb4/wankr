import { getAddress } from '@coinbase/onchainkit/identity'
import { base } from 'viem/chains'
import { createPublicClient, http } from 'viem'
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
  private client = createPublicClient({
    chain: base,
    transport: http(),
    batch: {
      multicall: true,
    },
  })

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
                        source: 'basenames' as const,
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
   * Bulk resolve multiple Base Names using multicall
   */
  async resolveBasenamesBulk(handles: string[]): Promise<Map<string, AddressResolution>> {
    const results = new Map<string, AddressResolution>()
    
    if (handles.length === 0) return results
    
    try {
      console.log(`🔍 Bulk resolving ${handles.length} Base Names`)
      
      // Prepare handles for resolution
      const basenames = handles.map(handle => {
        const cleanHandle = handle.replace(/^@/, '')
        return cleanHandle.endsWith('.base.eth') 
          ? cleanHandle 
          : `${cleanHandle}.base.eth`
      })
      
      // Use multicall to batch the resolution requests
      // Note: We'll need to implement this with the actual Base Name resolver contract
      // For now, we'll use parallel resolution with OnchainKit
      const resolutionPromises = basenames.map(async (basename, index) => {
        try {
          const result = await getAddress({ 
            name: basename, 
            chain: base 
          })
          
          if (result) {
            const cleanHandle = handles[index].replace(/^@/, '')
            return {
              handle: handles[index],
              resolution: {
                address: result.toLowerCase(),
                displayName: cleanHandle,
                                 source: 'basenames' as const,
                handle: basename,
                platform: 'basenames',
                verified: true,
                lastUpdated: Date.now()
              }
            }
          }
        } catch (error) {
          console.error(`❌ Failed to resolve ${basename}:`, error)
        }
        return null
      })
      
      const resolved = await Promise.allSettled(resolutionPromises)
      
      resolved.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          results.set(result.value.handle, result.value.resolution)
        }
      })
      
      console.log(`✅ Bulk resolution completed: ${results.size}/${handles.length} successful`)
      return results
      
    } catch (error) {
      console.error('❌ Bulk Base Name resolution failed:', error)
      return results
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
