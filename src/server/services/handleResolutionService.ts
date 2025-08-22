import { CheckRegisterService } from './checkRegister';
import { RegisterService, RegisterEntry } from './register';
import { HandleResolutionFID } from './handleResolutionFID';
import { HandleResolutionBasenames } from './handleResolutionBasenames';

export interface HandleResolution {
  address: string;
  displayName: string;
  source: 'farcaster' | 'basenames' | 'shortened';
  handle?: string;
  platform?: string;
  verified?: boolean;
  avatar?: string;
  lastUpdated: number;
  refreshDue?: number;
  priority?: number; // Lower number = higher priority
}

export class HandleResolutionService {
  private cache: Map<string, HandleResolution> = new Map();
  private checkRegisterService: CheckRegisterService;
  private registerService: RegisterService;
  private fidResolver: HandleResolutionFID;
  private basenamesResolver: HandleResolutionBasenames;
  
  // Rate limiting
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
  private readonly MAX_REQUESTS_PER_WINDOW = 100; // Max requests per minute
  
  // Error tracking
  private errorCounts: Map<string, { count: number; lastError: number }> = new Map();
  private readonly MAX_ERRORS_BEFORE_BACKOFF = 5;
  private readonly ERROR_BACKOFF_TIME = 5 * 60 * 1000; // 5 minutes
  
  // Priority order for handle sources (lower number = higher priority)
  private readonly PRIORITY_ORDER = {
    'basenames': 1,    // Highest priority (on-chain, verified)
    'farcaster': 2,    // Medium priority (social, verified)
    'shortened': 3     // Lowest priority (fallback)
  };

  constructor(checkRegisterService?: CheckRegisterService, registerService?: RegisterService) {
    this.registerService = registerService || new RegisterService();
    this.checkRegisterService = checkRegisterService || new CheckRegisterService(this.registerService);
    this.fidResolver = new HandleResolutionFID(this.checkRegisterService);
    this.basenamesResolver = new HandleResolutionBasenames();
    
    // Listen to FID resolution events
    this.fidResolver.on('resolution', (resolution: HandleResolution) => {
      this.updateCacheAndRegisterIfBetter(resolution.address, resolution);
    });
  }

  private registerEntryToHandleResolution(entry: RegisterEntry): HandleResolution {
    return {
      address: entry.address,
      displayName: entry.displayName,
      source: entry.source as 'farcaster' | 'basenames' | 'shortened',
      handle: entry.handle,
      platform: entry.platform,
      verified: entry.verified,
      avatar: entry.avatar,
      lastUpdated: entry.lastUpdated,
      refreshDue: entry.refreshDue,
      priority: this.PRIORITY_ORDER[entry.source as keyof typeof this.PRIORITY_ORDER] || 3
    };
  }

  async resolveHandle(address: string): Promise<HandleResolution> {
    const normalizedAddress = address.toLowerCase();
    
    const cached = this.cache.get(normalizedAddress);
    if (cached) {
      return cached;
    }

    const registerEntry = this.checkRegisterService.checkRegister(normalizedAddress);
    if (registerEntry) {
      const resolution = this.registerEntryToHandleResolution(registerEntry);
      this.cache.set(normalizedAddress, resolution);
      return resolution;
    }

    // Provide immediate fallback first
    const fallbackResolution: HandleResolution = {
      address: normalizedAddress,
      displayName: this.shortenAddress(normalizedAddress),
      source: 'shortened',
      lastUpdated: Date.now(),
      priority: this.PRIORITY_ORDER.shortened
    };
    
    // Cache the fallback immediately
    this.cache.set(normalizedAddress, fallbackResolution);

    // Add fallback to register for future use
    this.registerService.addToRegister({
      address: normalizedAddress,
      displayName: fallbackResolution.displayName,
      source: fallbackResolution.source,
      handle: normalizedAddress,
      platform: 'ethereum',
      verified: false,
      lastUpdated: fallbackResolution.lastUpdated,
      refreshDue: Date.now() + this.generateRandomTTL()
    });

    // Queue for background processing (non-blocking)
    this.queueForBackgroundProcessing(normalizedAddress);

    return fallbackResolution;
  }

