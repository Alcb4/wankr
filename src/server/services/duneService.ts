import { DuneClient, QueryParameter } from '@duneanalytics/client-sdk';

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
  
  // Query IDs from mrpapawheelie's dashboard (legacy)
  private readonly SHAME_SOLDIERS_QUERY_ID = 5604868; // People sending WANKR (all time)
  private readonly SHAME_RECEIVED_QUERY_ID = 5604950; // People receiving WANKR (all time)
  
  // New time-based query IDs
  private readonly DAILY_WANKR_RECEIVED_QUERY_ID = 5677564; // Daily shame received
  private readonly WEEKLY_WANKR_RECEIVED_QUERY_ID = 5677640; // Weekly shame received
  private readonly DAILY_WANKR_SENT_QUERY_ID = 5681443; // Daily shame soldiers
  private readonly WEEKLY_WANKR_SENT_QUERY_ID = 5681472; // Weekly shame soldiers
  
  // User-specific query IDs
  private readonly USER_TRANSACTIONS_QUERY_ID = 5684382; // User's transactions with direction
  private readonly USER_STATS_QUERY_ID = 5682001; // User's aggregated stats

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
   * Get daily shame received data (Daily Dumpster Fire)
   */
  async getDailyShameReceivedRaw(): Promise<DuneRawEntry[]> {
    try {
      console.log('🔥 Fetching daily dumpster fire from Dune...');
      
      const result = await this.duneClient.getLatestResult({
        queryId: this.DAILY_WANKR_RECEIVED_QUERY_ID
      });

      if (!result.result || !result.result.rows) {
        console.log('❌ No daily shame received data from Dune API');
        return [];
      }

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

      console.log(`🔥 Built ${entries.length} daily dumpster fire entries`);
      return entries;

    } catch (error) {
      console.error('Error fetching daily shame received from Dune:', error);
      return [];
    }
  }

  /**
   * Get weekly shame received data
   */
  async getWeeklyShameReceivedRaw(): Promise<DuneRawEntry[]> {
    try {
      console.log('📅 Fetching weekly shame received from Dune...');
      
      const result = await this.duneClient.getLatestResult({
        queryId: this.WEEKLY_WANKR_RECEIVED_QUERY_ID
      });

      if (!result.result || !result.result.rows) {
        console.log('❌ No weekly shame received data from Dune API');
        return [];
      }

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

      console.log(`📅 Built ${entries.length} weekly shame received entries`);
      return entries;

    } catch (error) {
      console.error('Error fetching weekly shame received from Dune:', error);
      return [];
    }
  }

  /**
   * Get daily shame soldiers data
   */
  async getDailyShameSoldiersRaw(): Promise<DuneRawEntry[]> {
    try {
      console.log('⚔️ Fetching daily shame soldiers from Dune...');
      
      const result = await this.duneClient.getLatestResult({
        queryId: this.DAILY_WANKR_SENT_QUERY_ID
      });

      if (!result.result || !result.result.rows) {
        console.log('❌ No daily shame soldiers data from Dune API');
        return [];
      }

      const entries: DuneRawEntry[] = [];
      for (let i = 0; i < result.result.rows.length; i++) {
        const row = result.result.rows[i] as { sender?: string; times_sent?: string; total_wankr_sent?: string };
        const address = (row.sender as string)?.toLowerCase();
        if (!address) continue;

        entries.push({
          rank: i + 1,
          address,
          transactionCount: parseInt(row.times_sent as string) || 0,
          totalWankr: parseFloat((row.total_wankr_sent as string) || '0').toFixed(0)
        });
      }

      console.log(`⚔️ Built ${entries.length} daily shame soldiers entries`);
      return entries;

    } catch (error) {
      console.error('Error fetching daily shame soldiers from Dune:', error);
      return [];
    }
  }

  /**
   * Get weekly shame soldiers data
   */
  async getWeeklyShameSoldiersRaw(): Promise<DuneRawEntry[]> {
    try {
      console.log('⚔️ Fetching weekly shame soldiers from Dune...');
      
      const result = await this.duneClient.getLatestResult({
        queryId: this.WEEKLY_WANKR_SENT_QUERY_ID
      });

      if (!result.result || !result.result.rows) {
        console.log('❌ No weekly shame soldiers data from Dune API');
        return [];
      }

      const entries: DuneRawEntry[] = [];
      for (let i = 0; i < result.result.rows.length; i++) {
        const row = result.result.rows[i] as { sender?: string; times_sent?: string; total_wankr_sent?: string };
        const address = (row.sender as string)?.toLowerCase();
        if (!address) continue;

        entries.push({
          rank: i + 1,
          address,
          transactionCount: parseInt(row.times_sent as string) || 0,
          totalWankr: parseFloat((row.total_wankr_sent as string) || '0').toFixed(0)
        });
      }

      console.log(`⚔️ Built ${entries.length} weekly shame soldiers entries`);
      return entries;

    } catch (error) {
      console.error('Error fetching weekly shame soldiers from Dune:', error);
      return [];
    }
  }

  /**
   * Get time-based leaderboards
   */
  async getTimeBasedLeaderboards(period: 'day' | 'week'): Promise<DuneRawData> {
    try {
      let received: DuneRawEntry[], sent: DuneRawEntry[];
      
      if (period === 'day') {
        [received, sent] = await Promise.all([
          this.getDailyShameReceivedRaw(),
          this.getDailyShameSoldiersRaw()
        ]);
      } else {
        [received, sent] = await Promise.all([
          this.getWeeklyShameReceivedRaw(),
          this.getWeeklyShameSoldiersRaw()
        ]);
      }

      return { received, sent };
    } catch (error) {
      console.error(`Error getting ${period} leaderboards:`, error);
      return { received: [], sent: [] };
    }
  }

  /**
   * Get both raw leaderboards with caching (legacy - all time)
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

  /**
   * Get user's transaction history with direction information
   * This uses the improved single query with direction column
   */
  async getUserTransactions(userAddress: string): Promise<{ from?: string; to?: string; wankr_amount?: number; evt_block_time?: string; evt_tx_hash?: string; direction?: string }[]> {
    try {
      console.log(`🔍 Fetching transactions for user: ${userAddress.slice(0, 6)}...`);
      
      // Use parameterized query with user address
      const result = await this.duneClient.runQuery({
        queryId: this.USER_TRANSACTIONS_QUERY_ID,
        query_parameters: [
          QueryParameter.text("user_address", userAddress)
        ]
      });

      if (!result.result || !result.result.rows) {
        console.log('❌ No user transaction data from Dune API');
        return [];
      }

      console.log(`📊 Found ${result.result.rows.length} transactions for user ${userAddress.slice(0, 6)}...`);
      return result.result.rows;
    } catch (error) {
      console.error('Error fetching user transactions from Dune:', error);
      return [];
    }
  }

  /**
   * Get user's received transactions for shame score calculation
   * Filters the main query results to only received transactions
   */
  async getUserReceivedTransactions(userAddress: string): Promise<{ from?: string; to?: string; wankr_amount?: number; evt_block_time?: string; evt_tx_hash?: string }[]> {
    try {
      const allTransactions = await this.getUserTransactions(userAddress);
      return allTransactions.filter(tx => tx.direction === 'Received');
    } catch (error) {
      console.error('Error filtering received transactions:', error);
      return [];
    }
  }

  /**
   * Get user's sent transactions for activity tracking
   * Filters the main query results to only sent transactions
   */
  async getUserSentTransactions(userAddress: string): Promise<{ from?: string; to?: string; wankr_amount?: number; evt_block_time?: string; evt_tx_hash?: string }[]> {
    try {
      const allTransactions = await this.getUserTransactions(userAddress);
      return allTransactions.filter(tx => tx.direction === 'Sent');
    } catch (error) {
      console.error('Error filtering sent transactions:', error);
      return [];
    }
  }

  /**
   * Get user's aggregated stats (for performance)
   * This provides pre-calculated stats to avoid client-side processing
   */
  async getUserStats(userAddress: string): Promise<Record<string, unknown> | null> {
    try {
      console.log(`🔍 Fetching stats for user: ${userAddress.slice(0, 6)}...`);
      
      // Use parameterized query with user address
      const result = await this.duneClient.runQuery({
        queryId: this.USER_STATS_QUERY_ID,
        query_parameters: [
          QueryParameter.text("user_address", userAddress)
        ]
      });

      if (!result.result || !result.result.rows || result.result.rows.length === 0) {
        console.log('❌ No user stats data from Dune API');
        return null;
      }

      return result.result.rows[0];
    } catch (error) {
      console.error('Error fetching user stats from Dune:', error);
      return null;
    }
  }
}
