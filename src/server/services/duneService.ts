import { DuneClient } from '@duneanalytics/client-sdk';

// Raw data from Dune (no handle resolution)
export interface DuneRawEntry {
  rank: number;
  address: string;
  transactionCount: number;
  totalWankr: string;
}

export interface DuneRawData {
  received: DuneRawEntry[];
  sent: DuneRawEntry[];
}

interface CachedDuneData {
  data: DuneRawData;
  lastUpdated: number;
}

export class DuneService {
  private duneClient: DuneClient;
  private cache: CachedDuneData | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  // Query IDs from mrpapawheelie's dashboard
  private readonly SHAME_SOLDIERS_QUERY_ID = 5604868; // People sending WANKR
  private readonly SHAME_RECEIVED_QUERY_ID = 5604950; // People receiving WANKR

  constructor() {
    const apiKey = process.env.DUNE_API_KEY;
    if (!apiKey) {
      throw new Error('DUNE_API_KEY environment variable is required');
    }
    
    this.duneClient = new DuneClient(apiKey);
  }

  /**
   * Get raw shame soldiers data from Dune (people sending WANKR)
   */
  async getShameSoldiersRaw(): Promise<DuneRawEntry[]> {
    try {
      console.log('🔍 Fetching shame soldiers from Dune...');
      
      const result = await this.duneClient.getLatestResult({
        queryId: this.SHAME_SOLDIERS_QUERY_ID
      });

      console.log('📊 Dune soldiers result:', {
        hasResult: !!result.result,
        hasRows: !!result.result?.rows,
        rowCount: result.result?.rows?.length || 0
      });

      if (!result.result || !result.result.rows) {
        console.log('❌ No soldiers data from Dune API');
        return [];
      }

      // Build raw entries (no handle resolution)
      const entries: DuneRawEntry[] = [];
      for (let i = 0; i < result.result.rows.length; i++) {
        const row = result.result.rows[i] as { sender?: string; times_received?: string; total_wankr_received?: string };
        const address = (row.sender as string)?.toLowerCase();
        if (!address) continue;

        entries.push({
          rank: i + 1,
          address,
          transactionCount: parseInt(row.times_received as string) || 0,
          totalWankr: parseFloat((row.total_wankr_received as string) || '0').toFixed(0)
        });
      }

      console.log(`📊 Built ${entries.length} raw soldiers entries`);
      return entries;

    } catch (error) {
      console.error('Error fetching shame soldiers from Dune:', error);
      return [];
    }
  }

  /**
   * Get raw shame received data from Dune (people receiving WANKR)
   */
  async getShameReceivedRaw(): Promise<DuneRawEntry[]> {
    try {
      console.log('🔍 Fetching shame received from Dune...');
      
      const result = await this.duneClient.getLatestResult({
        queryId: this.SHAME_RECEIVED_QUERY_ID
      });

      console.log('📊 Dune received result:', {
        hasResult: !!result.result,
        hasRows: !!result.result?.rows,
        rowCount: result.result?.rows?.length || 0
      });

      if (!result.result || !result.result.rows) {
        console.log('❌ No received data from Dune API');
        return [];
      }

      // Build raw entries (no handle resolution)
      const entries: DuneRawEntry[] = [];
      for (let i = 0; i < result.result.rows.length; i++) {
        const row = result.result.rows[i] as { recipient?: string; times_received?: string; total_wankr_received?: string };
        const address = (row.recipient as string)?.toLowerCase();
        if (!address) continue;

        entries.push({
          rank: i + 1,
          address,
          transactionCount: parseInt(row.times_received as string) || 0,
          totalWankr: parseFloat((row.total_wankr_received as string) || '0').toFixed(0)
        });
      }

      console.log(`📊 Built ${entries.length} raw received entries`);
      return entries;

    } catch (error) {
      console.error('Error fetching shame received from Dune:', error);
      return [];
    }
  }

  /**
   * Get both raw leaderboards with caching
   */
  async getRawLeaderboards(): Promise<DuneRawData> {
    // Check cache first
    if (this.cache && Date.now() - this.cache.lastUpdated < this.CACHE_DURATION) {
      return this.cache.data;
    }
    
    const [received, sent] = await Promise.all([
      this.getShameReceivedRaw(),
      this.getShameSoldiersRaw()
    ]);

    const data: DuneRawData = { received, sent };
    
    // Cache the result
    this.cache = {
      data,
      lastUpdated: Date.now()
    };

    return data;
  }

  /**
   * Test Dune API connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.duneClient.getLatestResult({
        queryId: this.SHAME_SOLDIERS_QUERY_ID
      });
      
      return true;
    } catch (error) {
      console.error('Dune API connection failed:', error);
      return false;
    }
  }
}
