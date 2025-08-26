// src/app/services/verificationService.ts

interface VerificationConfig {
  automaticEnabled: boolean
  checkInEnabled: boolean
  checkInBonus: number
  maxCheckInStreak: number
  checkInCooldown: number // hours
}

interface UserVerification {
  level: 'unverified' | 'verified' | 'trusted'
  automaticScore: number
  checkInScore: number
  checkInStreak: number
  lastCheckIn: number
  totalCheckIns: number
  verificationBadge: boolean
}

/**
 * Service for managing user verification levels
 * Supports automatic, check-in, and hybrid verification systems
 */
export class VerificationService {
  private config: VerificationConfig = {
    automaticEnabled: true,
    checkInEnabled: true, // Enable check-ins for engagement
    checkInBonus: 5, // Points per check-in
    maxCheckInStreak: 7, // Max streak bonus
    checkInCooldown: 24 // Hours between check-ins
  }

  /**
   * Calculate verification level based on shame score and check-ins
   */
  calculateVerificationLevel(
    shameScore: number,
    checkInStreak: number = 0,
    totalCheckIns: number = 0
  ): 'unverified' | 'verified' | 'trusted' {
    let totalScore = shameScore

    // Add check-in bonus if enabled
    if (this.config.checkInEnabled) {
      const checkInBonus = Math.min(checkInStreak * this.config.checkInBonus, this.config.maxCheckInStreak * this.config.checkInBonus)
      totalScore += checkInBonus
    }

    // Determine level
    if (totalScore >= 80) return 'trusted'
    if (totalScore >= 50) return 'verified'
    return 'unverified'
  }

  /**
   * Check if user can perform a check-in
   */
  canCheckIn(lastCheckIn: number): boolean {
    if (!this.config.checkInEnabled) return false
    
    const now = Date.now()
    const hoursSinceLastCheckIn = (now - lastCheckIn) / (1000 * 60 * 60)
    
    return hoursSinceLastCheckIn >= this.config.checkInCooldown
  }

  /**
   * Perform a check-in and return updated verification data
   */
  performCheckIn(
    currentVerification: UserVerification,
    shameScore: number
  ): UserVerification {
    if (!this.canCheckIn(currentVerification.lastCheckIn)) {
      throw new Error('Check-in cooldown not met')
    }

    const now = Date.now()
    const newCheckInStreak = currentVerification.checkInStreak + 1
    const newTotalCheckIns = currentVerification.totalCheckIns + 1

    const updatedVerification: UserVerification = {
      level: this.calculateVerificationLevel(shameScore, newCheckInStreak, newTotalCheckIns),
      automaticScore: shameScore,
      checkInScore: Math.min(newCheckInStreak * this.config.checkInBonus, this.config.maxCheckInStreak * this.config.checkInBonus),
      checkInStreak: newCheckInStreak,
      lastCheckIn: now,
      totalCheckIns: newTotalCheckIns,
      verificationBadge: this.getVerificationBadge(shameScore, newCheckInStreak, newTotalCheckIns)
    }

    return updatedVerification
  }

  /**
   * Get streak day message with appropriate emoji and text
   */
  getStreakDayMessage(streakDay: number): { message: string; emoji: string; color: string } {
    if (streakDay === 1) {
      return { message: 'First day! Keep it going!', emoji: '🎯', color: 'text-blue-400' }
    } else if (streakDay === 3) {
      return { message: '3-day streak! You\'re building momentum!', emoji: '🔥', color: 'text-orange-400' }
    } else if (streakDay === 7) {
      return { message: 'Week streak! You\'re on fire!', emoji: '🔥', color: 'text-red-400' }
    } else if (streakDay === 14) {
      return { message: '2-week streak! Unstoppable!', emoji: '⚡', color: 'text-yellow-400' }
    } else if (streakDay === 30) {
      return { message: 'Month streak! Legendary!', emoji: '👑', color: 'text-purple-400' }
    } else if (streakDay === 100) {
      return { message: '100 days! You\'re a WANKR master!', emoji: '🏆', color: 'text-yellow-500' }
    } else if (streakDay % 7 === 0) {
      return { message: `${streakDay}-day streak! Weekly milestone!`, emoji: '🌟', color: 'text-green-400' }
    } else if (streakDay % 5 === 0) {
      return { message: `${streakDay}-day streak! Keep it up!`, emoji: '💪', color: 'text-blue-400' }
    } else {
      return { message: `Day ${streakDay} streak!`, emoji: '🎯', color: 'text-green-400' }
    }
  }

  /**
   * Get verification badge eligibility
   */
  getVerificationBadge(
    shameScore: number,
    checkInStreak: number = 0,
    totalCheckIns: number = 0
  ): boolean {
    const totalScore = shameScore + (this.config.checkInEnabled ? Math.min(checkInStreak * this.config.checkInBonus, this.config.maxCheckInStreak * this.config.checkInBonus) : 0)
    
    // Requirements for verification badge
    const hasMinimumScore = totalScore >= 70
    const hasMinimumCheckIns = this.config.checkInEnabled ? totalCheckIns >= 5 : true
    
    return hasMinimumScore && hasMinimumCheckIns
  }

  /**
   * Get verification progress (0-100)
   */
  getVerificationProgress(
    shameScore: number,
    checkInStreak: number = 0
  ): number {
    let totalScore = shameScore

    if (this.config.checkInEnabled) {
      const checkInBonus = Math.min(checkInStreak * this.config.checkInBonus, this.config.maxCheckInStreak * this.config.checkInBonus)
      totalScore += checkInBonus
    }

    return Math.min(100, Math.max(0, totalScore))
  }

  /**
   * Get time until next check-in is available
   */
  getTimeUntilNextCheckIn(lastCheckIn: number): string {
    if (!this.config.checkInEnabled) return 'Check-ins disabled'

    const now = Date.now()
    const hoursSinceLastCheckIn = (now - lastCheckIn) / (1000 * 60 * 60)
    const hoursRemaining = this.config.checkInCooldown - hoursSinceLastCheckIn

    if (hoursRemaining <= 0) return 'Available now'

    if (hoursRemaining >= 24) {
      const days = Math.floor(hoursRemaining / 24)
      const hours = Math.floor(hoursRemaining % 24)
      return `${days}d ${hours}h`
    } else {
      return `${Math.floor(hoursRemaining)}h ${Math.floor((hoursRemaining % 1) * 60)}m`
    }
  }

  /**
   * Update verification configuration
   */
  updateConfig(newConfig: Partial<VerificationConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Get current configuration
   */
  getConfig(): VerificationConfig {
    return { ...this.config }
  }

  /**
   * Enable check-in system
   */
  enableCheckIns(): void {
    this.config.checkInEnabled = true
  }

  /**
   * Disable check-in system
   */
  disableCheckIns(): void {
    this.config.checkInEnabled = false
  }
}

// Export singleton instance
export const verificationService = new VerificationService()
