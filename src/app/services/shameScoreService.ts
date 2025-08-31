// src/app/services/shameScoreService.ts

interface ShameTransaction {
  from: string
  to: string
  amount: string
  timestamp: number
  transactionHash: string
}

interface UserStats {
  shameScore: number
  shameFreeStreak: number
  totalShamesSent: number
  totalShamesReceived: number
  totalWankrSent: string
  totalWankrReceived: string
  accountAgeDays: number
  isVerified: boolean
  lastActivity: number
  uniqueShamers: number
  averageShamerReputation: number
  recentShameActivity: number
}

interface ShameScoreConfig {
  // Enhanced shame score weights
  baseShameWeight: number           // Weight for raw WANKR received
  uniqueShamersExponent: number     // Exponential weight for unique shamers
  shamerReputationWeight: number    // Weight for shamer's reputation
  timeDecayFactor: number          // Daily decay rate (0.999 = 0.1% decay per day)
  maxTransactionCap: number        // Max WANKR per transaction that counts
  shameTransactionThreshold: number // Max WANKR to be considered "shame" (not trading)
  
  // Legacy weights (for compatibility)
  shameFreeStreakWeight: number
  shameRatioWeight: number
  accountAgeWeight: number
  verificationBonus: number
  maxScore: number
}

/**
 * Service for calculating shame scores and user statistics
 */
export class ShameScoreService {
  private config: ShameScoreConfig = {
    // Enhanced shame score algorithm (your suggestions!)
    baseShameWeight: 1.0,        // Base weight for WANKR received
    uniqueShamersExponent: 1.5,  // Exponential weight for unique shamers (consensus factor)
    shamerReputationWeight: 0.3, // Weight for average shamer reputation
    timeDecayFactor: 0.998,      // 0.2% decay per day (shame fades over time)
    maxTransactionCap: 10,       // Max 10 WANKR per transaction counts
    shameTransactionThreshold: 10, // Max WANKR to be considered "shame" (same as transaction cap)
    
    // Legacy weights (for compatibility)
    shameFreeStreakWeight: 2,    // Points per day of shame-free streak
    shameRatioWeight: 0.5,       // Points per net shame (sent - received)
    accountAgeWeight: 0.1,       // Points per day of account age
    verificationBonus: 10,       // Bonus points for verified users
    maxScore: 100                // Maximum possible score
  }

