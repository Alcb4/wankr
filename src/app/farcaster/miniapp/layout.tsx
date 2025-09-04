import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'WANKR Shame & Verification',
  description: 'Send shame tokens and verify authenticity on Base blockchain. Track shame history for digital identity verification.',
  openGraph: {
    title: 'WANKR Shame & Verification',
    description: 'Send shame tokens and verify authenticity on Base blockchain. Track shame history for digital identity verification.',
    images: [
      {
        url: 'https://wankr-alpha.vercel.app/wankr-logo.jpg',
        width: 1200,
        height: 630,
        alt: 'WANKR Shame & Verification',
      },
    ],
  },
  other: {
    'fc:miniapp': 'v1',
    'fc:miniapp:image': 'https://wankr-alpha.vercel.app/wankr-logo.jpg',
    'fc:miniapp:image:aspect_ratio': '1.91:1',
    'fc:miniapp:button:1': 'Open WANKR App',
    'fc:miniapp:action': 'https://wankr-alpha.vercel.app/farcaster/miniapp',
  },
}

export default function MiniAppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
