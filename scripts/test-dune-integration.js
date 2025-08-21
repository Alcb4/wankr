const { DuneClient } = require('@duneanalytics/client-sdk')

async function testDuneIntegration() {
  console.log('🔍 Testing Dune Integration')
  console.log('==========================')
  
  try {
    // Initialize Dune client
    const dune = new DuneClient(process.env.DUNE_API_KEY || '')
    
    console.log('📋 Query ID: 5667460')
    console.log('🔑 API Key:', process.env.DUNE_API_KEY ? '✅ Set' : '❌ Missing')
    
    if (!process.env.DUNE_API_KEY) {
      console.log('⚠️  Please set DUNE_API_KEY environment variable')
      return
    }
    
    // Test the query
    console.log('🔍 Fetching data from Dune...')
    const query_result = await dune.getLatestResult({queryId: 5667460})
    
    console.log('✅ Query executed successfully!')
    console.log('📊 Results:')
    console.log(`   - Has result: ${!!query_result.result}`)
    console.log(`   - Has rows: ${!!query_result.result?.rows}`)
    console.log(`   - Row count: ${query_result.result?.rows?.length || 0}`)
    
    if (query_result.result?.rows && query_result.result.rows.length > 0) {
      console.log('📈 Sample data:')
      const sampleRows = query_result.result.rows.slice(0, 3)
      sampleRows.forEach((row, index) => {
        console.log(`   Row ${index + 1}:`, row)
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Run the test
testDuneIntegration().catch(console.error)
