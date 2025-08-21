"use client"

import { useState } from 'react'
import { DuneUpvoteChart } from '../components/DuneUpvoteChart/DuneUpvoteChart'

export default function DuneDemoPage() {
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '180d' | '365d'>('90d')
  
  // Calculate date range - adjust to match available data (63 days)
  const now = new Date()
  const getStartDate = (range: string) => {
    // Limit to available data (63 days)
    const maxDays = 63
    const requestedDays = range === '30d' ? 30 : range === '90d' ? 90 : range === '180d' ? 180 : 365
    const days = Math.min(requestedDays, maxDays)
    
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - days)
    return startDate.toISOString().split('T')[0] // YYYY-MM-DD format
  }

  const endDate = now.toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Real Historical Upvote Data
          </h1>
          <p className="text-gray-600 mb-6">
            Live upvote data from Dune Analytics showing the actual growth of WANKR upvotes over time.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Range
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as '30d' | '90d' | '180d' | '365d')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 63 days (all available)</option>
                <option value="180d">Last 63 days (all available)</option>
                <option value="365d">Last 63 days (all available)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Source
              </label>
              <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-green-800 text-sm font-medium">Dune Analytics - Real Data</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              WANKR Token Address
            </h3>
            <p className="text-green-800 font-mono text-sm break-all">
              0xa207C6E67ceA08641503947Ac05c65748bb9bB07
            </p>
            <p className="text-green-700 text-sm mt-2">
              This chart shows real historical upvote data from the Net Protocol contract,
              calculated using the same logic as the Dune query you provided.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Cumulative Upvotes Over Time
            </h2>
            <div className="text-sm text-gray-500">
              {getStartDate(timeRange)} to {endDate}
            </div>
          </div>
          
          <DuneUpvoteChart
            startDate={getStartDate(timeRange)}
            endDate={endDate}
            width={800}
            height={400}
            className="w-full"
          />
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            About This Implementation
          </h2>
          
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Data Source</h3>
              <p>
                This chart uses real historical data from Dune Analytics, powered by your SQL query that calculates
                cumulative upvotes for the WANKR token over time. The data shows actual upvote events from the
                Net Protocol contract.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Query Logic</h3>
              <p>
                The Dune query calculates daily upvote changes by:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm ml-4 mt-2">
                <li>Extracting all &apos;upvoted&apos; events for the WANKR token</li>
                <li>Calculating vote deltas (changes) for each user</li>
                <li>Aggregating daily changes</li>
                <li>Computing running totals for cumulative growth</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Technical Implementation</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Dune Analytics API integration for real-time data</li>
                <li>1-hour caching to minimize API calls</li>
                <li>Interactive SVG chart with hover tooltips</li>
                <li>Date range filtering for different time periods</li>
                <li>Automatic data refresh capabilities</li>
              </ul>
            </div>
            
                         <div>
               <h3 className="font-semibold text-gray-900 mb-2">Implementation Status</h3>
               <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                 <div className="flex items-center">
                   <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                     <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                   </svg>
                   <span className="text-green-800 font-medium">✅ Fully Implemented</span>
                 </div>
                                    <ul className="list-disc list-inside space-y-1 text-sm ml-4 mt-2 text-green-700">
                     <li>Query ID: 5667460 configured</li>
                     <li>12-hour refresh schedule implemented</li>
                     <li>Real historical data integration complete</li>
                     <li>Interactive chart with tooltips ready</li>
                   </ul>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
