export interface ErrorContext {
  component?: string
  action?: string
  userId?: string
  timestamp: number
  retryCount?: number
}

export interface ErrorResponse {
  userMessage: string
  technicalMessage: string
  shouldRetry: boolean
  retryDelay?: number
  errorCode?: string
}

export class ErrorHandler {
  private static readonly MAX_RETRIES = 3
  private static readonly BASE_RETRY_DELAY = 1000 // 1 second

  /**
   * Handle errors with consistent formatting and user-friendly messages
   */
  static handle(error: unknown, context: Partial<ErrorContext> = {}): ErrorResponse {
    const errorContext: ErrorContext = {
      timestamp: Date.now(),
      ...context
    }

    // Log the error for debugging
    this.logError(error, errorContext)

    // Determine if this is a retryable error
    const shouldRetry = this.isRetryableError(error)
    const retryDelay = shouldRetry ? this.calculateRetryDelay(errorContext.retryCount || 0) : undefined

    // Generate user-friendly message
    const userMessage = this.generateUserMessage(error)
    const technicalMessage = this.generateTechnicalMessage(error)

    return {
      userMessage,
      technicalMessage,
      shouldRetry,
      retryDelay,
      errorCode: this.getErrorCode(error)
    }
  }

  /**
   * Check if an error should be retried
   */
  private static isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      // Network errors are retryable
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return true
      }
      
      // HTTP 5xx errors are retryable
      if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
        return true
      }
      
      // Rate limiting errors are retryable
      if (error.message.includes('429') || error.message.includes('rate limit')) {
        return true
      }
    }
    
    return false
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private static calculateRetryDelay(retryCount: number): number {
    return this.BASE_RETRY_DELAY * Math.pow(2, retryCount)
  }

  /**
   * Generate user-friendly error message
   */
  private static generateUserMessage(error: unknown): string {
    if (error instanceof Error) {
      const message = error.message.toLowerCase()
      
      // Network errors
      if (message.includes('fetch') || message.includes('network')) {
        return 'Network connection issue. Please check your internet connection and try again.'
      }
      
      // API errors
      if (message.includes('api error')) {
        return 'Service temporarily unavailable. Please try again in a moment.'
      }
      
      // Rate limiting
      if (message.includes('429') || message.includes('rate limit')) {
        return 'Too many requests. Please wait a moment before trying again.'
      }
      
      // Validation errors
      if (message.includes('invalid') || message.includes('format')) {
        return 'Invalid input. Please check your data and try again.'
      }
      
      // Wallet errors
      if (message.includes('wallet') || message.includes('metamask')) {
        return 'Wallet connection issue. Please try connecting your wallet again.'
      }
      
      // Handle resolution errors
      if (message.includes('handle') || message.includes('resolution')) {
        return 'Unable to resolve handle. Please check the format and try again.'
      }
      
      // Default message
      return 'Something went wrong. Please try again.'
    }
    
    return 'An unexpected error occurred. Please try again.'
  }

  /**
   * Generate technical error message for debugging
   */
  private static generateTechnicalMessage(error: unknown): string {
    if (error instanceof Error) {
      return `${error.name}: ${error.message}`
    }
    
    return String(error)
  }

  /**
   * Get error code for categorization
   */
  private static getErrorCode(error: unknown): string {
    if (error instanceof Error) {
      const message = error.message.toLowerCase()
      
      if (message.includes('network') || message.includes('fetch')) return 'NETWORK_ERROR'
      if (message.includes('429') || message.includes('rate limit')) return 'RATE_LIMIT'
      if (message.includes('invalid') || message.includes('format')) return 'VALIDATION_ERROR'
      if (message.includes('wallet') || message.includes('metamask')) return 'WALLET_ERROR'
      if (message.includes('handle') || message.includes('resolution')) return 'HANDLE_RESOLUTION_ERROR'
      if (message.includes('500') || message.includes('502') || message.includes('503')) return 'SERVER_ERROR'
    }
    
    return 'UNKNOWN_ERROR'
  }

  /**
   * Log error for debugging and monitoring
   */
  private static logError(error: unknown, context: ErrorContext): void {
    const errorInfo = {
      error: this.generateTechnicalMessage(error),
      context,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }
    
    console.error('🚨 Error Handler:', errorInfo)
    
    // TODO: Send to monitoring service (e.g., Sentry, LogRocket)
    // this.sendToMonitoringService(errorInfo)
  }

  /**
   * Retry a function with exponential backoff
   */
  static async withRetry<T>(
    fn: () => Promise<T>,
    context: Partial<ErrorContext> = {},
    maxRetries: number = this.MAX_RETRIES
  ): Promise<T> {
    let lastError: unknown
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error
        
        const errorResponse = this.handle(error, { ...context, retryCount: attempt })
        
        if (!errorResponse.shouldRetry || attempt === maxRetries) {
          throw error
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, errorResponse.retryDelay))
      }
    }
    
    throw lastError
  }

  /**
   * Handle async errors in components
   */
  static handleAsyncError(error: unknown, context: Partial<ErrorContext> = {}): void {
    const errorResponse = this.handle(error, context)
    
    // Show user-friendly error message
    this.showUserError(errorResponse.userMessage)
  }

  /**
   * Show error message to user (can be customized based on UI framework)
   */
  private static showUserError(message: string): void {
    // For now, just log to console
    // TODO: Integrate with toast notification system
    console.error('User Error:', message)
    
    // You can integrate this with your preferred notification system
    // Example: toast.error(message)
  }
}

// Export convenience functions
export const handleError = (error: unknown, context?: Partial<ErrorContext>) => 
  ErrorHandler.handle(error, context)

export const withRetry = <T>(
  fn: () => Promise<T>, 
  context?: Partial<ErrorContext>, 
  maxRetries?: number
) => ErrorHandler.withRetry(fn, context, maxRetries)

export const handleAsyncError = (error: unknown, context?: Partial<ErrorContext>) => 
  ErrorHandler.handleAsyncError(error, context)
