"use client"

import { useMemo, useRef, useEffect, useState } from 'react'
import { useDuneUpvoteData, type DailyUpvoteData } from '../../hooks/useDuneUpvoteData'
import { useDuneHoldersData, type DailyHoldersData } from '../../hooks/useDuneHoldersData'

interface DuneUpvoteChartProps {
  startDate?: string
  endDate?: string
  className?: string
}

type TimeRange = '7d' | '30d' | '90d' | '365d' | 'all'

export function DuneUpvoteChart({
  startDate,
  endDate,
  className = ''
}: DuneUpvoteChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')
  
  // Initialize dimensions to 0 to prevent layout shift
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  
  // Calculate date range based on selected time range
  const { calculatedStartDate, calculatedEndDate } = useMemo(() => {
    const now = new Date()
    const end = new Date()
    
    let start = new Date()
    switch (timeRange) {
      case '7d':
        start.setDate(now.getDate() - 7)
        break
      case '30d':
        start.setDate(now.getDate() - 30)
        break
      case '90d':
        start.setDate(now.getDate() - 90)
        break
      case '365d':
        start.setDate(now.getDate() - 365)
        break
      case 'all':
        start = new Date('2025-08-06') // Token creation date
        break
    }
    
    return {
      calculatedStartDate: start.toISOString().split('T')[0],
      calculatedEndDate: end.toISOString().split('T')[0]
    }
  }, [timeRange])
  
  const { data: upvoteData, loading: upvoteLoading, error: upvoteError } = useDuneUpvoteData({
    startDate: calculatedStartDate,
    endDate: calculatedEndDate,
    autoRefresh: false
  })

  const { data: holdersData, loading: holdersLoading, error: holdersError } = useDuneHoldersData({
    startDate: calculatedStartDate,
    endDate: calculatedEndDate,
    autoRefresh: false
  })

  // Responsive sizing with ResizeObserver
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDimensions({
          width: rect.width,
          height: rect.height
        })
      }
    }

    // Use ResizeObserver for more robust and performant measurements
    const resizeObserver = new ResizeObserver(() => updateDimensions())
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }
    
    updateDimensions() // Initial measurement

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current)
      }
    }
  }, [])

  // Smart data aggregation based on time range
  const aggregateData = useMemo(() => {
    if (!Array.isArray(upvoteData) || upvoteData.length === 0) return null

    let aggregationInterval = 1 // Show every point for recent data
    
    // Determine aggregation interval based on time range and data density
    if (timeRange === '90d' && upvoteData.length > 60) {
      aggregationInterval = 3 // Show every 3rd point
    } else if (timeRange === '365d' && upvoteData.length > 100) {
      aggregationInterval = 7 // Show weekly averages
    } else if (timeRange === 'all' && upvoteData.length > 200) {
      aggregationInterval = 30 // Show monthly averages
    }

    // Aggregate data based on interval
    const aggregatedUpvotes = upvoteData.filter((_, index) => 
      index % aggregationInterval === 0 || index === upvoteData.length - 1
    )

    // If aggregating, calculate averages
    if (aggregationInterval > 1) {
      const aggregated = []
      for (let i = 0; i < aggregatedUpvotes.length - 1; i++) {
        const startIdx = i * aggregationInterval
        const endIdx = Math.min((i + 1) * aggregationInterval, upvoteData.length)
        const slice = upvoteData.slice(startIdx, endIdx)
        
        aggregated.push({
          vote_date: slice[0].vote_date,
          total_upvotes: Math.round(slice.reduce((sum, item) => sum + item.total_upvotes, 0) / slice.length)
        })
      }
      // Add the last point
      aggregated.push(aggregatedUpvotes[aggregatedUpvotes.length - 1])
      return aggregated
    }

    return aggregatedUpvotes
  }, [upvoteData, timeRange])

  const chartData = useMemo(() => {
    // Wait for proper dimensions and data before calculating
    if (!aggregateData || aggregateData.length === 0 || dimensions.width === 0 || dimensions.height === 0) {
      return null
    }

    // Debug: Log the data we have
    console.log('🔍 Chart data debug:', {
      aggregateDataLength: aggregateData.length,
      holdersDataLength: holdersData?.length || 0,
      sampleUpvoteData: aggregateData.slice(0, 3),
      sampleHoldersData: holdersData?.slice(0, 3)
    })

    // Calculate how many data points we can safely display based on available width
    const padding = 40 // Reduced padding
    const availableWidth = dimensions.width - padding * 2
    const minPointSpacing = 20 // Reduced from 30 to show even more data points
    const maxDataPoints = Math.max(1, Math.floor(availableWidth / minPointSpacing))
    
    // Reduce data points based on available space
    let reducedUpvoteData
    if (aggregateData.length <= maxDataPoints) {
      reducedUpvoteData = aggregateData
    } else {
      // Show every Nth point to fit within available space
      const step = Math.ceil(aggregateData.length / maxDataPoints)
      reducedUpvoteData = aggregateData.filter((_, index) => index % step === 0 || index === aggregateData.length - 1)
    }
    
    // Match holders data to upvote data by date
    const holdersMap = new Map(holdersData?.map(h => [h.date, h.unique_holders]) || [])
    const matchedData = reducedUpvoteData.map(upvote => {
      const holdersValue = holdersMap.get(upvote.vote_date) || 0
      console.log(`🔍 Matching date ${upvote.vote_date}: upvotes=${upvote.total_upvotes}, holders=${holdersValue}`)
      return {
        ...upvote,
        unique_holders: holdersValue
      }
    })
    
    const upvotes = matchedData.map(d => d.total_upvotes)
    const holders = matchedData.map(d => d.unique_holders)
    const minUpvotes = Math.min(...upvotes)
    const maxUpvotes = Math.max(...upvotes)
    const minHolders = Math.min(...holders)
    const maxHolders = Math.max(...holders)
    
    const chartWidth = Math.max(0, dimensions.width - padding * 2)
    const chartHeight = Math.max(0, dimensions.height - padding * 2)
    
    const upvotePoints = matchedData.map((point, index) => {
      const x = padding + (index / (matchedData.length - 1)) * chartWidth
      const y = padding + chartHeight - (
        (point.total_upvotes - minUpvotes) / (maxUpvotes - minUpvotes) * chartHeight
      )
      return `${x},${y}`
    })

    const holdersPoints = matchedData.map((point, index) => {
      const x = padding + (index / (matchedData.length - 1)) * chartWidth
      const y = padding + chartHeight - (
        (point.unique_holders - minHolders) / (maxHolders - minHolders) * chartHeight
      )
      return `${x},${y}`
    })

    const upvotePathData = upvotePoints.length > 1 ? `M ${upvotePoints.join(' L ')}` : ''
    const holdersPathData = holdersPoints.length > 1 ? `M ${holdersPoints.join(' L ')}` : ''

    return {
      upvotePathData,
      holdersPathData,
      upvotePoints: matchedData.map((point, index) => ({
        x: padding + (index / (matchedData.length - 1)) * chartWidth,
        y: padding + chartHeight - (
          (point.total_upvotes - minUpvotes) / (maxUpvotes - minUpvotes) * chartHeight
        ),
        data: point
      })),
      holdersPoints: matchedData.map((point, index) => ({
        x: padding + (index / (matchedData.length - 1)) * chartWidth,
        y: padding + chartHeight - (
          (point.unique_holders - minHolders) / (maxHolders - minHolders) * chartHeight
        ),
        data: point
      })),
      minUpvotes,
      maxUpvotes,
      minHolders,
      maxHolders,
      chartWidth,
      chartHeight,
      padding,
      matchedData,
      maxDataPoints
    }
  }, [aggregateData, holdersData, dimensions])

  const loading = upvoteLoading || holdersLoading
  const error = upvoteError || holdersError

  if (loading) {
    return (
      <div ref={containerRef} className={`relative w-full h-full ${className}`}>
        <div className="flex items-center justify-center h-full">
          <div className="text-muted-foreground">Loading chart data...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div ref={containerRef} className={`relative w-full h-full ${className}`}>
        <div className="flex items-center justify-center h-full">
          <div className="text-destructive">Error loading chart data</div>
        </div>
      </div>
    )
  }

  // Render a placeholder until the container is measured and chart data is ready
  if (!chartData || chartData.upvotePoints.length === 0) {
    return (
      <div ref={containerRef} className={`relative w-full h-full ${className}`}>
        <div className="flex items-center justify-center h-full">
          <div className="text-muted-foreground">No chart data available</div>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* Time Range Selector */}
      <div className="absolute top-0 right-10 z-10">
        <div className="flex gap-1 bg-card/80 backdrop-blur-sm border rounded-lg px-3 py-1">
          {(['7d', '30d', '90d', '365d', 'all'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                timeRange === range
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {range === 'all' ? 'All' : range}
            </button>
          ))}
        </div>
      </div>

      {/* Use viewBox for responsive scaling */}
      <svg
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        {/* Background */}
        <rect width={dimensions.width} height={dimensions.height} fill="transparent" />
        
        {/* Grid Lines - Horizontal */}
        {Array.from({ length: 6 }, (_, i) => {
          const y = chartData.padding + (i / 5) * chartData.chartHeight
          return (
            <g key={`grid-h-${i}`}>
              <line
                x1={chartData.padding}
                y1={y}
                x2={chartData.padding + chartData.chartWidth}
                y2={y}
                stroke="hsl(var(--border))"
                strokeWidth="1"
                opacity="0.4"
              />
            </g>
          )
        })}
        
        {/* Grid Lines - Vertical */}
        {Array.from({ length: 6 }, (_, i) => {
          const x = chartData.padding + (i / 5) * chartData.chartWidth
          return (
            <g key={`grid-v-${i}`}>
              <line
                x1={x}
                y1={chartData.padding}
                x2={x}
                y2={chartData.padding + chartData.chartHeight}
                stroke="hsl(var(--border))"
                strokeWidth="1"
                opacity="0.4"
              />
            </g>
          )
        })}
        
        {/* Chart Area Border */}
        <rect
          x={chartData.padding}
          y={chartData.padding}
          width={chartData.chartWidth}
          height={chartData.chartHeight}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="1"
          opacity="0.6"
        />
        
        {/* Upvote Line Chart */}
        <path 
          d={chartData.upvotePathData} 
          stroke="hsl(var(--primary))" 
          strokeWidth="3" 
          fill="none" 
          className="drop-shadow-sm"
        />
        
        {/* Holders Line Chart */}
        <path 
          d={chartData.holdersPathData} 
          stroke="hsl(var(--accent))" 
          strokeWidth="3" 
          fill="none" 
          className="drop-shadow-sm"
          strokeDasharray="5,5"
        />
        
        {/* Upvote Data Points */}
        {chartData.upvotePoints.map((point, index) => (
          <g key={`upvote-${index}`}>
            <circle
              cx={point.x}
              cy={point.y}
              r="5"
              fill="hsl(var(--primary))"
              className="hover:r-7 transition-all duration-200 cursor-pointer"
              onMouseEnter={() => {
                const tooltip = document.querySelector(`[data-tooltip="upvote-${index}"]`)
                if (tooltip) tooltip.classList.remove('opacity-0')
              }}
              onMouseLeave={() => {
                const tooltip = document.querySelector(`[data-tooltip="upvote-${index}"]`)
                if (tooltip) tooltip.classList.add('opacity-0')
              }}
            />
          </g>
        ))}
        
        {/* Holders Data Points */}
        {chartData.holdersPoints.map((point, index) => (
          <g key={`holders-${index}`}>
            <circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill="hsl(var(--accent))"
              className="hover:r-6 transition-all duration-200 cursor-pointer"
              onMouseEnter={() => {
                const tooltip = document.querySelector(`[data-tooltip="holders-${index}"]`)
                if (tooltip) tooltip.classList.remove('opacity-0')
              }}
              onMouseLeave={() => {
                const tooltip = document.querySelector(`[data-tooltip="holders-${index}"]`)
                if (tooltip) tooltip.classList.add('opacity-0')
              }}
            />
          </g>
        ))}
        
        {/* Left Y-axis Labels - Upvotes */}
        {Array.from({ length: 6 }, (_, i) => {
          const y = chartData.padding + (i / 5) * chartData.chartHeight
          const maxValue = Math.ceil(chartData.maxUpvotes / 200000) * 200000
          const value = Math.round((maxValue - (i / 5) * maxValue))
          const displayValue = value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : 
                              value >= 1000 ? `${(value / 1000).toFixed(0)}k` : 
                              value.toString()
          return (
            <g key={`y-label-upvotes-${i}`}>
              <text 
                x={chartData.padding + 5} 
                y={y + 5} 
                textAnchor="start" 
                className="text-xs font-medium"
                fill="hsl(var(--primary))"
              >
                {displayValue}
              </text>
            </g>
          )
        })}
        
        {/* Right Y-axis Labels - Holders */}
        {Array.from({ length: 6 }, (_, i) => {
          const y = chartData.padding + (i / 5) * chartData.chartHeight
          const maxValue = Math.ceil(chartData.maxHolders / 100) * 100
          const value = Math.round((maxValue - (i / 5) * maxValue))
          return (
            <g key={`y-label-holders-${i}`}>
              <text 
                x={chartData.padding + chartData.chartWidth - 5} 
                y={y + 5} 
                textAnchor="end" 
                className="text-xs font-medium"
                fill="hsl(var(--accent))"
              >
                {value}
              </text>
            </g>
          )
        })}
        
        {/* X-axis Labels - Dynamic intervals based on available space */}
        {(() => {
          // Calculate how many labels we can safely show
          const labelSpacing = 60 // Reduced minimum pixels between labels
          const maxLabels = Math.max(2, Math.floor(chartData.chartWidth / labelSpacing))
          
          // Show labels at regular intervals
          const labelInterval = Math.max(1, Math.floor(chartData.matchedData.length / maxLabels))
          const labeledData = chartData.matchedData.filter((_, index) => 
            index % labelInterval === 0 || index === chartData.matchedData.length - 1
          )
          
          return labeledData.map((point, i) => {
            const x = chartData.padding + (i / (labeledData.length - 1)) * chartData.chartWidth
            const date = point?.vote_date
            return (
              <g key={`x-label-${i}`}>
                <text 
                  x={x} 
                  y={Math.min(dimensions.height - 10, chartData.padding + chartData.chartHeight + 20)} 
                  textAnchor="middle" 
                  className="text-xs font-medium"
                  fill="white"
                >
                  {date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                </text>
              </g>
            )
          })
        })()}
      </svg>
      
      {/* Tooltips - Outside SVG for proper z-index */}
      {chartData.upvotePoints.map((point, index) => (
        <div
          key={`tooltip-upvote-${index}`}
          data-tooltip={`upvote-${index}`}
          className="absolute opacity-0 transition-opacity duration-200 pointer-events-none"
          style={{
            left: `${Math.min(point.x + 10, dimensions.width - 150)}px`,
            top: `${Math.max(point.y - 50, 10)}px`,
            zIndex: 1000
          }}
        >
          <div className="bg-card text-card-foreground text-xs p-2 rounded shadow-lg border max-w-[140px]">
            <div className="font-semibold">
              {new Date(point.data.vote_date).toLocaleDateString()}
            </div>
            <div className="text-primary">Upvotes: {point.data.total_upvotes.toLocaleString()}</div>
            <div className="text-accent">Holders: {point.data.unique_holders.toLocaleString()}</div>
          </div>
        </div>
      ))}
      
      {/* Holders Tooltips - Outside SVG for proper z-index */}
      {chartData.holdersPoints.map((point, index) => (
        <div
          key={`tooltip-holders-${index}`}
          data-tooltip={`holders-${index}`}
          className="absolute opacity-0 transition-opacity duration-200 pointer-events-none"
          style={{
            left: `${Math.min(point.x + 10, dimensions.width - 150)}px`,
            top: `${Math.max(point.y - 50, 10)}px`,
            zIndex: 1000
          }}
        >
          <div className="bg-card text-card-foreground text-xs p-2 rounded shadow-lg border max-w-[140px]">
            <div className="font-semibold">
              {new Date(point.data.vote_date).toLocaleDateString()}
            </div>
            <div className="text-primary">Upvotes: {point.data.total_upvotes.toLocaleString()}</div>
            <div className="text-accent">Holders: {point.data.unique_holders.toLocaleString()}</div>
          </div>
        </div>
      ))}
      
      {/* Legend - Above the chart */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10">
        <div className="flex items-center gap-4 text-xs bg-card/80 backdrop-blur-sm border px-3 py-1 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-primary rounded-full"></div>
            <span className="text-foreground font-medium">Total Upvotes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-accent rounded-full" style={{ backgroundImage: 'repeating-linear-gradient(90deg, hsl(var(--accent)), hsl(var(--accent)) 3px, transparent 3px, transparent 6px)' }}></div>
            <span className="text-foreground font-medium">Unique Holders</span>
          </div>
        </div>
      </div>
      

    </div>
  )
}
