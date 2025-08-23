// src/app/farcaster/frame/shame/action/route.ts

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData()
    const buttonIndex = body.get('buttonIndex')
    const targetAddress = body.get('target')
    const postId = body.get('postId')
    
    console.log('Frame action received:', {
      buttonIndex,
      targetAddress,
      postId
    })

    // Get the base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://wankr-alpha.vercel.app'

    if (buttonIndex === '1') {
      // "Send Shame" button clicked - open quick shame Mini App
      const redirectUrl = `${baseUrl}/farcaster/miniapp/shame?target=${targetAddress}`
      console.log('Redirecting to quick shame:', redirectUrl)
      return NextResponse.redirect(redirectUrl)
    } else if (buttonIndex === '2') {
      // "View in WANKR App" button clicked - open clean Mini App
      const redirectUrl = `${baseUrl}/farcaster/miniapp/clean?target=${targetAddress}`
      console.log('Redirecting to clean app:', redirectUrl)
      return NextResponse.redirect(redirectUrl)
    }
    
    // Default response for invalid button
    return new NextResponse('Invalid action', { status: 400 })
    
  } catch (error) {
    console.error('Frame action error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

