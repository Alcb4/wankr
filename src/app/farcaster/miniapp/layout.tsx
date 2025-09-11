import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WANKR Mini App - Shame Economy",
  description: "Send shame tokens and verify authenticity on Base blockchain. Track shame history for digital identity verification.",
  openGraph: {
    title: "WANKR Mini App",
    description: "Send shame tokens and verify authenticity on Base blockchain",
    images: [
      {
        url: 'https://wankr-alpha.vercel.app/wankr-logo.svg',
        width: 1200,
        height: 1200,
        alt: 'WANKR Mini App',
        type: 'image/svg+xml',
      },
    ],
  },
  other: {
    // Farcaster Mini App meta tag - required for embed validation
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
};

export default function MiniAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}