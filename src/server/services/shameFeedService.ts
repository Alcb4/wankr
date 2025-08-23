// src/server/services/shameFeedService.ts

import { ethers } from 'ethers';
import { EventEmitter } from 'events';
import { HandleResolutionService } from './handleResolutionService';

// WANKR Contract Configuration
const WANKR_CONTRACT_ADDRESS = '0xa207c6e67cea08641503947ac05c65748bb9bb07';

// SendShameAndMessage Helper Contract Configuration
const SEND_SHAME_AND_MESSAGE_ADDRESS = '0xD9627180377C5D5EBEEA727959b233cb30aC4002';

// Contract ABI for events we need to monitor
const WANKR_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'function getShameHistory() view returns (tuple(address from, address to, uint256 amount, uint256 timestamp, string reason)[])',
  'function getTopShameSoldiers() view returns (tuple(address soldier, uint256 totalShameDelivered, uint256 lastShameTime, uint256 rank)[])'
];

// Helper Contract ABI for monitoring
const HELPER_CONTRACT_ABI = [
  'event ShameSent(address indexed from, address indexed to, uint256 amount, string message, string topic, uint256 timestamp)'
];

export interface ShameTransaction {
  from: string;
  to: string;
  amount: string;
  timestamp: number;
  reason: string;
  transactionHash?: string;
  blockNumber?: number;
  judgment?: number;
  fromDisplayName?: string;
  toDisplayName?: string;
  fromSource?: 'farcaster' | 'basenames' | 'shortened';
  toSource?: 'farcaster' | 'basenames' | 'shortened';
}

export interface ShameSoldier {
  soldier: string;
  totalShameDelivered: string;
  lastShameTime: number;
  rank: number;
}

export class ShameFeedService extends EventEmitter {
  private provider: ethers.JsonRpcProvider;
  private wankrContract: ethers.Contract;
  private helperContract: ethers.Contract;
  private handleResolver: HandleResolutionService;
  private isMonitoring: boolean = false;
  private lastProcessedBlock: number = 0;
  private shameHistory: ShameTransaction[] = [];
  private topSoldiers: ShameSoldier[] = [];
  private pollingInterval: NodeJS.Timeout | null = null;

  private static instance: ShameFeedService | null = null;
  private lastDataFetch: number = 0;
  private lastForceRefresh: number = 0;
  private cacheTimeout = 35000; // 35 seconds cache (30s backend + 5s buffer)
  private forceRefreshCooldown = 5000; // 5 seconds cooldown between force refreshes

  constructor(rpcUrl: string = 'https://mainnet.base.org', handleResolver?: HandleResolutionService) {
    super();
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wankrContract = new ethers.Contract(WANKR_CONTRACT_ADDRESS, WANKR_ABI, this.provider);
    this.helperContract = new ethers.Contract(SEND_SHAME_AND_MESSAGE_ADDRESS, HELPER_CONTRACT_ABI, this.provider);
    this.handleResolver = handleResolver || new HandleResolutionService();
  }

  static getInstance(): ShameFeedService {
    if (!ShameFeedService.instance) {
      ShameFeedService.instance = new ShameFeedService();
    }
    return ShameFeedService.instance;
  }

  /**
   * Start monitoring the WANKR contract for shame events
   */
  async startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;

    // Get current block number
    const currentBlock = await this.provider.getBlockNumber();
    this.lastProcessedBlock = currentBlock - 1000; // Start from 1000 blocks ago

    // Load initial data
    await this.loadInitialData();

    // Start polling
    this.startPolling();
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    this.isMonitoring = false;
    
