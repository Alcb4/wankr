// Basenames resolution service using Coinbase onchainkit identity
// Basenames are ENS subdomains on Base (replacing the discontinued BNS)

import { getName } from '@coinbase/onchainkit/identity';
import { base } from 'viem/chains';
import { createPublicClient, http } from 'viem';

export interface BasenamesHandleResolution {
  address: string;
  displayName: string;
  handle: string;
  platform: 'basenames';
  verified: boolean;
  lastUpdated: number;
}

export class HandleResolutionBasenames {
  private client = createPublicClient({
    chain: base,
    transport: http(),
    batch: {
      multicall: true,
    },
  })

  /**
   * Resolve Basename for an address (reverse lookup)
   */
  async resolveBasename(address: string): Promise<BasenamesHandleResolution | null> {
    try {
      console.log(`🔍 Resolving Base Name for address: ${address}`)

      // Use OnchainKit to get the Base Name for this address
      const result = await getName({ 
        address: address as `0x${string}`, 
        chain: base 
      })

      if (!result) {
        return null;
      }

      console.log(`✅ Base Name resolved: ${address} → ${result}`)

      return {
        address: address.toLowerCase(),
        displayName: result, // Show the full Base Name
        handle: result,
        platform: 'basenames',
        verified: true, // Base Names are on-chain verified
        lastUpdated: Date.now()
      }

    } catch (error) {
      console.error(`❌ Base Name resolution failed for ${address}:`, error)
      return null;
    }
  }

  /**
   * Bulk resolve Base Names for multiple addresses using multicall
   */
  async resolveBasenamesBulk(addresses: string[]): Promise<Map<string, BasenamesHandleResolution>> {
    const results = new Map<string, BasenamesHandleResolution>()
    
    if (addresses.length === 0) return results
    
    try {
      console.log(`🔍 Bulk resolving Base Names for ${addresses.length} addresses`)
      
      // Use Promise.allSettled to resolve all addresses in parallel
      // This provides natural batching and error isolation
      const resolutionPromises = addresses.map(async (address) => {
        try {
          const result = await getName({ 
            address: address as `0x${string}`, 
            chain: base 
          })
          
          if (result) {
            return {
              address,
              resolution: {
                address: address.toLowerCase(),
                displayName: result,
                handle: result,
                platform: 'basenames' as const,
                verified: true,
                lastUpdated: Date.now()
              }
            }
          }
        } catch (error) {
          console.error(`❌ Failed to resolve Base Name for ${address}:`, error)
        }
        return null
      })
      
      const resolved = await Promise.allSettled(resolutionPromises)
      
      resolved.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          results.set(result.value.address, result.value.resolution)
        }
      })
      
      console.log(`✅ Bulk Base Name resolution completed: ${results.size}/${addresses.length} successful`)
      return results
      
    } catch (error) {
      console.error('❌ Bulk Base Name resolution failed:', error)
      return results
    }
  }
}
