"use client"

import { useState } from 'react'
import { UpvoteChart } from '../components/UpvoteChart/UpvoteChart'

export default function UpvoteDemoPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [interval, setInterval] = useState<4 | 12 | 24>(24)
  
  // WANKR contract address
  const wankrAddress = '0xa207C6E67ceA08641503947Ac05c65748bb9bB07'
  
  // Calculate time range - use historical data
  const now = Date.now()
  const getStartTime = (range: string) => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
    return now - (days * 24 * 60 * 60 * 1000) // Go back in time
  }
  
  const getEndTime = (range: string) => {
    return now // End at current time
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Net Protocol Upvote Analytics
          </h1>
          <p className="text-gray-600 mb-6">
            Track cumulative upvotes for addresses over time using data from the Net Protocol contract.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Range
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Interval
              </label>
              <select
                value={interval}
                onChange={(e) => setInterval(Number(e.target.value) as 4 | 12 | 24)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value={4}>Every 4 hours</option>
                <option value={12}>Every 12 hours</option>
                <option value={24}>Every 24 hours</option>
              </select>
            </div>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-purple-900 mb-2">
              WANKR Contract Address
            </h3>
            <p className="text-purple-800 font-mono text-sm break-all">
              {wankrAddress}
            </p>
            <p className="text-purple-700 text-sm mt-2">
              This address is being tracked for upvote data from the Net Protocol contract.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Historical Upvotes Over Time
            </h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-yellow-800 text-sm font-medium">Simulated Data</span>
              </div>
            </div>
          </div>
          
          <UpvoteChart
            addresses={[wankrAddress]}
            startTime={getStartTime(timeRange)}
            endTime={getEndTime(timeRange)}
            interval={interval}
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
                This chart pulls data from the Net Protocol contract at{' '}
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                  0x0ada882dbbdc12388a1f9ca85d2d847088f747df
                </code>
                , specifically using the <code className="bg-gray-100 px-2 py-1 rounded text-sm">upvoteCounts</code> and{' '}
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">getUpvotes</code> functions.
              </p>
            </div>
            
                         <div>
               <h3 className="font-semibold text-gray-900 mb-2">Data Collection</h3>
               <p>
                 <strong>⚠️ Important:</strong> Due to RPC limitations, the system uses simulated growth patterns based on current upvote counts.
                 The chart shows growth from 80% to 100% of the current total (1,053,777 upvotes) with realistic variations.
                 This is <strong>not real historical data</strong> - it&apos;s a visualization to show the current upvote count in context.
               </p>
             </div>
            
                         <div>
               <h3 className="font-semibold text-gray-900 mb-2">Technical Details</h3>
               <ul className="list-disc list-inside space-y-1 text-sm">
                 <li>Uses ethers.js to interact with the Net Protocol contract</li>
                 <li>Implements caching to minimize blockchain calls</li>
                 <li>Responsive SVG-based chart with interactive tooltips</li>
                 <li>Hover over data points to see detailed information</li>
                 <li>No database required - all data comes from on-chain queries</li>
               </ul>
             </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">API Endpoints</h3>
              <p className="text-sm">
                <code className="bg-gray-100 px-2 py-1 rounded">
                  /api/net-protocol/upvotes?address=0x...&startTime=...&endTime=...&interval=24
                </code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