    // Clear polling interval
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Load initial shame history and leaderboard
   */
  private async loadInitialData() {
    try {
      // Check if the contract has our custom functions
      const hasCustomFunctions = await this.checkContractCapabilities();
      
      if (hasCustomFunctions) {
        // Load recent shame history
        const history = await this.wankrContract.getShameHistory();
        this.shameHistory = history.map((tx: { from: string; to: string; amount: bigint; timestamp: bigint; reason: string }) => ({
          from: tx.from,
          to: tx.to,
          amount: ethers.formatUnits(tx.amount, 18),
          timestamp: Number(tx.timestamp),
          reason: tx.reason
        })).slice(-50); // Keep last 50 transactions

        // Load top shame soldiers
        const soldiers = await this.wankrContract.getTopShameSoldiers();
        this.topSoldiers = soldiers.map((soldier: { soldier: string; totalShameDelivered: bigint; lastShameTime: bigint; rank: bigint }) => ({
          soldier: soldier.soldier,
          totalShameDelivered: ethers.formatUnits(soldier.totalShameDelivered, 18),
          lastShameTime: Number(soldier.lastShameTime),
          rank: Number(soldier.rank)
        }));
      } else {
        // Fallback: Load recent transfer events
        await this.loadRecentTransfers();
      }

      // Emit initial data
      this.emit('initialData', {
        shameHistory: this.shameHistory,
        topSoldiers: this.topSoldiers
      });

    } catch (error) {
      if (error instanceof Error && error.message.includes('rate limit')) {
        console.log('⏳ Initial data: Rate limited - will retry later');
      } else {
        console.error('❌ Error loading initial data:', error instanceof Error ? error.message : 'Unknown error');
      }
      // Fallback to basic transfer monitoring
      await this.loadRecentTransfers();
    }
  }

  /**
   * Check if the contract has our custom functions
   */
  private async checkContractCapabilities(): Promise<boolean> {
    try {
      // Try to call a custom function to see if it exists
      await this.wankrContract.getShameHistory();
      return true;
    } catch (_error) {
      return false;
    }
  }

