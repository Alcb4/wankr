import { NextRequest, NextResponse } from 'next/server'
import { broadcastUpdate, getConnectionStats } from '../realtime/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data, subscriptions } = body

    if (!type) {
      return NextResponse.json(
        { error: 'Type is required' },
        { status: 400 }
      )
    }

    // Broadcast the update to all connected clients
    broadcastUpdate(type, data || {}, subscriptions)

    return NextResponse.json({
      success: true,
      message: `Broadcasted ${type} update to all connected clients`,
      timestamp: Date.now()
    })

  } catch (error) {
    console.error('❌ Error broadcasting real-time update:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to broadcast update',
        timestamp: Date.now()
      },
      { status: 500 }
    )
  }
}

export async function GET(_request: NextRequest) {
  try {
    const stats = getConnectionStats()

    return NextResponse.json({
      stats,
      timestamp: Date.now(),
      message: 'Real-time connection statistics'
    })

  } catch (error) {
    console.error('❌ Error getting real-time stats:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to get stats',
        timestamp: Date.now()
      },
      { status: 500 }
    )
  }
}
