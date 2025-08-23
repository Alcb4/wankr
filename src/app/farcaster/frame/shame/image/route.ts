// src/app/farcaster/frame/shame/image/route.ts

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const target = searchParams.get('target')
  const handle = searchParams.get('handle')
  
  // For now, return a simple SVG image
  // In the future, this could generate a dynamic image with the target info
  const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#1a1a1a"/>
  <rect x="50" y="50" width="1100" height="530" rx="20" fill="#2a2a2a" stroke="#3a3a3a" stroke-width="2"/>
  
  <!-- WANKR Logo/Title -->
  <text x="600" y="150" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="48" font-weight="bold">
    WANKR Shame Frame
  </text>
  
  <!-- Target Info -->
  <text x="600" y="250" text-anchor="middle" fill="#cccccc" font-family="Arial, sans-serif" font-size="24">
    Send shame to: ${handle ? `@${handle}` : target || 'Unknown User'}
  </text>
  
  <!-- Instructions -->
  <text x="600" y="350" text-anchor="middle" fill="#888888" font-family="Arial, sans-serif" font-size="18">
    Click to open WANKR Mini App
  </text>
  
  <!-- Decorative elements -->
  <circle cx="300" cy="200" r="50" fill="#ff6b6b" opacity="0.3"/>
  <circle cx="900" cy="400" r="40" fill="#4ecdc4" opacity="0.3"/>
  <circle cx="200" cy="450" r="30" fill="#45b7d1" opacity="0.3"/>
</svg>`

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}

