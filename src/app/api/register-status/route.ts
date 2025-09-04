import { NextRequest, NextResponse } from 'next/server'
import { RegisterService } from '../../../../src/server/services/register'
import { CheckRegisterService } from '../../../../src/server/services/checkRegister'

export async function GET(_request: NextRequest) {
  try {
    const registerService = new RegisterService()
    const checkRegisterService = new CheckRegisterService(registerService)
    
    // Get register statistics
    const stats = registerService.getRegisterStats()
    
    // Get all entries in the register (for debugging)
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
      '0x45932054e758a51a421646f07428841a19a45d40',
      '0xfbd29b4390348711a3dbed30742a4de57bf4a867',
      '0x62e671157dd455e13d10dcbc6cd0a8db458abd6a',
      '0x7a6830F0dED43e8add420b06b41a8336b84c3804', // From logs
      '0x5d042BF1f68074D31A03733640AC9684f7366A3A'  // From logs
    ]
    
    const testResults = testAddresses.map(address => ({
      address,
      inRegister: checkRegisterService.checkRegister(address) !== null,
      entry: checkRegisterService.checkRegister(address)
    }))
    
    return NextResponse.json({
      registerStats: stats,
      totalEntries: allEntries.length,
      allEntries,
      testResults,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error checking register status:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to check register status',
        registerStats: null,
        totalEntries: 0,
        allEntries: [],
        testResults: [],
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