  /**
   * Calculate user statistics from transaction history using enhanced algorithm
   */
  calculateUserStats(
    userAddress: string,
    transactions: ShameTransaction[],
    accountCreatedAt: number,
    isVerified: boolean = false
  ): UserStats {
    const now = Date.now()
    const accountAgeDays = Math.floor((now - accountCreatedAt) / (1000 * 60 * 60 * 24))
    
    // Filter transactions for this user
    const sentTransactions = transactions.filter(tx => tx.from.toLowerCase() === userAddress.toLowerCase())
    const receivedTransactions = transactions.filter(tx => tx.to.toLowerCase() === userAddress.toLowerCase())
    
    // Calculate basic totals
    const totalShamesSent = sentTransactions.length
    const totalShamesReceived = receivedTransactions.length
    const totalWankrSent = sentTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0).toFixed(2)
    const totalWankrReceived = receivedTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0).toFixed(2)
    
    // Filter out large transactions (likely trading, not shame)
    const shameTransactions = receivedTransactions.filter(tx => 
      parseFloat(tx.amount) <= this.config.shameTransactionThreshold
    )
    
    // Enhanced calculations for new algorithm (using filtered transactions)
    const uniqueShamers = this.calculateUniqueShamers(shameTransactions)
    const averageShamerReputation = this.calculateAverageShamerReputation(shameTransactions, transactions)
    const recentShameActivity = this.calculateRecentActivity(shameTransactions, now)
    
    // Calculate shame-free streak
    const shameFreeStreak = this.calculateShameFreeStreak(userAddress, transactions, now)
    
    // Calculate enhanced shame score
    const shameScore = this.calculateEnhancedShameScore({
      receivedTransactions: shameTransactions, // Use filtered transactions
      uniqueShamers,
      averageShamerReputation,
      shameFreeStreak,
      accountAgeDays,
      isVerified,
      allTransactions: transactions,
      now
    })
    
    // Get last activity
    const allUserTransactions = [...sentTransactions, ...receivedTransactions]
    const lastActivity = allUserTransactions.length > 0 
      ? Math.max(...allUserTransactions.map(tx => tx.timestamp))
      : accountCreatedAt
    
    return {
      shameScore,
      shameFreeStreak,
      totalShamesSent,
      totalShamesReceived: shameTransactions.length, // Count only shame transactions
      totalWankrSent,
      totalWankrReceived,
      accountAgeDays,
      isVerified,
      lastActivity,
      uniqueShamers,
      averageShamerReputation,
      recentShameActivity
    }
  }

  /**
   * Calculate shame-free streak in days
   */
  private calculateShameFreeStreak(userAddress: string, transactions: ShameTransaction[], now: number): number {
    // Get only RECEIVED transactions (shame received)
    const receivedTransactions = transactions.filter(tx => 
      tx.to.toLowerCase() === userAddress.toLowerCase()
    )
    
    if (receivedTransactions.length === 0) {
      // No shame received = infinite shame-free streak
      return 999
    }
    
    // Sort by timestamp (newest first)
    const sortedTransactions = receivedTransactions.sort((a, b) => b.timestamp - a.timestamp)
    const lastShameReceived = sortedTransactions[0]
    
    // Calculate days since last shame received
    const daysSinceLastShame = Math.floor((now - lastShameReceived.timestamp) / (1000 * 60 * 60 * 24))
    
    return Math.max(0, daysSinceLastShame)
  }

  /**
   * Calculate unique shamers (consensus factor)
   */
  private calculateUniqueShamers(receivedTransactions: ShameTransaction[]): number {
    const uniqueAddresses = new Set(receivedTransactions.map(tx => tx.from.toLowerCase()))
    return uniqueAddresses.size
  }

  /**
   * Calculate average shamer reputation (shame authority multiplier)
   */
  private calculateAverageShamerReputation(
    receivedTransactions: ShameTransaction[], 
    allTransactions: ShameTransaction[]
  ): number {
    if (receivedTransactions.length === 0) return 100 // No shamers = perfect reputation

    const shamerReputations = receivedTransactions.map(tx => {
      // Calculate shamer's own shame score (simplified)
      const shamerReceived = allTransactions.filter(t => t.to.toLowerCase() === tx.from.toLowerCase())
      const shamerShameAmount = shamerReceived.reduce((sum, t) => sum + Math.min(parseFloat(t.amount), this.config.maxTransactionCap), 0)
      
      // Higher shame received = lower reputation (inverted)
      // Scale: 0 shame = 100 reputation, 100+ shame = 0 reputation
      return Math.max(0, 100 - shamerShameAmount)
    })

    return shamerReputations.reduce((sum, rep) => sum + rep, 0) / shamerReputations.length
  }

  /**
   * Calculate recent shame activity (for time decay)
   */
  private calculateRecentActivity(receivedTransactions: ShameTransaction[], now: number): number {
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000)
    const recentTransactions = receivedTransactions.filter(tx => tx.timestamp > thirtyDaysAgo)
    return recentTransactions.length
  }

  /**
   * Apply time decay factor to shame amount
   */
  private applyTimeDecay(amount: number, timestamp: number, now: number): number {
    const daysSince = Math.floor((now - timestamp) / (1000 * 60 * 60 * 24))
    const decayFactor = Math.pow(this.config.timeDecayFactor, daysSince)
    return amount * decayFactor
  }

  /**
   * Enhanced shame score algorithm (implementing your suggestions!)
   * Formula: (Base WANKR * Time Decay) * (Unique Shamers^1.5) * (Avg Shamer Reputation/100)
   */
  private calculateEnhancedShameScore(params: {
    receivedTransactions: ShameTransaction[]
    uniqueShamers: number
    averageShamerReputation: number
    shameFreeStreak: number
    accountAgeDays: number
    isVerified: boolean
    allTransactions: ShameTransaction[]
    now: number
  }): number {
    const { receivedTransactions, uniqueShamers, averageShamerReputation, now } = params

    if (receivedTransactions.length === 0) return 0

    // 1. Calculate base shame with time decay and transaction cap
    const baseShame = receivedTransactions.reduce((sum, tx) => {
      const cappedAmount = Math.min(parseFloat(tx.amount), this.config.maxTransactionCap)
      const decayedAmount = this.applyTimeDecay(cappedAmount, tx.timestamp, now)
      return sum + decayedAmount
    }, 0)

    // 2. Apply consensus factor (unique shamers exponential)
    const consensusFactor = Math.pow(uniqueShamers, this.config.uniqueShamersExponent)

    // 3. Apply shamer reputation (normalized to 0-1)
    const reputationFactor = (averageShamerReputation / 100) * this.config.shamerReputationWeight + (1 - this.config.shamerReputationWeight)

    // 4. Calculate final enhanced score
    const enhancedScore = baseShame * this.config.baseShameWeight * consensusFactor * reputationFactor

    // 5. Apply scaling to keep scores reasonable (0-100 range)
    const scaledScore = Math.min(100, enhancedScore / 10) // Divide by 10 to scale down

    return Math.round(scaledScore)
  }

  /**
   * Legacy shame score calculation (for compatibility)
   */
  private calculateShameScore(params: {
    shameFreeStreak: number
    totalShamesSent: number
    totalShamesReceived: number
    accountAgeDays: number
    isVerified: boolean
  }): number {
    const { shameFreeStreak, totalShamesSent, totalShamesReceived, accountAgeDays, isVerified } = params
    
    // Calculate components
    const shameFreeStreakPoints = Math.min(60, shameFreeStreak * this.config.shameFreeStreakWeight)
    const shameRatioPoints = Math.max(0, (totalShamesSent - totalShamesReceived) * this.config.shameRatioWeight)
    const accountAgePoints = Math.min(10, accountAgeDays * this.config.accountAgeWeight)
    const verificationPoints = isVerified ? this.config.verificationBonus : 0
    
    // Calculate total score
    const totalScore = shameFreeStreakPoints + shameRatioPoints + accountAgePoints + verificationPoints
    
    return Math.min(this.config.maxScore, Math.max(0, Math.round(totalScore)))
  }

  /**
   * Get verification level based on shame score
   * NOTE: Lower shame score = better verification level
   */
  getVerificationLevel(shameScore: number): 'unverified' | 'verified' | 'trusted' {
    if (shameScore <= 20) return 'trusted'
    if (shameScore <= 50) return 'verified'
    return 'unverified'
  }

  /**
   * Get verification badge eligibility
   * NOTE: Lower shame score = better chance for badge
   */
  getVerificationBadge(shameScore: number, accountAgeDays: number): boolean {
    return shameScore <= 30 && accountAgeDays >= 30
  }

  /**
   * Format last activity time
   */
  formatLastActivity(lastActivity: number): string {
    const now = Date.now()
    const diffMs = now - lastActivity
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
    } else {
      return 'Just now'
    }
  }

  /**
   * Get current configuration for debugging
   */
  getConfig(): ShameScoreConfig {
    return { ...this.config }
  }

  /**
   * Calculate shame score from pre-calculated Dune stats
   * NOTE: This returns a SHAME score (lower is better) - not a trust score
   */
  calculateShameScoreFromStats(stats: Record<string, unknown>): number {
    const shamesReceived = parseInt(stats.shames_received as string) || 0
    const totalWankrReceived = parseFloat(stats.total_wankr_received as string) || 0
    const uniqueShamers = parseInt(stats.unique_shamers as string) || 0
    const recentShamesReceived = parseInt(stats.recent_shames_received as string) || 0
    
    // If no shame received, perfect score (0 shame)
    if (shamesReceived === 0) return 0
    
    // Calculate shame penalty (more shame = higher shame score)
    const baseShamePenalty = Math.min(totalWankrReceived, shamesReceived * 10)
    
    // Penalty for multiple unique shamers (consensus factor)
    const consensusPenalty = Math.pow(uniqueShamers, 1.2)
    
    // Recent activity penalty
    const recentPenalty = recentShamesReceived * 2
    
    // Calculate shame score (higher = more shameful)
    const shameScore = Math.min(100, Math.round((baseShamePenalty * consensusPenalty + recentPenalty) / 10))
    
    return shameScore
  }

  /**
   * Get verification level based on shame score
   * NOTE: This is now based on SHAME score (lower is better)
   */
  getVerificationLevelFromStats(stats: Record<string, unknown>): string {
    const shameScore = this.calculateShameScoreFromStats(stats)
    return this.getVerificationLevel(shameScore)
  }

  /**
   * Get verification badge from pre-calculated stats
   * NOTE: This is now based on SHAME score (lower is better)
   */
  getVerificationBadgeFromStats(stats: Record<string, unknown>): boolean {
    const shameScore = this.calculateShameScoreFromStats(stats)
    const firstActivity = stats.first_activity ? new Date(stats.first_activity as string).getTime() : Date.now()
    const accountAgeDays = Math.floor((Date.now() - firstActivity) / (1000 * 60 * 60 * 24))
    
    return this.getVerificationBadge(shameScore, accountAgeDays)
  }

  /**
   * Get detailed score breakdown for transparency
   */
  getScoreBreakdown(
    userAddress: string,
    transactions: ShameTransaction[],
    accountCreatedAt: number,
    isVerified: boolean = false
  ): {
    finalScore: number
    components: {
      baseShame: number
      uniqueShamers: number
      averageShamerReputation: number
      consensusFactor: number
      reputationFactor: number
      timeDecayEffect: number
      filteredTransactions: number
      totalTransactions: number
    }
    explanation: string[]
  } {
    const now = Date.now()
    const receivedTransactions = transactions.filter(tx => tx.to.toLowerCase() === userAddress.toLowerCase())
    
    // Filter out large transactions (likely trading, not shame)
    const shameTransactions = receivedTransactions.filter(tx => 
      parseFloat(tx.amount) <= this.config.shameTransactionThreshold
    )
    
    if (shameTransactions.length === 0) {
      const filteredCount = receivedTransactions.length - shameTransactions.length
      const explanation = receivedTransactions.length === 0 
        ? ['No shame received - pristine reputation! ✨']
        : [`${receivedTransactions.length} transactions received, but ${filteredCount} were filtered out as large transactions (over ${this.config.shameTransactionThreshold} WANKR)`]
      
      return {
        finalScore: 0,
        components: {
          baseShame: 0,
          uniqueShamers: 0,
          averageShamerReputation: 100,
          consensusFactor: 0,
          reputationFactor: 1,
          timeDecayEffect: 0,
          filteredTransactions: filteredCount,
          totalTransactions: receivedTransactions.length
        },
        explanation
      }
    }

    const uniqueShamers = this.calculateUniqueShamers(shameTransactions)
    const averageShamerReputation = this.calculateAverageShamerReputation(shameTransactions, transactions)
    
    // Calculate components (using filtered transactions)
    const baseShame = shameTransactions.reduce((sum, tx) => {
      const cappedAmount = Math.min(parseFloat(tx.amount), this.config.maxTransactionCap)
      return sum + cappedAmount
    }, 0)

    const baseShameWithDecay = shameTransactions.reduce((sum, tx) => {
      const cappedAmount = Math.min(parseFloat(tx.amount), this.config.maxTransactionCap)
      const decayedAmount = this.applyTimeDecay(cappedAmount, tx.timestamp, now)
      return sum + decayedAmount
    }, 0)

    const consensusFactor = Math.pow(uniqueShamers, this.config.uniqueShamersExponent)
    const reputationFactor = (averageShamerReputation / 100) * this.config.shamerReputationWeight + (1 - this.config.shamerReputationWeight)
    const enhancedScore = baseShameWithDecay * consensusFactor * reputationFactor
    const finalScore = Math.min(100, Math.round(enhancedScore / 10))

    const filteredCount = receivedTransactions.length - shameTransactions.length
    const explanation = [
      `Total transactions: ${receivedTransactions.length}`,
      `Shame transactions: ${shameTransactions.length} (filtered out ${filteredCount} large transactions over ${this.config.shameTransactionThreshold} WANKR)`,
      `Base shame: ${baseShame.toFixed(1)} WANKR (capped at ${this.config.maxTransactionCap} per transaction)`,
      `After time decay: ${baseShameWithDecay.toFixed(1)} WANKR (${this.config.timeDecayFactor} daily decay rate)`,
      `Unique shamers: ${uniqueShamers} (consensus factor: ${consensusFactor.toFixed(1)})`,
      `Average shamer reputation: ${averageShamerReputation.toFixed(1)}/100 (authority factor: ${reputationFactor.toFixed(2)})`,
      `Final calculation: ${baseShameWithDecay.toFixed(1)} × ${consensusFactor.toFixed(1)} × ${reputationFactor.toFixed(2)} ÷ 10 = ${finalScore}`
    ]

    return {
      finalScore,
      components: {
        baseShame,
        uniqueShamers,
        averageShamerReputation,
        consensusFactor,
        reputationFactor,
        timeDecayEffect: ((baseShame - baseShameWithDecay) / baseShame) * 100,
        filteredTransactions: filteredCount,
        totalTransactions: receivedTransactions.length
      },
      explanation
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ShameScoreConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
}

// Export singleton instance
export const shameScoreService = new ShameScoreService()
