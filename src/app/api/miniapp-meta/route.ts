import { NextResponse } from 'next/server'

export async function GET() {
  const metaTags = {
    'fc:miniapp': JSON.stringify({
      version: "1",
      imageUrl: "https://wankr-alpha.vercel.app/wankr-logo-splash.png",
      button: {
        title: "Open WANKR",
        action: {
          type: "launch_frame",
          name: "WANKR",
          url: "https://wankr-alpha.vercel.app/farcaster/miniapp",
          splashImageUrl: "https://wankr-alpha.vercel.app/wankr-logo-splash.png",
          splashBackgroundColor: "#1e1b4b"
        }
      }
    })
  }

  return NextResponse.json(metaTags)
}