  /**
   * Load recent transfer events as fallback
   */
  private async loadRecentTransfers() {
    try {
      console.log('🔍 Loading recent transfers...');
      
      // Get recent transfer events
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = currentBlock - 600; // Look back ~20 minutes (600 blocks) to reduce block counts
      
      console.log('📦 Fetching logs from blocks', { fromBlock, currentBlock });
      
      // Get both WANKR transfers and Net Protocol messages
      const wankrFilter = {
        address: WANKR_CONTRACT_ADDRESS,
        topics: [
          ethers.id('Transfer(address,address,uint256)') // Transfer event signature
        ],
        fromBlock: fromBlock,
        toBlock: currentBlock
      };
      
      const netProtocolFilter = {
        address: '0x00000000b24d62781db359b07880a105cd0b64e6', // Net Protocol contract
        topics: [
          ethers.id('MessageSent(address,string,uint256)') // MessageSent event signature
        ],
        fromBlock: fromBlock,
        toBlock: currentBlock
      };
      
      const [wankrLogs, _netProtocolLogs] = await Promise.all([
        this.provider.getLogs(wankrFilter),
        this.provider.getLogs(netProtocolFilter)
      ]);
      
      console.log('📊 Found logs:', { 
        wankrLogs: wankrLogs.length, 
        netProtocolLogs: _netProtocolLogs.length 
      });
      
      // For now, just use WANKR logs (we'll enhance this later to match messages)
      const logs = wankrLogs;
      

      
      // Filter and limit to last 20 transactions
      console.log('🔍 Processing', logs.length, 'transfer logs...');
      
      const filteredLogs = logs.slice(-20).filter((log: ethers.Log) => {
        const iface = new ethers.Interface([
          'event Transfer(address indexed from, address indexed to, uint256 value)'
        ]);
        const decoded = iface.parseLog(log);
        const amount = parseFloat(ethers.formatUnits(decoded?.args?.[2] || 0, 18));
        const roundedAmount = Math.round(amount);
        
        // Only log transactions that will be included to reduce noise
        if (roundedAmount >= 1 && (roundedAmount <= 10 || roundedAmount === 69)) {
          console.log('💰 Including transaction:', { 
            amount: roundedAmount, 
            hash: log.transactionHash?.slice(0, 10) + '...'
          });
        }
        
        return roundedAmount >= 1 && (roundedAmount <= 10 || roundedAmount === 69); // Show transactions >= 1 AND (≤ 10 WANKR OR exactly 69 WANKR)
      });
      
      console.log('✅ Filtered to', filteredLogs.length, 'shame transactions');

      // Load transactions and match with Net Protocol messages
      this.shameHistory = await Promise.all(filteredLogs.map(async (log: ethers.Log) => {
        const iface = new ethers.Interface([
          'event Transfer(address indexed from, address indexed to, uint256 value)'
        ]);
        const decoded = iface.parseLog(log);
        
        const from = decoded?.args?.[0] || 'Unknown';
        const to = decoded?.args?.[1] || 'Unknown';
        const rawAmount = parseFloat(ethers.formatUnits(decoded?.args?.[2] || 0, 18));
        const roundedAmount = Math.round(rawAmount);
        
        // Try to find matching Net Protocol message
        console.log(`🔍 Looking for Net Protocol message for tx ${log.transactionHash}:`, { from, to, amount: roundedAmount });
        const matchingNetMessage = await this.findMatchingNetMessage(log.transactionHash, from, to, roundedAmount);
        if (matchingNetMessage) {
          console.log(`✅ Found Net Protocol message: ${matchingNetMessage.reason}`);
        } else {
          console.log(`❌ No Net Protocol message found for tx ${log.transactionHash}`);
        }
        
        return {
          from,
          to,
          amount: roundedAmount.toString(), // Use rounded amount for display
          timestamp: log.blockNumber ? Math.floor(Date.now() / 1000) : Math.floor(Date.now() / 1000), // Will be updated with actual block timestamp
          reason: matchingNetMessage?.reason || '',
          transactionHash: log.transactionHash || `blockchain-${from}-${to}-${log.blockNumber}`, // Ensure we always have a hash
          blockNumber: log.blockNumber,
          fromDisplayName: this.shortenAddress(from),
          toDisplayName: this.shortenAddress(to),
          fromSource: 'shortened' as const,
          toSource: 'shortened' as const
        };
      }));

      // Sort by block number (newest first) and update timestamps
      this.shameHistory.sort((a, b) => (b.blockNumber || 0) - (a.blockNumber || 0));
      
      // Update timestamps with actual block timestamps (if available)
      await this.updateTransactionTimestamps();

      // Now resolve handles for the loaded transactions

      for (const transaction of this.shameHistory) {
        // Provide immediate fallbacks
        transaction.fromDisplayName = this.shortenAddress(transaction.from);
        transaction.toDisplayName = this.shortenAddress(transaction.to);
        transaction.fromSource = 'shortened';
        transaction.toSource = 'shortened';
        
        // Resolve handles immediately for better display names
        await this.resolveHandlesInBackground(transaction);
      }


    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('rate limit') || error.message.includes('over rate limit')) {
          console.log('⏳ Rate limited - using cached data');
        } else {
          console.error('❌ Error loading recent transfers:', error.message);
        }
      } else {
        console.error('❌ Unknown error loading recent transfers');
      }
      // Don't clear history on rate limit errors, keep existing data
      if (!(error instanceof Error && error.message.includes('rate limit'))) {
        this.shameHistory = [];
      }
    }
  }

  /**
   * Start polling for new transactions
   */
  private startPolling() {
    // Clear any existing interval
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    // Poll every 30 seconds as per architecture
    this.pollingInterval = setInterval(async () => {
      if (!this.isMonitoring) return;

      try {
        await this.checkForNewTransactions();
      } catch (error) {
        if (error instanceof Error && error.message.includes('rate limit')) {
          console.log('⏳ Polling: Rate limited - skipping this cycle');
        } else {
          console.error('❌ Error in polling:', error instanceof Error ? error.message : 'Unknown error');
        }
      }
    }, 30000); // 30 seconds
  }

  /**
   * Add shame transaction to history
   */
  private async addShameTransaction(shameTx: ShameTransaction) {
    // Only add transactions >= 1 AND (≤ 10 WANKR OR exactly 69 WANKR) (filter out traders and decimal amounts)
    const amount = parseFloat(shameTx.amount);
    const roundedAmount = Math.round(amount);
    if (roundedAmount < 1 || (roundedAmount > 10 && roundedAmount !== 69)) {
      
      return;
    }
    
    // Skip zero-amount transactions (not real shame deliveries)
    if (amount === 0) {
      
      return;
    }

    // Check if we already have this transaction
    const exists = this.shameHistory.find(existing => 
      existing.transactionHash === shameTx.transactionHash
    );

    if (exists) {
      
      return;
    }

    // Resolve wallet addresses to display names (only for new transactions)
    try {
      // Provide immediate fallbacks first
      const enrichedShameTx = {
        ...shameTx,
        fromDisplayName: this.shortenAddress(shameTx.from),
        toDisplayName: this.shortenAddress(shameTx.to),
        fromSource: 'shortened' as const,
        toSource: 'shortened' as const
      };

      // Add to history immediately
      this.shameHistory.unshift(enrichedShameTx);
      if (this.shameHistory.length > 100) {
        this.shameHistory = this.shameHistory.slice(0, 100);
      }

      // Resolve handles immediately for better display names
      await this.resolveHandlesInBackground(enrichedShameTx);

      // Emit the new transaction after handle resolution
      this.emit('newShameTransaction', enrichedShameTx);
    } catch (error) {
      console.error(`❌ Error processing shame transaction: ${shameTx.transactionHash}`, error);
    }
  }

  /**
   * Check for new transactions manually
   */
  private async checkForNewTransactions() {
    try {
      // Check if we have custom functions
      const hasCustomFunctions = await this.checkContractCapabilities();
      
      if (hasCustomFunctions) {
        await this.checkCustomTransactions();
      } else {
        await this.checkTransferTransactions();
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('rate limit')) {
        console.log('⏳ New transactions check: Rate limited');
      } else {
        console.error('❌ Error checking for new transactions:', error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }

  /**
   * Check for new custom shame transactions
   */
  private async checkCustomTransactions() {
    try {
      const history = await this.wankrContract.getShameHistory();
      const newTransactions = history.filter((tx: { timestamp: bigint }) => 
        Number(tx.timestamp) > Math.floor(Date.now() / 1000) - 60 // Last minute
      );

      for (const tx of newTransactions) {
        const shameTx: ShameTransaction = {
          from: tx.from,
          to: tx.to,
          amount: ethers.formatUnits(tx.amount, 18),
          timestamp: Number(tx.timestamp),
          reason: tx.reason
        };

        await this.addShameTransaction(shameTx);
      }
    } catch (error) {
      console.error('Error checking custom transactions:', error);
    }
  }

  /**
   * Check for new transfer transactions
   */
  private async checkTransferTransactions() {
    try {
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = this.lastProcessedBlock + 1;
      
      if (fromBlock > currentBlock) return;

      // Get both WANKR transfers and Net Protocol messages
      const wankrFilter = {
        address: WANKR_CONTRACT_ADDRESS,
        topics: [
          ethers.id('Transfer(address,address,uint256)') // Transfer event signature
        ],
        fromBlock: fromBlock,
        toBlock: currentBlock
      };
      
      const netProtocolFilter = {
        address: '0x00000000b24d62781db359b07880a105cd0b64e6', // Net Protocol contract
        topics: [
          ethers.id('MessageSent(address,string,uint256)') // MessageSent event signature
        ],
        fromBlock: fromBlock,
        toBlock: currentBlock
      };
      
      const [wankrLogs, netProtocolLogs] = await Promise.all([
        this.provider.getLogs(wankrFilter),
        this.provider.getLogs(netProtocolFilter)
      ]);
      
      // For now, just use WANKR logs (we'll enhance this later to match messages)
      const logs = wankrLogs;
      
      for (const log of logs) {
        // Decode the log data
        const iface = new ethers.Interface([
          'event Transfer(address indexed from, address indexed to, uint256 value)'
        ]);
        const decoded = iface.parseLog(log);
        
        const from = decoded?.args?.[0] || 'Unknown';
        const to = decoded?.args?.[1] || 'Unknown';
        const value = decoded?.args?.[2] || 0;
        
        // Skip zero address transfers
        if (from === ethers.ZeroAddress || to === ethers.ZeroAddress) continue;

        // Skip decimal-amount and large transactions (over 10 WANKR, except 69) and decimal amounts
        const amount = parseFloat(ethers.formatUnits(value, 18));
        const roundedAmount = Math.round(amount);
        if (roundedAmount < 1 || (roundedAmount > 10 && roundedAmount !== 69)) {
  
          continue;
        }

        const shameTx: ShameTransaction = {
          from,
          to,
          amount: roundedAmount.toString(), // Use rounded amount for display
          timestamp: Math.floor(Date.now() / 1000),
          reason: '',
          transactionHash: log.transactionHash,
          blockNumber: log.blockNumber
        };

        await this.addShameTransaction(shameTx);
      }
      
      this.lastProcessedBlock = currentBlock;
    } catch (error) {
      if (error instanceof Error && error.message.includes('rate limit')) {
        console.log('⏳ Transfer check: Rate limited - keeping current data');
      } else {
        console.error('❌ Error checking transfer transactions:', error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }

  /**
   * Update leaderboard data
   */
  private async updateLeaderboard() {
    try {
      const soldiers = await this.wankrContract.getTopShameSoldiers();
      this.topSoldiers = soldiers.map((soldier: { soldier: string; totalShameDelivered: bigint; lastShameTime: bigint; rank: bigint }) => ({
        soldier: soldier.soldier,
        totalShameDelivered: ethers.formatUnits(soldier.totalShameDelivered, 18),
        lastShameTime: Number(soldier.lastShameTime),
        rank: Number(soldier.rank)
      }));

      this.emit('leaderboardUpdate', this.topSoldiers);
    } catch (error) {
      console.error('Error updating leaderboard:', error);
    }
  }

  /**
   * Get current shame history
   */
  getShameHistory(): ShameTransaction[] {
    return this.shameHistory;
  }

  /**
   * Refresh shame history with resolved handles
   */
  async refreshShameHistoryWithHandles(): Promise<ShameTransaction[]> {
    try {
      // Get all unique addresses from current transactions
      const addresses = new Set<string>();
      this.shameHistory.forEach(tx => {
        addresses.add(tx.from.toLowerCase());
        addresses.add(tx.to.toLowerCase());
      });

      // Bulk resolve all addresses
      const resolutions = await this.handleResolver.resolveHandlesBulk(Array.from(addresses));

      // Update all transactions with resolved handles
      this.shameHistory.forEach(tx => {
        const fromResolution = resolutions[tx.from.toLowerCase()];
        const toResolution = resolutions[tx.to.toLowerCase()];

        if (fromResolution) {
          tx.fromDisplayName = fromResolution.displayName;
          tx.fromSource = fromResolution.source;
        }

        if (toResolution) {
          tx.toDisplayName = toResolution.displayName;
          tx.toSource = toResolution.source;
        }
      });

      console.log(`✅ Refreshed ${this.shameHistory.length} transactions with handle resolutions`);
      return this.shameHistory;
    } catch (error) {
      console.error('❌ Error refreshing shame history with handles:', error);
      return this.shameHistory;
    }
  }

  /**
   * Get current top soldiers
   */
  getTopSoldiers(): ShameSoldier[] {
    return this.topSoldiers;
  }

  /**
   * Get shame statistics
   */
  getShameStats() {
    const totalShames = this.shameHistory.length;
    const totalAmount = this.shameHistory.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    const uniqueShamers = new Set(this.shameHistory.map(tx => tx.from)).size;
    const uniqueShamed = new Set(this.shameHistory.map(tx => tx.to)).size;

    return {
      totalTransactions: totalShames, // Changed from totalShames to totalTransactions
      totalShameDelivered: Math.floor(totalAmount), // Changed to whole integer
      uniqueShamers,
      uniqueShamed,
      lastUpdate: new Date().toISOString(),
      averageJudgment: this.shameHistory
        .filter(tx => tx.judgment)
        .reduce((sum, tx) => sum + (tx.judgment || 0), 0) / 
        this.shameHistory.filter(tx => tx.judgment).length || 0
    };
  }

  /**
   * Force refresh the shame feed (clear cache and reload)
   */
  async forceRefresh() {
    const now = Date.now();
    
    // Check cooldown to prevent rapid consecutive calls
    if (now - this.lastForceRefresh < this.forceRefreshCooldown) {
      console.log('⏳ Force refresh on cooldown - using cached data');
      return;
    }
    
    console.log('🔄 Force refreshing shame feed...');
    this.lastForceRefresh = now;
    this.lastDataFetch = 0; // Clear cache
    await this.loadRecentTransfers();
  }

  /**
   * Get shame feed data (history + stats) with caching
   */
  async getShameFeed() {
    const now = Date.now();
    
    console.log('🔍 getShameFeed called', {
      lastDataFetch: this.lastDataFetch,
      cacheTimeout: this.cacheTimeout,
      timeSinceLastFetch: now - this.lastDataFetch,
      isMonitoring: this.isMonitoring,
      shameHistoryLength: this.shameHistory.length
    });
    
    // Return cached data if available and not expired (35s cache)
    if (this.lastDataFetch > 0 && (now - this.lastDataFetch) < this.cacheTimeout && this.shameHistory.length > 0) {
      console.log('📋 Returning cached shame feed data (no RPC call)');
      return {
        shameHistory: this.shameHistory,
        stats: this.getShameStats()
      };
    }

    // Start monitoring if not already started
    if (!this.isMonitoring) {
      console.log('🚀 Starting monitoring (30s backend polling)...');
      await this.startMonitoring();
    } else {
      console.log('🔄 Forcing refresh of recent transfers (RPC call)...');
      await this.loadRecentTransfers();
    }

    // Update cache timestamp
    this.lastDataFetch = now;
    
    // Get stats (no external calls needed)
    const stats = this.getShameStats();

    console.log('📊 Returning fresh shame feed data', {
      shameHistoryLength: this.shameHistory.length,
      stats
    });

    return {
      shameHistory: this.shameHistory,
      stats
    };
  }

  /**
   * Update transaction timestamps with actual block timestamps
   */
  private async updateTransactionTimestamps() {
    try {
      // Get unique block numbers
      const blockNumbers = [...new Set(this.shameHistory.map(tx => tx.blockNumber).filter(Boolean))];
      
      if (blockNumbers.length === 0) return;
      
      // Fetch block timestamps in batches
      const blockTimestamps: { [blockNumber: number]: number } = {};
      
      for (const blockNumber of blockNumbers) {
        if (blockNumber === undefined) continue;
        try {
          const block = await this.provider.getBlock(blockNumber);
          if (block) {
            blockTimestamps[blockNumber] = block.timestamp;
          }
        } catch (error) {
          console.log(`⏳ Could not fetch timestamp for block ${blockNumber}, using current time`);
          blockTimestamps[blockNumber] = Math.floor(Date.now() / 1000);
        }
      }
      
      // Update transaction timestamps
      this.shameHistory.forEach(tx => {
        if (tx.blockNumber && blockTimestamps[tx.blockNumber as number]) {
          tx.timestamp = blockTimestamps[tx.blockNumber as number];
        }
      });
      
      console.log(`✅ Updated timestamps for ${this.shameHistory.length} transactions`);
    } catch (_error) {
      console.log('⚠️ Could not update transaction timestamps, using current time');
    }
  }

  /**
   * Find matching Net Protocol message for a WANKR transfer
   */
  private async findMatchingNetMessage(transactionHash: string, from: string, to: string, amount: number): Promise<{ reason: string } | null> {
    try {
      // Create Net Protocol contract instance
      const netContract = new ethers.Contract('0x00000000b24d62781db359b07880a105cd0b64e6', [
        'function getTotalMessagesCount() external view returns (uint256)',
        'function getMessagesInRange(uint256 startIndex, uint256 endIndex) external view returns (tuple(address sender, address app, uint256 timestamp, bytes data, string text, string topic)[])'
      ], this.provider);
      
      // Get the total message count to find the most recent messages
      const totalMessages = await netContract.getTotalMessagesCount();
      console.log(`📊 Total Net Protocol messages: ${totalMessages}`);
      
      // Get the last 20 messages (or fewer if total is less than 20)
      const startIndex = Math.max(0, Number(totalMessages) - 20);
      const endIndex = Number(totalMessages) - 1;
      
      console.log(`🔍 Fetching messages ${startIndex} to ${endIndex} for app ${from}`);
      
      const messages = await netContract.getMessagesInRange(startIndex, endIndex);
      console.log(`📨 Retrieved ${messages.length} messages from range`);
      
      // Look for wankr-shame messages from our app
      for (const message of messages) {
        try {
          const [sender, app, timestamp, data, text, topic] = message;
          
                    // Safely check if topic is a valid string before comparison
          if (typeof topic === 'string' && topic === 'wankr-shame' && app.toLowerCase() === from.toLowerCase()) {
            console.log(`🔍 Found wankr-shame message from ${app}:`, text);
            
            // Check if this message mentions our transaction addresses
            if (text.includes(from.toLowerCase()) && 
                text.includes(to.toLowerCase()) && 
                text.includes(amount.toString())) {
              
              // Also check if the message timestamp is recent (within last 30 minutes)
              const messageTimestamp = Number(timestamp) * 1000; // Convert to milliseconds
              const transactionTime = Date.now();
              const timeDifference = Math.abs(messageTimestamp - transactionTime);
              
              if (timeDifference < 30 * 60 * 1000) { // Within 30 minutes
                
                // Try to extract reason from message data if it's JSON
                try {
                  const dataString = ethers.toUtf8String(data);
                  const parsedData = JSON.parse(dataString);
                  if (parsedData.reason) {
                    console.log(`🔗 Found matching Net Protocol message:`, parsedData.reason);
                    return { reason: parsedData.reason };
                  }
                } catch (_parseError) {
                  // If not JSON, try to extract reason from message text
                  const reasonMatch = text.match(/reason:\s*"([^"]+)"/);
                  if (reasonMatch && reasonMatch[1]) {
                    console.log(`🔗 Found matching Net Protocol message:`, reasonMatch[1]);
                    return { reason: reasonMatch[1] };
                  }
                }
              }
            }
          }
        } catch (messageError) {
          // Skip messages that can't be decoded properly
          console.log(`⚠️ Skipping malformed message in Net Protocol data`);
        }
      }
    } catch (_error) {
      console.log('⚠️ Could not fetch Net Protocol messages:', _error);
    }
    
    return null;
  }

  /**
   * Helper method to shorten addresses
   */
  private shortenAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Background process to resolve handles for transactions
   */
  private async resolveHandlesInBackground(transaction: ShameTransaction) {
    try {
      // Use optimized resolution for shame feed (cache-first, then direct)
      const [fromResolution, toResolution] = await Promise.all([
        this.handleResolver.resolveHandleForShameFeed(transaction.from),
        this.handleResolver.resolveHandleForShameFeed(transaction.to)
      ]);

      // Update the transaction with resolved handles
      transaction.fromDisplayName = fromResolution.displayName;
      transaction.toDisplayName = toResolution.displayName;
      transaction.fromSource = fromResolution.source;
      transaction.toSource = toResolution.source;

      console.log(`✅ Handles resolved for tx ${transaction.transactionHash}:`);
      console.log(`   From: ${transaction.from} → ${fromResolution.displayName} (${fromResolution.source})`);
      console.log(`   To: ${transaction.to} → ${toResolution.displayName} (${toResolution.source})`);

      // Emit an event to update the UI with the resolved handle
      this.emit('handleResolutionUpdate', transaction);
      
      // Also notify the client-side service (optional - don't fail if this doesn't work)
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        await fetch(`${baseUrl}/api/handle-resolution-update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transaction })
        })
      } catch (error) {
        // Silently ignore this error - it's not critical
        console.log('Note: Client notification skipped (this is normal in some environments)')
      }
      
    } catch (_error) {
      console.error(`❌ Background handle resolution failed for: ${transaction.transactionHash}`, _error);
      // Keep the fallback values
      transaction.fromDisplayName = this.shortenAddress(transaction.from);
      transaction.toDisplayName = this.shortenAddress(transaction.to);
      transaction.fromSource = 'shortened';
      transaction.toSource = 'shortened';
      this.emit('handleResolutionUpdate', transaction);
      
      // Also notify the client-side service (optional - don't fail if this doesn't work)
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        await fetch(`${baseUrl}/api/handle-resolution-update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transaction })
        })
      } catch (error) {
        // Silently ignore this error - it's not critical
        console.log('Note: Client notification skipped (this is normal in some environments)')
      }
    }
  }
}
