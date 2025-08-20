import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Mouse_Memoirs } from "next/font/google";
import "./globals.css";
import '@coinbase/onchainkit/styles.css';
import { Providers } from './providers';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const mouseMemoirs = Mouse_Memoirs({
  variable: "--font-mouse-memoirs",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "WANKR - Shame-as-a-Service Token",
  description: "$WANKR is the world's first Shame-as-a-Service token. Experience the Wankr aesthetic.",
  keywords: ["WANKR", "crypto", "token", "shame", "blockchain", "web3"],
  authors: [{ name: "Wankr Team" }],
  openGraph: {
    title: "WANKR - Shame-as-a-Service Token",
    description: "$WANKR is the world's first Shame-as-a-Service token.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WANKR - Shame-as-a-Service Token",
    description: "$WANKR is the world's first Shame-as-a-Service token.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${mouseMemoirs.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