  async resolveHandlesBulk(addresses: string[]): Promise<{ [address: string]: HandleResolution }> {
    const results: { [address: string]: HandleResolution } = {};

    // First pass: Check cache and register (fast, non-blocking)
    for (const address of addresses) {
      const normalizedAddress = address.toLowerCase();
      
      const cached = this.cache.get(normalizedAddress);
      if (cached) {
        results[normalizedAddress] = cached;
        continue;
      }

      const registerEntry = this.checkRegisterService.checkRegister(normalizedAddress);
      if (registerEntry) {
        const resolution = this.registerEntryToHandleResolution(registerEntry);
        results[normalizedAddress] = resolution;
        this.cache.set(normalizedAddress, resolution);
        continue;
      }

      // Provide immediate fallback
      const fallbackResolution: HandleResolution = {
        address: normalizedAddress,
        displayName: this.shortenAddress(normalizedAddress),
        source: 'shortened',
        lastUpdated: Date.now(),
        priority: this.PRIORITY_ORDER.shortened
      };
      results[normalizedAddress] = fallbackResolution;
      this.cache.set(normalizedAddress, fallbackResolution);
      
      // Add fallback to register for future use
      this.registerService.addToRegister({
        address: normalizedAddress,
        displayName: fallbackResolution.displayName,
        source: fallbackResolution.source,
        handle: normalizedAddress,
        platform: 'ethereum',
        verified: false,
        lastUpdated: fallbackResolution.lastUpdated,
        refreshDue: Date.now() + this.generateRandomTTL()
      });
      
      // Queue for background processing
      this.queueForBackgroundProcessing(normalizedAddress);
    }

    return results;
  }

  /**
   * Check rate limiting for an address
   */
  private checkRateLimit(address: string): boolean {
    const normalizedAddress = address.toLowerCase();
    const now = Date.now();
    const requestData = this.requestCounts.get(normalizedAddress);
    
    if (!requestData || now > requestData.resetTime) {
      // Reset or initialize rate limit
      this.requestCounts.set(normalizedAddress, {
        count: 1,
        resetTime: now + this.RATE_LIMIT_WINDOW
      });
      return true;
    }
    
    if (requestData.count >= this.MAX_REQUESTS_PER_WINDOW) {
      console.log(`🚫 Rate limit exceeded for ${address}: ${requestData.count} requests in window`);
      return false;
    }
    
    requestData.count++;
    return true;
  }

  /**
   * Check if address is in error backoff
   */
  private isInErrorBackoff(address: string): boolean {
    const normalizedAddress = address.toLowerCase();
    const errorData = this.errorCounts.get(normalizedAddress);
    
    if (!errorData) return false;
    
    const now = Date.now();
    if (errorData.count >= this.MAX_ERRORS_BEFORE_BACKOFF && 
        now - errorData.lastError < this.ERROR_BACKOFF_TIME) {
      console.log(`⏸️  Address ${address} in error backoff (${errorData.count} errors)`);
      return true;
    }
    
    return false;
  }

  /**
   * Record an error for an address
   */
  private recordError(address: string): void {
    const normalizedAddress = address.toLowerCase();
    const now = Date.now();
    const errorData = this.errorCounts.get(normalizedAddress);
    
    if (errorData) {
      errorData.count++;
      errorData.lastError = now;
    } else {
      this.errorCounts.set(normalizedAddress, {
        count: 1,
        lastError: now
      });
    }
    
    // Record error in register
    this.registerService.recordError(normalizedAddress);
  }

  /**
   * Clear error count for an address (on successful resolution)
   */
  private clearErrorCount(address: string): void {
    const normalizedAddress = address.toLowerCase();
    this.errorCounts.delete(normalizedAddress);
  }

