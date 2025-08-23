// src/app/farcaster/frame/shame/route.ts

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const targetAddress = searchParams.get('target')
  const postId = searchParams.get('postId')
  
  // Get base URL for Frame
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://wankr-alpha.vercel.app'
  
  // Frame HTML with quick shame interface
  const frameHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content="${baseUrl}/api/frame/shame/image?target=${targetAddress}" />
  <meta property="fc:frame:button:1" content="Send Shame" />
  <meta property="fc:frame:button:2" content="View in WANKR App" />
  <meta property="fc:frame:post_url" content="${baseUrl}/api/frame/shame/action" />
  <title>WANKR Shame Frame</title>
</head>
<body>
  <h1>WANKR Shame Frame</h1>
  <p>Quick shame for ${targetAddress}</p>
</body>
</html>`

  return new NextResponse(frameHtml, {
    headers: {
      'Content-Type': 'text/html',
    },
  })
}

export async function POST(request: NextRequest) {
  const body = await request.formData()
  const buttonIndex = body.get('buttonIndex')
  const targetAddress = body.get('target')
  
  if (buttonIndex === '1') {
    // "Send Shame" button clicked - open Mini App
    return NextResponse.redirect(`https://wankr.xyz/farcaster/miniapp/shame?target=${targetAddress}`)
  } else if (buttonIndex === '2') {
    // "View in WANKR App" button clicked - open standalone Mini App
    return NextResponse.redirect(`https://wankr.xyz/farcaster/miniapp?target=${targetAddress}`)
  }
  
  // Default response
  return new NextResponse('Invalid action', { status: 400 })
}
