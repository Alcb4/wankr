import { NextRequest, NextResponse } from 'next/server'
import { HandleResolutionService } from '../../../server/services/handleResolutionService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { addresses } = body
    
    if (!addresses || !Array.isArray(addresses)) {
      return NextResponse.json(
        { error: 'Addresses array is required' },
        { status: 400 }
      )
    }
    
    const handleResolutionService = new HandleResolutionService()
    const result = await handleResolutionService.resolveHandlesBulk(addresses)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error resolving handles:', error)
    return NextResponse.json(
      { error: 'Failed to resolve handles' },
      { status: 500 }
    )
  }
}
