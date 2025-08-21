import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { transaction } = await request.json()
    
    // Emit the handle resolution update to the enhanced shame feed service
    const { enhancedShameFeedService } = await import('../../services/enhancedShameFeedService')
    enhancedShameFeedService.emitHandleUpdate(transaction)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error emitting handle resolution update:', error)
    return NextResponse.json({ success: false, error: 'Failed to emit update' })
  }
}
