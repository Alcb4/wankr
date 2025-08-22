import { NextRequest, NextResponse } from 'next/server'
import { RegisterService } from '../../../../src/server/services/register'
import { CheckRegisterService } from '../../../../src/server/services/checkRegister'
import { HandleResolutionService } from '../../../../src/server/services/handleResolutionService'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Generating handle resolution statistics...')
    
    // Create services with shared instances
    const registerService = new RegisterService()
    const checkRegisterService = new CheckRegisterService(registerService)
    const handleResolutionService = new HandleResolutionService(checkRegisterService, registerService)
    
    // Get comprehensive statistics
    const serviceStats = handleResolutionService.getServiceStats()
    const registerStats = registerService.getRegisterStats()
    
    // Get entries needing refresh
    const entriesNeedingRefresh = registerService.getEntriesNeedingRefresh()
    
    // Test some addresses to see current resolution status
    const testAddresses = [
      '0x7a6830F0dED43e8add420b06b41a8336b84c3804',
      '0x5d042BF1f68074D31A03733640AC9684f7366A3A',
      '0x62e671157dd455e13d10dcbc6cd0a8db458abd6a'
    ]
    
    const testResults = testAddresses.map(address => {
      const registerEntry = checkRegisterService.checkRegister(address)
      return {
        address,
        inRegister: registerEntry !== null,
        source: registerEntry?.source || 'none',
        accessCount: registerEntry?.accessCount || 0,
        errorCount: registerEntry?.errorCount || 0,
        lastAccessed: registerEntry?.lastAccessed ? new Date(registerEntry.lastAccessed).toISOString() : null,
        expiresAt: registerEntry?.refreshDue ? new Date(registerEntry.refreshDue).toISOString() : null
      }
    })
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      serviceStats,
      registerStats,
      entriesNeedingRefresh: {
        count: entriesNeedingRefresh.length,
        addresses: entriesNeedingRefresh.slice(0, 10) // Show first 10
      },
      testResults,
      recommendations: {
        highAccessEntries: registerStats.highAccessEntries > 10 ? 
          'Consider reducing TTL for high-access entries' : 'Access patterns look normal',
        errorProneEntries: registerStats.errorProneEntries > 5 ? 
          'Some entries have high error rates - check API health' : 'Error rates are acceptable',
        cacheEfficiency: serviceStats.cacheSize > 100 ? 
          'Cache size is large - consider cleanup' : 'Cache size is optimal'
      }
    })

  } catch (error) {
    console.error('❌ Error generating handle resolution stats:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate statistics',
        timestamp: new Date().toISOString(),
        serviceStats: null,
        registerStats: null,
        entriesNeedingRefresh: { count: 0, addresses: [] },
        testResults: [],
        recommendations: {}
      },
      { status: 500 }
    )
  }
}
