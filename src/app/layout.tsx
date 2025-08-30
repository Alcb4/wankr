import type { Metadata } from "next";
import "./globals.css";
import { Mouse_Memoirs } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";

const mouseMemoirs = Mouse_Memoirs({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-mouse-memoirs",
});

export const metadata: Metadata = {
  title: "WANKR - Shame-as-a-Service Token",
  description: "The world's first Shame-as-a-Service token. $WANKR - Send shame to anyone on Base, Farcaster, or X (Twitter).",
  keywords: ["WANKR", "crypto", "token", "Base", "Farcaster", "Twitter", "shame", "blockchain"],
  authors: [{ name: "WANKR Team" }],
  creator: "WANKR",
  publisher: "WANKR",
  robots: "index, follow",
  icons: {
    icon: '/wankr-icon.svg',
    apple: '/wankr-icon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://wankr-alpha.vercel.app',
    siteName: 'WANKR',
    title: 'WANKR - Shame-as-a-Service Token',
    description: 'The world\'s first Shame-as-a-Service token. $WANKR - Send shame to anyone on Base, Farcaster, or X (Twitter).',
          images: [
        {
          url: 'https://wankr-alpha.vercel.app/wankr-logo.jpg',
          width: 1200,
          height: 1200,
          alt: 'WANKR - Shame-as-a-Service Token',
          type: 'image/jpeg',
        },
      ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@wankergyatt',
    creator: '@wankergyatt',
    title: 'WANKR - Shame-as-a-Service Token',
    description: 'The world\'s first Shame-as-a-Service token. $WANKR - Send shame to anyone on Base, Farcaster, or X (Twitter).',
    images: ['https://wankr-alpha.vercel.app/wankr-logo.jpg'],
  },
  other: {
    'theme-color': '#7630D9',
    'msapplication-TileColor': '#7630D9',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'WANKR',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={mouseMemoirs.variable} suppressHydrationWarning>
      <head>
        <link rel="preload" href="/wankr-icon.svg" as="image" type="image/svg+xml" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/svg+xml" href="/wankr-icon.svg" />
        <link rel="shortcut icon" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/wankr-icon.svg" />
        <meta name="msapplication-TileColor" content="#7630D9" />
        <meta name="theme-color" content="#7630D9" />
        <link rel="preconnect" href="https://auth.farcaster.xyz" />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
