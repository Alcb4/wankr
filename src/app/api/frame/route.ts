import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const targetAddress = searchParams.get('target')
  const targetHandle = searchParams.get('handle')
  const postId = searchParams.get('postId')
  const castId = searchParams.get('castId')
  const authorFid = searchParams.get('authorFid')

  // Build the Mini App URL with context
  const miniappUrl = new URL('/farcaster/miniapp', request.url)
  if (targetAddress) miniappUrl.searchParams.set('target', targetAddress)
  if (targetHandle) miniappUrl.searchParams.set('handle', targetHandle)
  if (postId) miniappUrl.searchParams.set('postId', postId)
  if (castId) miniappUrl.searchParams.set('castId', castId)
  if (authorFid) miniappUrl.searchParams.set('authorFid', authorFid)
  miniappUrl.searchParams.set('context', 'frame')

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  
  <!-- Farcaster Frame Meta Tags -->
  <meta property="fc:frame" content="vNext">
  <meta property="fc:frame:image" content="https://wankr-alpha.vercel.app/wankr-logo.jpg">
  <meta property="fc:frame:image:aspect_ratio" content="1.91:1">
  <meta property="fc:frame:button:1" content="Open WANKR App">
  <meta property="fc:frame:post_url" content="${miniappUrl.toString()}">
  
  <!-- Open Graph Meta Tags -->
  <meta property="og:title" content="WANKR Shame & Verification">
  <meta property="og:description" content="Send shame tokens and verify authenticity on Base blockchain. Track shame history for digital identity verification.">
  <meta property="og:image" content="https://wankr-alpha.vercel.app/wankr-logo.jpg">
  <meta property="og:url" content="${miniappUrl.toString()}">
  
  <title>WANKR Shame & Verification</title>
  
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    
    .logo {
      width: 120px;
      height: 120px;
      border-radius: 20px;
      margin-bottom: 20px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    }
    
    h1 {
      font-size: 2.5rem;
      margin: 0 0 10px 0;
      font-weight: 700;
    }
    
    p {
      font-size: 1.2rem;
      margin: 0 0 30px 0;
      opacity: 0.9;
      max-width: 500px;
      line-height: 1.5;
    }
    
    .button {
      background: rgba(255,255,255,0.2);
      border: 2px solid rgba(255,255,255,0.3);
      color: white;
      padding: 15px 30px;
      border-radius: 50px;
      font-size: 1.1rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
    }
    
    .button:hover {
      background: rgba(255,255,255,0.3);
      border-color: rgba(255,255,255,0.5);
      transform: translateY(-2px);
    }
    
    .stats {
      display: flex;
      gap: 30px;
      margin-top: 30px;
      flex-wrap: wrap;
      justify-content: center;
    }
    
    .stat {
      background: rgba(255,255,255,0.1);
      padding: 20px;
      border-radius: 15px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.2);
    }
    
    .stat-number {
      font-size: 2rem;
      font-weight: 700;
      margin: 0;
    }
    
    .stat-label {
      font-size: 0.9rem;
      opacity: 0.8;
      margin: 5px 0 0 0;
    }
  </style>
</head>
<body>
  <img src="/wankr-logo.jpg" alt="WANKR Logo" class="logo">
  <h1>WANKR</h1>
  <p>Send shame tokens and verify authenticity on Base blockchain. Track shame history for digital identity verification.</p>
  
  <a href="${miniappUrl.toString()}" class="button">Open WANKR App</a>
  
  <div class="stats">
    <div class="stat">
      <div class="stat-number">Base</div>
      <div class="stat-label">Blockchain</div>
    </div>
    <div class="stat">
      <div class="stat-number">Shame</div>
      <div class="stat-label">Verification</div>
    </div>
    <div class="stat">
      <div class="stat-number">Social</div>
      <div class="stat-label">Identity</div>
    </div>
  </div>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  })
}

export async function POST(request: NextRequest) {
  // Handle Frame button interactions
  const formData = await request.formData()
  const buttonIndex = formData.get('buttonIndex')
  
  // Redirect to the Mini App with frame context
  const miniappUrl = new URL('/farcaster/miniapp', request.url)
  miniappUrl.searchParams.set('context', 'frame')
  
  return NextResponse.redirect(miniappUrl.toString())
}
