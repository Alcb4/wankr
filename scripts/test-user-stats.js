// scripts/test-user-stats.js

const { DuneClient, QueryParameter } = require('@duneanalytics/client-sdk');

async function testUserStats() {
  const apiKey = process.env.DUNE_API_KEY;
  if (!apiKey) {
    console.error('❌ DUNE_API_KEY environment variable is required');
    process.exit(1);
  }

  const client = new DuneClient(apiKey);
  
  // Test with a known address that has transactions
  const testAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'; // Demo address from the app
  
  console.log(`🔍 Testing user stats for address: ${testAddress}`);
  
  try {
    // Test user transactions query
    console.log('\n📊 Testing user transactions query...');
    const transactionsResult = await client.runQuery({
      queryId: 5684382, // USER_TRANSACTIONS_QUERY_ID
      query_parameters: [
        QueryParameter.text("user_address", testAddress)
      ]
    });
    
    console.log('✅ User transactions query result:', {
      hasResult: !!transactionsResult.result,
      hasRows: !!transactionsResult.result?.rows,
      rowCount: transactionsResult.result?.rows?.length || 0,
      firstRow: transactionsResult.result?.rows?.[0] || null
    });
    
    // Test user stats query
    console.log('\n📊 Testing user stats query...');
    const statsResult = await client.runQuery({
      queryId: 5684552, // USER_STATS_QUERY_ID
      query_parameters: [
        QueryParameter.text("user_address", testAddress)
      ]
    });
    
    console.log('✅ User stats query result:', {
      hasResult: !!statsResult.result,
      hasRows: !!statsResult.result?.rows,
      rowCount: statsResult.result?.rows?.length || 0,
      firstRow: statsResult.result?.rows?.[0] || null
    });
    
    // Test API endpoint
    console.log('\n🌐 Testing API endpoint...');
    const response = await fetch(`http://localhost:3000/api/user-stats/${testAddress}`);
    const apiData = await response.json();
    
    console.log('✅ API endpoint result:', {
      status: response.status,
      hasData: !!apiData,
      shameScore: apiData.shameScore,
      totalShamesSent: apiData.totalShamesSent,
      totalShamesReceived: apiData.totalShamesReceived,
      transactionCount: apiData.transactionCount
    });
    
  } catch (error) {
    console.error('❌ Error testing user stats:', error);
  }
}

testUserStats();
