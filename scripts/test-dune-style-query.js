const { ethers } = require('ethers')

// Net Protocol Contract Configuration
const NET_CONTRACT_ADDRESS = '0x0ada882dbbdc12388a1f9ca85d2d847088f747df'
const WANKR_ADDRESS = '0xa207C6E67ceA08641503947Ac05c65748bb9bB07'

// Net Protocol ABI for upvote functions
const NET_PROTOCOL_ABI = [
  'function upvoteCounts(address user) view returns (uint256)',
  'event Upvoted(address indexed user, address indexed token, uint256 numUpvotes)'
]

async function testHistoricalData() {
  console.log('🔍 Testing Historical Upvote Data Access')
  console.log('========================================')
  
  // Initialize provider and contract
  const provider = new ethers.JsonRpcProvider('https://mainnet.base.org')
  const netContract = new ethers.Contract(NET_CONTRACT_ADDRESS, NET_PROTOCOL_ABI, provider)
  
  try {
    console.log(`📋 Contract Address: ${NET_CONTRACT_ADDRESS}`)
    console.log(`🎯 Testing Address: ${WANKR_ADDRESS}`)
    console.log('')
    
    // Test current upvote count
    console.log('1️⃣ Current upvote count...')
    try {
      const upvoteCount = await netContract.upvoteCounts(WANKR_ADDRESS)
      console.log(`   ✅ Current upvote count: ${upvoteCount.toString()}`)
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`)
    }
    
    // Test different block ranges for events
    console.log('2️⃣ Testing event queries with different block ranges...')
    
    const currentBlock = await provider.getBlockNumber()
    console.log(`   📊 Current block: ${currentBlock}`)
    
    // Try different block ranges
    const ranges = [
      { name: 'Last 100 blocks', from: currentBlock - 100, to: currentBlock },
      { name: 'Last 1000 blocks', from: currentBlock - 1000, to: currentBlock },
      { name: 'Last 10000 blocks', from: currentBlock - 10000, to: currentBlock },
      { name: 'Last 50000 blocks', from: currentBlock - 50000, to: currentBlock }
    ]
    
    for (const range of ranges) {
      try {
        console.log(`   🔍 ${range.name} (${range.from} to ${range.to})...`)
        
        const events = await netContract.queryFilter(
          netContract.filters.Upvoted(WANKR_ADDRESS),
          range.from,
          range.to
        )
        
        console.log(`      ✅ Found ${events.length} events`)
        
        if (events.length > 0) {
          console.log(`      📊 Sample event:`)
          const event = events[0]
          console.log(`         Block: ${event.blockNumber}`)
          console.log(`         User: ${event.args?.user}`)
          console.log(`         Token: ${event.args?.token}`)
          console.log(`         NumUpvotes: ${event.args?.numUpvotes?.toString()}`)
        }
        
      } catch (error) {
        console.log(`      ❌ Error: ${error.message}`)
      }
    }
    
    // Test querying all events (not filtered by user)
    console.log('3️⃣ Testing all Upvoted events (last 1000 blocks)...')
    try {
      const allEvents = await netContract.queryFilter(
        netContract.filters.Upvoted(),
        currentBlock - 1000,
        currentBlock
      )
      
      console.log(`   ✅ Found ${allEvents.length} total events`)
      
      // Look for events involving WANKR address
      const wankrEvents = allEvents.filter(event => 
        event.args?.token?.toLowerCase() === WANKR_ADDRESS.toLowerCase()
      )
      
      console.log(`   🎯 Found ${wankrEvents.length} events for WANKR token`)
      
      if (wankrEvents.length > 0) {
        console.log(`   📊 Sample WANKR event:`)
        const event = wankrEvents[0]
        console.log(`      Block: ${event.blockNumber}`)
        console.log(`      User: ${event.args?.user}`)
        console.log(`      Token: ${event.args?.token}`)
        console.log(`      NumUpvotes: ${event.args?.numUpvotes?.toString()}`)
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`)
    }
    
    // Test alternative RPC endpoints
    console.log('4️⃣ Testing alternative RPC endpoints...')
    
    const rpcEndpoints = [
      'https://mainnet.base.org',
      'https://base.blockpi.network/v1/rpc/public',
      'https://1rpc.io/base'
    ]
    
    for (const rpcUrl of rpcEndpoints) {
      try {
        console.log(`   🔍 Testing ${rpcUrl}...`)
        const altProvider = new ethers.JsonRpcProvider(rpcUrl)
        const altContract = new ethers.Contract(NET_CONTRACT_ADDRESS, NET_PROTOCOL_ABI, altProvider)
        
        const events = await altContract.queryFilter(
          altContract.filters.Upvoted(WANKR_ADDRESS),
          currentBlock - 1000,
          currentBlock
        )
        
        console.log(`      ✅ Found ${events.length} events`)
        
      } catch (error) {
        console.log(`      ❌ Error: ${error.message}`)
      }
    }
    
  } catch (error) {
    console.error('❌ General error:', error.message)
  }
}

// Run the test
testHistoricalData().catch(console.error)
