const { ethers } = require('ethers')

// Net Protocol Contract Configuration
const NET_CONTRACT_ADDRESS = '0x0ada882dbbdc12388a1f9ca85d2d847088f747df'
const WANKR_ADDRESS = '0xa207C6E67ceA08641503947Ac05c65748bb9bB07'

// Net Protocol ABI for upvote functions
const NET_PROTOCOL_ABI = [
  'function upvoteCounts(address user) view returns (uint256)',
  'event Upvoted(address indexed user, address indexed token, uint256 numUpvotes)'
]

async function testNetProtocolEvents() {
  console.log('🔍 Testing Net Protocol Event Querying')
  console.log('=====================================')
  
  // Initialize provider and contract
  const provider = new ethers.JsonRpcProvider('https://mainnet.base.org')
  const netContract = new ethers.Contract(NET_CONTRACT_ADDRESS, NET_PROTOCOL_ABI, provider)
  
  try {
    console.log(`📋 Contract Address: ${NET_CONTRACT_ADDRESS}`)
    console.log(`🎯 Testing Address: ${WANKR_ADDRESS}`)
    console.log('')
    
    // Test current upvote count
    console.log('1️⃣ Testing current upvote count...')
    try {
      const upvoteCount = await netContract.upvoteCounts(WANKR_ADDRESS)
      console.log(`   ✅ Current upvote count: ${upvoteCount.toString()}`)
    } catch (error) {
      console.log(`   ❌ upvoteCounts error: ${error.message}`)
    }
    
    // Test event querying
    console.log('2️⃣ Testing Upvoted event query...')
    try {
      // Query all Upvoted events for the WANKR address
      const events = await netContract.queryFilter(
        netContract.filters.Upvoted(WANKR_ADDRESS),
        undefined, // fromBlock
        undefined  // toBlock
      )
      
      console.log(`   ✅ Found ${events.length} Upvoted events for WANKR address`)
      
      if (events.length > 0) {
        console.log('   📊 Sample events:')
        events.slice(0, 3).forEach((event, index) => {
          console.log(`      Event ${index + 1}:`)
          console.log(`        Block: ${event.blockNumber}`)
          console.log(`        User: ${event.args?.user}`)
          console.log(`        Token: ${event.args?.token}`)
          console.log(`        NumUpvotes: ${event.args?.numUpvotes?.toString()}`)
        })
      }
      
    } catch (error) {
      console.log(`   ❌ Event query error: ${error.message}`)
    }
    
    // Test event querying for all events (not filtered by user)
    console.log('3️⃣ Testing all Upvoted events...')
    try {
      const allEvents = await netContract.queryFilter(
        netContract.filters.Upvoted(),
        undefined, // fromBlock
        undefined  // toBlock
      )
      
      console.log(`   ✅ Found ${allEvents.length} total Upvoted events`)
      
      if (allEvents.length > 0) {
        console.log('   📊 Sample events:')
        allEvents.slice(0, 3).forEach((event, index) => {
          console.log(`      Event ${index + 1}:`)
          console.log(`        Block: ${event.blockNumber}`)
          console.log(`        User: ${event.args?.user}`)
          console.log(`        Token: ${event.args?.token}`)
          console.log(`        NumUpvotes: ${event.args?.numUpvotes?.toString()}`)
        })
      }
      
    } catch (error) {
      console.log(`   ❌ All events query error: ${error.message}`)
    }
    
    console.log('')
    console.log('📊 Summary:')
    console.log('   - upvoteCounts: Current total upvotes for the address')
    console.log('   - Upvoted events: Historical upvote events with timestamps')
    console.log('   - Event filtering: Can filter by user address or token address')
    
  } catch (error) {
    console.error('❌ General error:', error.message)
  }
}

// Run the test
testNetProtocolEvents().catch(console.error)
