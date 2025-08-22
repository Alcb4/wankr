"use client"

import { useRealtimeUpdates } from '../../hooks/useRealtimeUpdates'

interface RealtimeStatusProps {
  subscriptions?: string[]
  clientId?: string
  showDetails?: boolean
  className?: string
}

export function RealtimeStatus({ 
  subscriptions = ['shame-feed'], 
  clientId, 
  showDetails = false,
  className = ''
}: RealtimeStatusProps) {
  const { isConnected, error, reconnectAttempts } = useRealtimeUpdates({
    subscriptions,
    clientId
  })

  const getStatusColor = () => {
    if (error) return '#ff4757' // Red for error
    if (isConnected) return '#2ed573' // Green for connected
    return '#ffc107' // Yellow for connecting
  }

  const getStatusText = () => {
    if (error) return 'Error'
    if (isConnected) return 'Live'
    return 'Connecting...'
  }

  const getBackgroundColor = () => {
    const color = getStatusColor()
    return color === '#ff4757' ? 'rgba(255, 71, 87, 0.1)' : 
           color === '#2ed573' ? 'rgba(46, 213, 115, 0.1)' : 
           'rgba(255, 193, 7, 0.1)'
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-md border flex-shrink-0 ${className}`} 
         style={{ 
           backgroundColor: getBackgroundColor(),
           borderColor: getStatusColor()
         }}>
      <div className="w-2 h-2 rounded-full animate-pulse" 
           style={{ backgroundColor: getStatusColor() }}></div>
      <span className="text-xs font-medium" 
            style={{ color: getStatusColor() }}>
        {getStatusText()}
      </span>
      
      {showDetails && (
        <div className="text-xs text-muted-foreground ml-2">
          {subscriptions.join(', ')}
          {reconnectAttempts > 0 && ` (${reconnectAttempts} retries)`}
        </div>
      )}
    </div>
  )
}
