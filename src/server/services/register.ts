import { HandleResolution } from './handleResolutionService';

export interface RegisterEntry {
  address: string;
  displayName: string;
  source: HandleResolution['source']; // Use the source type from HandleResolution
  handle?: string;
  platform?: string;
  verified?: boolean;
  avatar?: string;
  lastUpdated: number;
  refreshDue: number;
  accessCount?: number; // Track how often this entry is accessed
  lastAccessed?: number; // Track last access time
  errorCount?: number; // Track resolution errors
  lastError?: number; // Track last error time
}

export class RegisterService {
  private register: Map<string, RegisterEntry> = new Map();
  private readonly CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.initializeDefaultRegister();
    this.startCleanupTimer();
  }

  /**
   * Initialize the register with known addresses
   */
  private initializeDefaultRegister() {
    const defaultEntries: RegisterEntry[] = [
      // Top 10 leaderboard addresses for testing
      {
        address: '0x45932054e758a51a421646f07428841a19a45d40',
        displayName: '0x4593...5d40',
        source: 'shortened',
        lastUpdated: Date.now(),
        refreshDue: Date.now() + this.generateRandomTTL()
      },
      {
        address: '0xfbd29b4390348711a3dbed30742a4de57bf4a867',
        displayName: '0xfbd2...a867',
        source: 'shortened',
        lastUpdated: Date.now(),
        refreshDue: Date.now() + this.generateRandomTTL(),
        accessCount: 0,
        lastAccessed: Date.now(),
        errorCount: 0
      },
      {
        address: '0x5e2e23cf4d3be0e6e8770c55e462eebf047ec09e',
        displayName: '0x5e2e...c09e',
        source: 'shortened',
        lastUpdated: Date.now(),
        refreshDue: Date.now() + this.generateRandomTTL()
      },
      {
        address: '0xb0139f585dc774f8431e1700469d9cce434cd022',
        displayName: '0xb013...d022',
        source: 'shortened',
        lastUpdated: Date.now(),
        refreshDue: Date.now() + this.generateRandomTTL()
      },
      {
        address: '0x0d1bc63bf10011469338f642bb7fb2a938166b82',
        displayName: '0x0d1b...6b82',
        source: 'shortened',
        lastUpdated: Date.now(),
        refreshDue: Date.now() + this.generateRandomTTL()
      },
      {
        address: '0x824bcedc77a27c3d8d45573ff14a10bd4b215403',
        displayName: '0x824b...5403',
        source: 'shortened',
        lastUpdated: Date.now(),
        refreshDue: Date.now() + this.generateRandomTTL()
      },
      {
        address: '0xcedba3bbb88142f6f9a63264fda43869b9419b72',
        displayName: '0xcedb...9b72',
        source: 'shortened',
        lastUpdated: Date.now(),
        refreshDue: Date.now() + this.generateRandomTTL()
      },
      {
        address: '0x3040d38934f0d80f5e7d21111a87685e54084ca6',
        displayName: '0x3040...4ca6',
        source: 'shortened',
        lastUpdated: Date.now(),
        refreshDue: Date.now() + this.generateRandomTTL()
      },
      {
        address: '0xc35b187491ed0bf37913c87ef5b4b084a9580f54',
        displayName: '0xc35b...0f54',
        source: 'shortened',
        lastUpdated: Date.now(),
        refreshDue: Date.now() + this.generateRandomTTL()
      },
      {
        address: '0x8fae18fb043572e324c8ad70b60e17e197bda915',
        displayName: '0x8fae...da915',
        source: 'shortened',
        lastUpdated: Date.now(),
        refreshDue: Date.now() + this.generateRandomTTL()
      },
      {
        address: '0x3dbd22d4c974cc718be1aa8a7e5bd2f944698ea6',
        displayName: '0x3dbd...8ea6',
        source: 'shortened',
        lastUpdated: Date.now(),
        refreshDue: Date.now() + this.generateRandomTTL()
      },
      {
        address: '0x1234567890123456789012345678901234567890',
        displayName: '0x1234...7890',
        source: 'shortened',
        lastUpdated: Date.now(),
        refreshDue: Date.now() + this.generateRandomTTL()
      },
      // Add addresses that were hitting rate limits
      {
        address: '0x62e671157dd455e13d10dcbc6cd0a8db458abd6a',
        displayName: '0x62e6...bd6a',
        source: 'shortened',
        lastUpdated: Date.now(),
        refreshDue: Date.now() + this.generateRandomTTL()
      },
      {
        address: '0xffa5e6813918094d1c4d5b719fa7edd3be2b64dd',
        displayName: '0xffa5...64dd',
        source: 'shortened',
        lastUpdated: Date.now(),
        refreshDue: Date.now() + this.generateRandomTTL()
      }
    ];

    for (const entry of defaultEntries) {
      // Ensure all entries have tracking fields
      const completeEntry = {
        ...entry,
        accessCount: 0,
        lastAccessed: Date.now(),
        errorCount: 0
      };
      this.register.set(entry.address.toLowerCase(), completeEntry);
    }


  }

  /**
   * Check if an address exists in the register and is not expired
   */
  checkRegister(address: string): RegisterEntry | null {
    const normalizedAddress = address.toLowerCase();
    const entry = this.register.get(normalizedAddress);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() >= entry.refreshDue) {
      console.log(`⏰ Entry expired for ${normalizedAddress}: ${entry.source} - ${entry.displayName}`);
      this.register.delete(normalizedAddress);
      return null;
    }

    // Update access tracking
    entry.accessCount = (entry.accessCount || 0) + 1;
    entry.lastAccessed = Date.now();

    return entry;
  }

  /**
   * Check multiple addresses in the register
   */
  checkRegisterBulk(addresses: string[]): { [address: string]: RegisterEntry | null } {
    const results: { [address: string]: RegisterEntry | null } = {};
    
    for (const address of addresses) {
      results[address.toLowerCase()] = this.checkRegister(address);
    }

    return results;
  }

  /**
   * Add or update an entry in the register
   */
  addToRegister(entry: RegisterEntry): void {
    const normalizedAddress = entry.address.toLowerCase();
    
    // Initialize tracking fields if not present
    const existingEntry = this.register.get(normalizedAddress);
    if (existingEntry) {
      // Preserve access tracking from existing entry
      entry.accessCount = existingEntry.accessCount || 0;
      entry.lastAccessed = existingEntry.lastAccessed || Date.now();
      entry.errorCount = existingEntry.errorCount || 0;
      entry.lastError = existingEntry.lastError;
    } else {
      // Initialize new entry tracking
      entry.accessCount = 0;
      entry.lastAccessed = Date.now();
      entry.errorCount = 0;
    }
    
    this.register.set(normalizedAddress, entry);
    console.log(`📝 Added/Updated register entry: ${normalizedAddress} (${entry.source})`);
  }

  /**
   * Remove an entry from the register
   */
  removeFromRegister(address: string): boolean {
    const normalizedAddress = address.toLowerCase();
    const removed = this.register.delete(normalizedAddress);
    if (removed) {
  
    }
    return removed;
  }

  /**
   * Remove multiple addresses from the register
   */
  removeFromRegisterBulk(addresses: string[]): number {
    let removedCount = 0;
    addresses.forEach(address => {
      if (this.removeFromRegister(address)) {
        removedCount++;
      }
    });
    return removedCount;
  }

  /**
   * Clear all entries from the register
   */
  clearRegister(): void {
    const clearedCount = this.register.size;
    this.register.clear();
    console.log(`🧹 Cleared ${clearedCount} entries from register`);
  }

  /**
   * Get register statistics
   */
  getRegisterStats(): { 
    totalEntries: number; 
    expiredEntries: number; 
    validEntries: number;
    highAccessEntries: number;
    errorProneEntries: number;
    averageAccessCount: number;
  } {
    let expiredCount = 0;
    let validCount = 0;
    let highAccessCount = 0;
    let errorProneCount = 0;
    let totalAccessCount = 0;
    const now = Date.now();

    for (const entry of this.register.values()) {
      if (now >= entry.refreshDue) {
        expiredCount++;
      } else {
        validCount++;
        totalAccessCount += entry.accessCount || 0;
        
        // Track high-access entries (accessed more than 10 times)
        if ((entry.accessCount || 0) > 10) {
          highAccessCount++;
        }
        
        // Track error-prone entries (more than 3 errors)
        if ((entry.errorCount || 0) > 3) {
          errorProneCount++;
        }
      }
    }

    return {
      totalEntries: this.register.size,
      expiredEntries: expiredCount,
      validEntries: validCount,
      highAccessEntries: highAccessCount,
      errorProneEntries: errorProneCount,
      averageAccessCount: validCount > 0 ? Math.round(totalAccessCount / validCount) : 0
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [address, entry] of this.register.entries()) {
      if (now >= entry.refreshDue) {
        this.register.delete(address);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired entries from register`);
    }
  }

  /**
   * Record an error for an entry
   */
  recordError(address: string): void {
    const normalizedAddress = address.toLowerCase();
    const entry = this.register.get(normalizedAddress);
    
    if (entry) {
      entry.errorCount = (entry.errorCount || 0) + 1;
      entry.lastError = Date.now();
      console.log(`❌ Recorded error for ${normalizedAddress} (${entry.errorCount} total errors)`);
    }
  }

  /**
   * Get entries that need refresh (high access or error-prone)
   */
  getEntriesNeedingRefresh(): string[] {
    const now = Date.now();
    const addresses: string[] = [];
    
    for (const [address, entry] of this.register.entries()) {
      if (now >= entry.refreshDue) continue; // Skip expired entries
      
      // Refresh if high access (more than 20 times) or error-prone (more than 5 errors)
      if ((entry.accessCount || 0) > 20 || (entry.errorCount || 0) > 5) {
        addresses.push(address);
      }
    }
    
    return addresses;
  }

  /**
   * Smart cache invalidation based on usage patterns
   */
  smartCacheInvalidation(): number {
    const addressesToRefresh = this.getEntriesNeedingRefresh();
    let invalidatedCount = 0;
    
    for (const address of addressesToRefresh) {
      const entry = this.register.get(address);
      if (entry) {
        // Reduce TTL for high-access entries to refresh them more frequently
        const newTTL = (entry.accessCount || 0) > 20 ? 
          Math.min(entry.refreshDue - Date.now(), 24 * 60 * 60 * 1000) : // 1 day max
          entry.refreshDue - Date.now();
        
        entry.refreshDue = Date.now() + newTTL;
        invalidatedCount++;
        console.log(`🔄 Smart refresh for ${address}: ${entry.source} (${entry.accessCount || 0} accesses, ${entry.errorCount || 0} errors)`);
      }
    }
    
    return invalidatedCount;
  }

  /**
   * Start the cleanup timer
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupExpiredEntries();
      this.smartCacheInvalidation();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Generate random TTL between 3-6 days
   */
  private generateRandomTTL(): number {
    const minDays = 3;
    const maxDays = 6;
    const randomDays = minDays + Math.random() * (maxDays - minDays);
    return randomDays * 24 * 60 * 60 * 1000; // Convert to milliseconds
  }
}
