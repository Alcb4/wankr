// src/app/farcaster/frame/shame/image/route.ts

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const target = searchParams.get('target')
  
  // For now, return a simple SVG image
  // In production, you'd want to generate a proper image with the target info
  const svg = `
<svg width="600" height="315" viewBox="0 0 600 315" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="600" height="315" fill="#1a1a1a"/>
  <rect x="20" y="20" width="560" height="275" rx="12" fill="#2a2a2a" stroke="#3a3a3a" stroke-width="2"/>
  
  <!-- WANKR Logo/Text -->
  <text x="300" y="80" text-anchor="middle" fill="#ff6b6b" font-family="Arial, sans-serif" font-size="32" font-weight="bold">WANKR</text>
  
  <!-- Shame Message -->
  <text x="300" y="120" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="18">Quick Shame</text>
  
  <!-- Target Info -->
  <text x="300" y="160" text-anchor="middle" fill="#cccccc" font-family="Arial, sans-serif" font-size="14">Target: ${target ? target.slice(0, 6) + '...' + target.slice(-4) : 'Unknown'}</text>
  
  <!-- Instructions -->
  <text x="300" y="200" text-anchor="middle" fill="#888888" font-family="Arial, sans-serif" font-size="12">Click to send shame</text>
  
  <!-- Decorative elements -->
  <circle cx="150" cy="80" r="8" fill="#ff6b6b" opacity="0.6"/>
  <circle cx="450" cy="80" r="8" fill="#ff6b6b" opacity="0.6"/>
  <circle cx="150" cy="240" r="6" fill="#ff6b6b" opacity="0.4"/>
  <circle cx="450" cy="240" r="6" fill="#ff6b6b" opacity="0.4"/>
</svg>`

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}

