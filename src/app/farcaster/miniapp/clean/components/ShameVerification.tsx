"use client"

import { useState, useEffect } from 'react'

interface ShameVerificationProps {
  targetAddress: string | null
}

interface VerificationMetrics {
  authenticityScore: number
  shameHistory: number
  consistencyScore: number
  riskLevel: 'low' | 'medium' | 'high'
  recommendations: string[]
}

export function ShameVerification({ targetAddress }: ShameVerificationProps) {
  const [metrics, setMetrics] = useState<VerificationMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!targetAddress) return

    const calculateVerification = async () => {
      try {
        setLoading(true)
        
        // Use existing APIs to gather data for verification
        const [shameResponse, statsResponse] = await Promise.all([
          fetch('/api/shame-feed'),
          fetch('/api/quick-stats')
        ])

        if (shameResponse.ok && statsResponse.ok) {
          const shameData = await shameResponse.json()
          
          // Filter for target address
          const targetShames = shameData.shames?.filter((shame: { to?: string; amount?: number }) => 
            shame.to?.toLowerCase() === targetAddress.toLowerCase()
          ) || []

          // Calculate verification metrics
          const shameHistory = targetShames.length
          const totalAmount = targetShames.reduce((sum: number, shame: { amount?: number }) => sum + (shame.amount || 0), 0)
          const averageAmount = shameHistory > 0 ? totalAmount / shameHistory : 0
          
          // Simple scoring algorithm
          let authenticityScore = 0
          let consistencyScore = 0
          let riskLevel: 'low' | 'medium' | 'high' = 'low'
          const recommendations: string[] = []

          // Score based on shame history
          if (shameHistory > 10) {
            authenticityScore += 30
            recommendations.push('High shame history indicates authenticity')
          } else if (shameHistory > 5) {
            authenticityScore += 20
            recommendations.push('Moderate shame history')
          } else if (shameHistory > 0) {
            authenticityScore += 10
            recommendations.push('Low shame history - monitor for consistency')
          } else {
            recommendations.push('No shame history - verify identity')
          }

          // Score based on amount consistency
          if (shameHistory > 1) {
            const amounts = targetShames.map((s: { amount?: number }) => s.amount || 0)
            const variance = Math.sqrt(amounts.reduce((sum: number, amount: number) => 
              sum + Math.pow(amount - averageAmount, 2), 0) / amounts.length)
            
            if (variance < 5) {
              consistencyScore = 40
              recommendations.push('Consistent shame amounts')
            } else if (variance < 15) {
              consistencyScore = 25
              recommendations.push('Moderate amount variance')
            } else {
              consistencyScore = 10
              recommendations.push('High amount variance - investigate')
            }
          }

          // Score based on total amount
          if (totalAmount > 100) {
            authenticityScore += 30
            recommendations.push('High total shame value')
          } else if (totalAmount > 50) {
            authenticityScore += 20
            recommendations.push('Moderate total shame value')
          } else if (totalAmount > 10) {
            authenticityScore += 10
            recommendations.push('Low total shame value')
          }

          // Determine risk level
          if (authenticityScore + consistencyScore >= 70) {
            riskLevel = 'low'
          } else if (authenticityScore + consistencyScore >= 40) {
            riskLevel = 'medium'
          } else {
            riskLevel = 'high'
          }

          setMetrics({
            authenticityScore: Math.min(100, authenticityScore + consistencyScore),
            shameHistory,
            consistencyScore,
            riskLevel,
            recommendations
          })
        }
      } catch (err) {
        console.error('Verification error:', err)
      } finally {
        setLoading(false)
      }
    }

    calculateVerification()
  }, [targetAddress])

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Shame Verification</h2>
        <div className="text-center py-8">
          <div className="text-muted-foreground">Calculating verification metrics...</div>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Shame Verification</h2>
        <div className="text-center py-8">
          <div className="text-muted-foreground">No verification data available</div>
        </div>
      </div>
    )
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-500'
      case 'medium': return 'text-yellow-500'
      case 'high': return 'text-red-500'
      default: return 'text-muted-foreground'
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Shame Verification</h2>
      
      {/* Authenticity Score */}
      <div className="p-4 bg-muted rounded-lg">
        <div className="text-center">
          <div className="text-3xl font-bold text-primary">{metrics.authenticityScore}</div>
          <div className="text-sm text-muted-foreground">Authenticity Score</div>
        </div>
      </div>

      {/* Risk Level */}
      <div className="p-3 border border-border rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Risk Level:</span>
          <span className={`text-sm font-bold ${getRiskColor(metrics.riskLevel)}`}>
            {metrics.riskLevel.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-muted rounded-lg text-center">
          <div className="text-xl font-bold text-primary">{metrics.shameHistory}</div>
          <div className="text-xs text-muted-foreground">Shame History</div>
        </div>
        <div className="p-3 bg-muted rounded-lg text-center">
          <div className="text-xl font-bold text-primary">{metrics.consistencyScore}</div>
          <div className="text-xs text-muted-foreground">Consistency</div>
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h3 className="text-md font-medium mb-3">Recommendations</h3>
        <div className="space-y-2">
          {metrics.recommendations.map((rec, index) => (
            <div key={index} className="p-2 bg-muted rounded text-sm">
              • {rec}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
