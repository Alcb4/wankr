import { NextRequest, NextResponse } from 'next/server'
import { LeaderboardService } from '../../../../src/server/services/leaderboardService'
import { RegisterService } from '../../../../src/server/services/register'
import { CheckRegisterService } from '../../../../src/server/services/checkRegister'
import { HandleResolutionService } from '../../../../src/server/services/handleResolutionService'

export async function GET(_request: NextRequest) {
  try {
    console.log('🧪 Testing leaderboard register population...')
    
    // Create services with shared register instance
    const registerService = new RegisterService()
    const checkRegisterService = new CheckRegisterService(registerService)
    const leaderboardService = new LeaderboardService(
      new HandleResolutionService(checkRegisterService, registerService)
    )
    
    // Get initial register stats
    const initialStats = registerService.getRegisterStats()
    console.log('📊 Initial register stats:', initialStats)
    
    // Load leaderboards (this should populate the register)
    console.log('🏆 Loading leaderboards...')
    const leaderboards = await leaderboardService.getLeaderboards('all')
    console.log(`✅ Loaded leaderboards: ${leaderboards.received.length} received, ${leaderboards.sent.length} sent`)
    
    // Get final register stats
    const finalStats = registerService.getRegisterStats()
    console.log('📊 Final register stats:', finalStats)
    
    // Get all entries in the register
    const allEntries = Array.from(registerService['register'].entries()).map(([address, entry]) => ({
      address,
      displayName: entry.displayName,
      source: entry.source,
      lastUpdated: new Date(entry.lastUpdated).toISOString(),
      refreshDue: new Date(entry.refreshDue).toISOString(),
      isExpired: Date.now() >= entry.refreshDue
    }))
    
    // Test some addresses that should be in the register
    const testAddresses = [
      '0x7a6830F0dED43e8add420b06b41a8336b84c3804', // From logs
      '0x5d042BF1f68074D31A03733640AC9684f7366A3A',  // From logs
      '0x62e671157dd455e13d10dcbc6cd0a8db458abd6a'   // Should be in register
    ]
    
    const testResults = testAddresses.map(address => ({
      address,
      inRegister: checkRegisterService.checkRegister(address) !== null,
      entry: checkRegisterService.checkRegister(address)
    }))
    
    return NextResponse.json({
      initialStats,
      finalStats,
      leaderboardCounts: {
        received: leaderboards.received.length,
        sent: leaderboards.sent.length
      },
      totalEntries: allEntries.length,
      allEntries,
      testResults,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error testing leaderboard register:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to test leaderboard register',
        initialStats: null,
        finalStats: null,
        leaderboardCounts: { received: 0, sent: 0 },
        totalEntries: 0,
        allEntries: [],
        testResults: [],
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
