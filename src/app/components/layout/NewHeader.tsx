"use client"

import { CompactWalletConnect } from '../Wallet/CompactWalletConnect'
import { ThemeToggle } from '../ui/theme-toggle'

export function NewHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/20 shadow-xl" 
            style={{
              background: 'rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
            }}>
      <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {/* WANKR Logo */}
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-lg">
              <img src="/wankr-icon.svg" alt="WANKR" className="w-5 h-5" />
            </div>
            <span className="font-wankr text-2xl text-primary">WANKR</span>
          </div>
          {/* Navigation */}
          <nav className="hidden sm:flex items-center space-x-4 md:space-x-6 ml-4 md:ml-8">
            <a href="#shame-feed" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200">Shame Feed</a>
            <a href="#send-shame" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200">Send Shame</a>
            <a href="#leaderboard" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200">Leaderboard</a>
            <a href="#upvotes" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200">Upvotes</a>
          </nav>
        </div>
        {/* Wallet Connect - Compact */}
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          <CompactWalletConnect />
        </div>
      </div>
    </header>
  )
}