  /**
   * Queue address for background processing (non-blocking)
   */
  private queueForBackgroundProcessing(address: string): void {
    const normalizedAddress = address.toLowerCase();
    
    // Check rate limiting
    if (!this.checkRateLimit(address)) {
      console.log(`🚫 Rate limited: skipping background processing for ${address}`);
      return;
    }
    
    // Check error backoff
    if (this.isInErrorBackoff(address)) {
      console.log(`⏸️  Error backoff: skipping background processing for ${address}`);
      return;
    }
    
    // Check if we already have a good resolution in cache
    const cached = this.cache.get(normalizedAddress);
    if (cached && cached.source !== 'shortened') {
      // We already have a good resolution, don't queue for processing
      console.log(`⏭️  Skipping background processing for ${address}: already in cache (${cached.source})`);
      return;
    }
    
    // Check register to avoid unnecessary background processing
    const registerEntry = this.checkRegisterService.checkRegister(normalizedAddress);
    if (registerEntry && registerEntry.source !== 'shortened') {
      // We have a good resolution in register, don't queue for processing
      console.log(`⏭️  Skipping background processing for ${address}: found in register (${registerEntry.source})`);
      return;
    }
    
    console.log(`🔄 Queuing ${address} for background processing (not in cache or register)`);
    
    // Queue for Basenames processing (non-blocking)
    this.queueBasenamesProcessing(address);
    
    // Queue for Farcaster processing (non-blocking)
    this.fidResolver.queueForProcessing(address);
  }

  /**
   * Queue for Basenames processing
   */
  private async queueBasenamesProcessing(address: string): Promise<void> {
    // Process in background without blocking
    setImmediate(async () => {
      try {
        const normalizedAddress = address.toLowerCase();
        
        // Check register first to avoid unnecessary API calls
        const registerEntry = this.checkRegisterService.checkRegister(normalizedAddress);
        if (registerEntry && registerEntry.source === 'basenames') {
          const resolution = this.registerEntryToHandleResolution(registerEntry);
          this.updateCacheAndRegisterIfBetter(address, resolution);
          console.log(`🎯 Using registered Base Name for ${address}: ${resolution.displayName}`);
          return;
        }
        
        console.log(`🔍 Calling Base Names API for ${address} (not in register)`);
        
        // Only call the API if not found in register
        const basenamesResult = await this.basenamesResolver.resolveBasename(address);
        if (basenamesResult) {
          const resolution: HandleResolution = {
            address: address,
            displayName: basenamesResult.displayName,
            source: 'basenames',
            handle: basenamesResult.handle,
            platform: 'basenames',
            verified: basenamesResult.verified,
            lastUpdated: Date.now(),
            priority: this.PRIORITY_ORDER.basenames
          };
          
          this.updateCacheAndRegisterIfBetter(address, resolution);
        }
      } catch (error) {
        console.error('Basenames processing error:', error);
        this.recordError(address);
      }
    });
  }

  /**
   * Public method to resolve Base Names directly (for immediate resolution)
   */
  async resolveBasenameDirectly(address: string): Promise<HandleResolution | null> {
    try {
      const basenamesResult = await this.basenamesResolver.resolveBasename(address);
      if (basenamesResult) {
        return {
          address: address,
          displayName: basenamesResult.displayName,
          source: 'basenames',
          handle: basenamesResult.handle,
          platform: 'basenames',
          verified: basenamesResult.verified,
          lastUpdated: Date.now(),
          priority: this.PRIORITY_ORDER.basenames
        };
      }
    } catch (error) {
      console.error('Direct Base Names resolution error:', error);
    }
    return null;
  }

  /**
   * Optimized method for shame feed that checks cache first, then resolves directly
   */
  async resolveHandleForShameFeed(address: string): Promise<HandleResolution> {
    const normalizedAddress = address.toLowerCase();
    
    // Check cache first
    const cached = this.cache.get(normalizedAddress);
    if (cached && cached.source === 'basenames') {
      console.log(`🎯 Using cached Base Name for ${address}: ${cached.displayName}`);
      return cached;
    }
    
    // Check register
    const registerEntry = this.checkRegisterService.checkRegister(normalizedAddress);
    if (registerEntry && registerEntry.source === 'basenames') {
      const resolution = this.registerEntryToHandleResolution(registerEntry);
      this.cache.set(normalizedAddress, resolution);
      console.log(`🎯 Using registered Base Name for ${address}: ${resolution.displayName}`);
      return resolution;
    }
    
    // Try direct Base Names resolution
    const directResult = await this.resolveBasenameDirectly(address);
    if (directResult) {
      // Cache the result
      this.cache.set(normalizedAddress, directResult);
      console.log(`🎯 Found Base Name for ${address}: ${directResult.displayName}`);
      return directResult;
    }
    
    // Fall back to general resolution (which will use cache/register/shortened)
    return this.resolveHandle(address);
  }

