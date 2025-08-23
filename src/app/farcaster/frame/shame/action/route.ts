// src/app/farcaster/frame/shame/action/route.ts

import { NextRequest, NextResponse } from 'next/server'

interface FrameState {
  targetAddress?: string
  targetHandle?: string
  postId?: string
  castId?: string
  authorFid?: string
  context: 'frame' | 'standalone'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData()
    const buttonIndex = body.get('buttonIndex')
    const frameState = body.get('state')
    
    // Parse Frame state
    let context: FrameState | null = null
    if (frameState) {
      try {
        context = JSON.parse(decodeURIComponent(frameState as string)) as FrameState
      } catch (error) {
        console.error('Failed to parse frame state:', error)
      }
    }
    
    const { targetAddress, targetHandle, postId, castId, authorFid } = context || {}
    
    console.log('Frame action received:', {
      buttonIndex,
      targetAddress,
      targetHandle,
      postId,
      castId,
      authorFid,
      context: context?.context
    })

    // Get the base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://wankr-alpha.vercel.app'

    if (buttonIndex === '1') {
      // "Send Shame" button clicked - open quick shame Mini App with context
      const params = new URLSearchParams()
      if (targetAddress) params.append('target', targetAddress)
      if (targetHandle) params.append('handle', targetHandle)
      if (postId) params.append('postId', postId)
      if (castId) params.append('castId', castId)
      if (authorFid) params.append('authorFid', authorFid)
      params.append('context', 'frame')
      
      const redirectUrl = `${baseUrl}/farcaster/miniapp/shame?${params.toString()}`
      console.log('Redirecting to quick shame:', redirectUrl)
      return NextResponse.redirect(redirectUrl)
    } else if (buttonIndex === '2') {
      // "Open WANKR App" button clicked - open clean Mini App with context
      const params = new URLSearchParams()
      if (targetAddress) params.append('target', targetAddress)
      if (targetHandle) params.append('handle', targetHandle)
      if (postId) params.append('postId', postId)
      if (castId) params.append('castId', castId)
      if (authorFid) params.append('authorFid', authorFid)
      params.append('context', 'frame')
      
      const redirectUrl = `${baseUrl}/farcaster/miniapp/clean?${params.toString()}`
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

