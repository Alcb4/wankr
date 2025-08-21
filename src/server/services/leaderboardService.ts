import { DuneService, DuneRawEntry } from './duneService';
import { HandleResolutionService, HandleResolution } from './handleResolutionService';

export interface LeaderboardEntry {
  rank: number;
  address: string;
  displayName: string;
  transactionCount: number;
  totalWankr: string;
  period: 'all' | 'week' | 'day';
  source: HandleResolution['source']; // Use the source type from HandleResolution
}

export interface LeaderboardData {
  received: LeaderboardEntry[];
  sent: LeaderboardEntry[];
}

export class LeaderboardService {
  private duneService: DuneService;
  private handleResolver: HandleResolutionService;
  
  constructor(handleResolver?: HandleResolutionService) {
    this.duneService = new DuneService();
    this.handleResolver = handleResolver || new HandleResolutionService();
  }

  /**
   * Get shame received leaderboard
   */
  async getShameReceivedLeaderboard(_period: 'all' | 'week' | 'day' = 'all'): Promise<LeaderboardEntry[]> {
    const data = await this.getLeaderboards(_period);
    return data.received;
  }

  /**
   * Get shame soldiers leaderboard (senders)
   */
  async getShameSoldiersLeaderboard(_period: 'all' | 'week' | 'day' = 'all'): Promise<LeaderboardEntry[]> {
    const data = await this.getLeaderboards(_period);
    return data.sent;
  }

  /**
   * Get both leaderboards at once
   */
  async getLeaderboards(_period: 'all' | 'week' | 'day' = 'all'): Promise<LeaderboardData> {
    try {
      console.log('🏆 Starting leaderboard generation...');
      
      // Get raw data from Dune (no handle resolution)
      const rawData = await this.duneService.getRawLeaderboards();
      console.log(`📊 Got raw data: ${rawData.received.length} received, ${rawData.sent.length} sent`);
      
      // Extract all unique addresses
      const allAddresses = new Set<string>();
      rawData.received.forEach(entry => allAddresses.add(entry.address));
      rawData.sent.forEach(entry => allAddresses.add(entry.address));
      
      console.log(`📋 Resolving ${allAddresses.size} unique addresses...`);
      
      // Bulk resolve all addresses at once
      const resolutions = await this.handleResolver.resolveHandlesBulk(Array.from(allAddresses));
      console.log(`✅ Resolved ${Object.keys(resolutions).length} addresses`);
      
      // Convert raw entries to leaderboard entries with resolved names
      const received = rawData.received.map(entry => this.rawToLeaderboardEntry(entry, resolutions, 'all'));
      const sent = rawData.sent.map(entry => this.rawToLeaderboardEntry(entry, resolutions, 'all'));
      
      console.log(`🏆 Generated leaderboards: ${received.length} received, ${sent.length} sent`);
      
      return { received, sent };
    } catch (error) {
      console.error('Error getting leaderboards:', error);
      return { received: [], sent: [] };
    }
  }
  
  /**
   * Convert raw Dune entry to leaderboard entry with handle resolution
   */
  private rawToLeaderboardEntry(
    raw: DuneRawEntry, 
    resolutions: { [address: string]: HandleResolution },
    period: 'all' | 'week' | 'day'
  ): LeaderboardEntry {
    const resolution = resolutions[raw.address];
    
    return {
      rank: raw.rank,
      address: raw.address,
      displayName: resolution?.displayName || `${raw.address.slice(0, 6)}...${raw.address.slice(-4)}`,
      transactionCount: raw.transactionCount,
      totalWankr: raw.totalWankr,
      period,
      source: resolution?.source || 'shortened'
    };
  }
}
