const { ethers } = require('ethers')

// Net Protocol Contract Configuration
const NET_CONTRACT_ADDRESS = '0x0ada882dbbdc12388a1f9ca85d2d847088f747df'
const WANKR_ADDRESS = '0xa207C6E67ceA08641503947Ac05c65748bb9bB07'

// Net Protocol ABI for upvote functions
const NET_PROTOCOL_ABI = [
  'function upvoteCounts(address user) view returns (uint256)',
  'function getUpvotes(address user) view returns (uint256)',
  'function getUpvotesForTimeRange(address user, uint256 startTime, uint256 endTime) view returns (uint256)',
  'function getUpvoteHistory(address user, uint256 limit) view returns (tuple(uint256 timestamp, uint256 amount)[])',
  'event Upvote(address indexed user, uint256 amount, uint256 timestamp)'
]

async function testNetProtocol() {
  console.log('🔍 Testing Net Protocol Contract Functions')
  console.log('==========================================')
  
  // Initialize provider and contract
  const provider = new ethers.JsonRpcProvider('https://mainnet.base.org')
  const netContract = new ethers.Contract(NET_CONTRACT_ADDRESS, NET_PROTOCOL_ABI, provider)
  
  try {
    console.log(`📋 Contract Address: ${NET_CONTRACT_ADDRESS}`)
    console.log(`🎯 Testing Address: ${WANKR_ADDRESS}`)
    console.log('')
    
    // Test upvoteCounts function
    console.log('1️⃣ Testing upvoteCounts function...')
    try {
      const upvoteCount = await netContract.upvoteCounts(WANKR_ADDRESS)
      console.log(`   ✅ upvoteCounts: ${upvoteCount.toString()}`)
    } catch (error) {
      console.log(`   ❌ upvoteCounts error: ${error.message}`)
    }
    
    // Test getUpvotes function
    console.log('2️⃣ Testing getUpvotes function...')
    try {
      const totalUpvotes = await netContract.getUpvotes(WANKR_ADDRESS)
      console.log(`   ✅ getUpvotes: ${totalUpvotes.toString()}`)
    } catch (error) {
      console.log(`   ❌ getUpvotes error: ${error.message}`)
    }
    
    // Test getUpvotesForTimeRange function
    console.log('3️⃣ Testing getUpvotesForTimeRange function...')
    try {
      const now = Math.floor(Date.now() / 1000) // Current time in seconds
      const oneDayAgo = now - (24 * 60 * 60) // 24 hours ago
      const upvotesInRange = await netContract.getUpvotesForTimeRange(WANKR_ADDRESS, oneDayAgo, now)
      console.log(`   ✅ getUpvotesForTimeRange (last 24h): ${upvotesInRange.toString()}`)
    } catch (error) {
      console.log(`   ❌ getUpvotesForTimeRange error: ${error.message}`)
    }
    
    // Test getUpvoteHistory function
    console.log('4️⃣ Testing getUpvoteHistory function...')
    try {
      const history = await netContract.getUpvoteHistory(WANKR_ADDRESS, 10) // Last 10 upvotes
      console.log(`   ✅ getUpvoteHistory: ${history.length} entries`)
      if (history.length > 0) {
        console.log(`   📊 Latest upvote: ${history[0].amount.toString()} at ${new Date(Number(history[0].timestamp) * 1000).toISOString()}`)
      }
    } catch (error) {
      console.log(`   ❌ getUpvoteHistory error: ${error.message}`)
    }
    
    console.log('')
    console.log('📊 Summary:')
    console.log('   - upvoteCounts: Number of times the address has been upvoted')
    console.log('   - getUpvotes: Total upvote amount received by the address')
    console.log('   - getUpvotesForTimeRange: Upvotes received within a specific time range')
    console.log('   - getUpvoteHistory: Detailed history of upvotes with timestamps')
    
  } catch (error) {
    console.error('❌ General error:', error.message)
  }
}

// Run the test
testNetProtocol().catch(console.error)