  /**
   * Update cache and register only if the new resolution has higher priority
   */
  private updateCacheAndRegisterIfBetter(address: string, newResolution: HandleResolution): void {
    const normalizedAddress = address.toLowerCase();
    const currentResolution = this.cache.get(normalizedAddress);
    
    // Check if new resolution has higher priority (lower number)
    const shouldUpdate = !currentResolution || 
      (newResolution.priority || 3) < (currentResolution.priority || 3);
    
    if (shouldUpdate) {
      // Update cache
      this.cache.set(normalizedAddress, newResolution);
      
      // Add to register for future use
      this.registerService.addToRegister({
        address: address,
        displayName: newResolution.displayName,
        source: newResolution.source,
        handle: newResolution.handle,
        platform: newResolution.platform,
        verified: newResolution.verified,
        avatar: newResolution.avatar,
        lastUpdated: newResolution.lastUpdated,
        refreshDue: Date.now() + this.generateRandomTTL()
      });
      
      // Clear error count on successful resolution
      this.clearErrorCount(address);
      console.log(`✅ Updated handle for ${address}: ${newResolution.source} - ${newResolution.displayName}`);
    } else {
      console.log(`⏭️  Skipped lower priority handle for ${address}: ${newResolution.source} vs ${currentResolution?.source}`);
    }
  }

  async resolveMultipleHandles(addresses: string[]): Promise<HandleResolution[]> {
    const results = await Promise.allSettled(
      addresses.map(addr => this.resolveHandle(addr))
    );

    return results.map(result => 
      result.status === 'fulfilled' ? result.value : {
        address: 'unknown',
        displayName: 'Unknown',
        source: 'shortened',
        lastUpdated: Date.now(),
        priority: this.PRIORITY_ORDER.shortened
      }
    );
  }

  private shortenAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  private generateRandomTTL(): number {
    // Random TTL between 3-6 days (in milliseconds)
    const minDays = 3;
    const maxDays = 6;
    const days = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
    return days * 24 * 60 * 60 * 1000;
  }

  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }

  /**
   * Get comprehensive service statistics
   */
  getServiceStats(): {
    cacheSize: number;
    registerStats: unknown;
    rateLimitStats: { totalAddresses: number; rateLimitedAddresses: number };
    errorStats: { totalAddresses: number; errorProneAddresses: number };
    resolutionStats: { totalResolutions: number; successRate: number };
  } {
    const registerStats = this.registerService.getRegisterStats();
    
    // Calculate rate limit stats
    const now = Date.now();
    let rateLimitedCount = 0;
    for (const [_, data] of this.requestCounts.entries()) {
      if (data.count >= this.MAX_REQUESTS_PER_WINDOW && now <= data.resetTime) {
        rateLimitedCount++;
      }
    }
    
    // Calculate error stats
    let errorProneCount = 0;
    for (const [_, data] of this.errorCounts.entries()) {
      if (data.count >= this.MAX_ERRORS_BEFORE_BACKOFF) {
        errorProneCount++;
      }
    }
    
    return {
      cacheSize: this.cache.size,
      registerStats,
      rateLimitStats: {
        totalAddresses: this.requestCounts.size,
        rateLimitedAddresses: rateLimitedCount
      },
      errorStats: {
        totalAddresses: this.errorCounts.size,
        errorProneAddresses: errorProneCount
      },
      resolutionStats: {
        totalResolutions: this.cache.size + registerStats.totalEntries,
        successRate: registerStats.validEntries / (registerStats.totalEntries || 1) * 100
      }
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  removeFromCache(addresses: string[]): void {
    addresses.forEach(address => {
      const normalizedAddress = address.toLowerCase();
      this.cache.delete(normalizedAddress);
    });
  }

  /**
   * Get batch processing stats
   */
  getBatchStats(): { queueSize: number; isProcessing: boolean } {
    return this.fidResolver.getBatchStats();
  }

  /**
   * Force process the current batch (for testing)
   */
  async forceProcessBatch(): Promise<void> {
    await this.fidResolver.forceProcessBatch();
  }
}
