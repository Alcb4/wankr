"use client"

import { useMemo } from 'react'
import { useDuneUpvoteData, type DailyUpvoteData } from '../../hooks/useDuneUpvoteData'

interface DuneUpvoteChartProps {
  startDate?: string
  endDate?: string
  width?: number
  height?: number
  className?: string
}

export function DuneUpvoteChart({
  startDate,
  endDate,
  width = 800,
  height = 400,
  className = ''
}: DuneUpvoteChartProps) {
  const { data, loading, error, lastUpdated, refresh } = useDuneUpvoteData({
    startDate,
    endDate,
    autoRefresh: false
  })

  const chartData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return null
    }

    // Find min and max values for scaling
    const upvotes = data.map(d => d.total_upvotes)
    const minUpvotes = Math.min(...upvotes)
    const maxUpvotes = Math.max(...upvotes)
    
    // Calculate chart dimensions
    const padding = 40
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2
    
    // Generate SVG path
    const points = data.map((point, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth
      const y = padding + chartHeight - (
        (point.total_upvotes - minUpvotes) / (maxUpvotes - minUpvotes) * chartHeight
      )
      return `${x},${y}`
    })

    const pathData = points.length > 1 ? `M ${points.join(' L ')}` : ''

    return {
      pathData,
      points: data.map((point, index) => ({
        x: padding + (index / (data.length - 1)) * chartWidth,
        y: padding + chartHeight - (
          (point.total_upvotes - minUpvotes) / (maxUpvotes - minUpvotes) * chartHeight
        ),
        data: point
      })),
      minUpvotes,
      maxUpvotes,
      chartWidth,
      chartHeight
    }
  }, [data, width, height])

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width, height }}>
        <div className="text-purple-600">Loading real upvote data from Dune...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width, height }}>
        <div className="text-red-600">Error: {error}</div>
      </div>
    )
  }

  if (!chartData || chartData.points.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width, height }}>
        <div className="text-gray-500">No upvote data available</div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <svg width={width} height={height} className="w-full h-auto">
        {/* Background grid */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Chart area */}
        <rect
          x={40}
          y={40}
          width={chartData.chartWidth}
          height={chartData.chartHeight}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="1"
        />
        
        {/* Line chart */}
        <path
          d={chartData.pathData}
          fill="none"
          stroke="#8b5cf6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data points with tooltips */}
        {chartData.points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#8b5cf6"
              className="hover:r-6 transition-all duration-200 cursor-pointer"
              onMouseEnter={(e) => {
                const tooltip = e.currentTarget.nextElementSibling
                if (tooltip) tooltip.classList.remove('opacity-0')
              }}
              onMouseLeave={(e) => {
                const tooltip = e.currentTarget.nextElementSibling
                if (tooltip) tooltip.classList.add('opacity-0')
              }}
            />
            {/* Tooltip */}
            <foreignObject
              x={point.x + 10}
              y={point.y - 30}
              width="200"
              height="80"
              className="opacity-0 transition-opacity duration-200 pointer-events-none"
            >
              <div className="bg-gray-800 text-white text-xs p-2 rounded shadow-lg">
                <div className="font-semibold">
                  {new Date(point.data.vote_date).toLocaleDateString()}
                </div>
                <div>Total Upvotes: {point.data.total_upvotes.toLocaleString()}</div>
              </div>
            </foreignObject>
          </g>
        ))}
        
        {/* Y-axis labels */}
        <text x="10" y="45" className="text-xs fill-gray-600">
          {chartData.maxUpvotes.toLocaleString()}
        </text>
        <text x="10" y={height - 45} className="text-xs fill-gray-600">
          {chartData.minUpvotes.toLocaleString()}
        </text>
        
        {/* X-axis labels */}
        {chartData.points.length > 0 && (
          <>
            <text x="45" y={height - 10} className="text-xs fill-gray-600">
              {new Date(chartData.points[0].data.vote_date).toLocaleDateString()}
            </text>
            <text x={width - 45} y={height - 10} className="text-xs fill-gray-600" textAnchor="end">
              {new Date(chartData.points[chartData.points.length - 1].data.vote_date).toLocaleDateString()}
            </text>
          </>
        )}
      </svg>
      
      {/* Chart info */}
      <div className="mt-4 text-sm text-gray-600">
        <div className="flex justify-between items-center">
          <span>
            Real Historical Data from Dune Analytics
          </span>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span>
                Last updated: {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={refresh}
              disabled={loading}
              className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
        <div className="mt-2">
          <span className="text-purple-600 font-medium">
            Current total: {chartData.points.length > 0 ? chartData.points[chartData.points.length - 1].data.total_upvotes.toLocaleString() : '0'} upvotes
          </span>
        </div>
      </div>
    </div>
  )
}
