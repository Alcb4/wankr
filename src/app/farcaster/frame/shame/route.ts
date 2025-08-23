// src/app/farcaster/frame/shame/route.ts

import { NextRequest, NextResponse } from 'next/server'

interface FarcasterFrameContext {
  postId?: string
  castId?: string
  authorFid?: string
  authorHandle?: string
  authorAddress?: string
}

interface FrameState {
  targetAddress?: string
  targetHandle?: string
  postId?: string
  castId?: string
  authorFid?: string
  context: 'frame' | 'standalone'
}

/**
 * Extract Farcaster context from Frame request
 * Farcaster passes context via headers and body parameters
 */
function extractFarcasterContext(request: NextRequest): FarcasterFrameContext {
  const context: FarcasterFrameContext = {}
  
  // Extract from URL parameters (if passed manually)
  const { searchParams } = new URL(request.url)
  context.postId = searchParams.get('postId') || undefined
  context.castId = searchParams.get('castId') || undefined
  
  // Extract from headers (Farcaster-specific headers)
  const farcasterPostId = request.headers.get('x-farcaster-post-id')
  const farcasterCastId = request.headers.get('x-farcaster-cast-id')
  const farcasterAuthorFid = request.headers.get('x-farcaster-author-fid')
  const farcasterAuthorHandle = request.headers.get('x-farcaster-author-handle')
  const farcasterAuthorAddress = request.headers.get('x-farcaster-author-address')
  
  // Use header values if available, otherwise fall back to URL params
  context.postId = farcasterPostId || context.postId
  context.castId = farcasterCastId || context.castId
  context.authorFid = farcasterAuthorFid || undefined
  context.authorHandle = farcasterAuthorHandle || undefined
  context.authorAddress = farcasterAuthorAddress || undefined
  
  return context
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const manualTarget = searchParams.get('target')
  
  // Extract Farcaster context
  const farcasterContext = extractFarcasterContext(request)
  
  // Determine target: prefer manual target, then Farcaster context
  const targetAddress = manualTarget || farcasterContext.authorAddress
  const targetHandle = farcasterContext.authorHandle
  
  // Get base URL for Frame
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://wankr-alpha.vercel.app'
  
  // Create state to pass to action
  const frameState: FrameState = {
    targetAddress,
    targetHandle,
    postId: farcasterContext.postId,
    castId: farcasterContext.castId,
    authorFid: farcasterContext.authorFid,
    context: 'frame'
  }
  
  // Encode state for Frame
  const encodedState = encodeURIComponent(JSON.stringify(frameState))
  
  // Frame HTML with context-aware shame interface
  const frameHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content="${baseUrl}/api/frame/shame/image?target=${targetAddress}&handle=${targetHandle}" />
  <meta property="fc:frame:button:1" content="Send Shame to ${targetHandle ? `@${targetHandle}` : 'User'}" />
  <meta property="fc:frame:button:2" content="Open WANKR App" />
  <meta property="fc:frame:post_url" content="${baseUrl}/api/frame/shame/action" />
  <meta property="fc:frame:state" content="${encodedState}" />
  <title>WANKR Shame Frame</title>
</head>
<body>
  <h1>WANKR Shame Frame</h1>
  <p>Quick shame for ${targetHandle ? `@${targetHandle}` : targetAddress || 'unknown user'}</p>
  ${farcasterContext.postId ? `<p>Post ID: ${farcasterContext.postId}</p>` : ''}
</body>
</html>`

  return new NextResponse(frameHtml, {
    headers: {
      'Content-Type': 'text/html',
    },
  })
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
