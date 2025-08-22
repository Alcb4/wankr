"use client"

import { ReactNode } from 'react'
import { MobileNavigation } from './MobileNavigation'

interface MobileLayoutProps {
  children: ReactNode
  showNavigation?: boolean
}

export function MobileLayout({ children, showNavigation = true }: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Main content with bottom padding for mobile navigation */}
      <div className={`pb-20 ${showNavigation ? 'pb-20' : 'pb-4'}`}>
        {children}
      </div>
      
      {/* Mobile Navigation */}
      {showNavigation && <MobileNavigation />}
    </div>
  )
}

// Mobile-specific utility components
export function MobileCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border/50 shadow-lg ${className}`}>
      {children}
    </div>
  )
}

export function MobileSection({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`px-4 py-4 space-y-4 ${className}`}>
      {children}
    </section>
  )
}

export function MobileGrid({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`grid grid-cols-1 gap-4 ${className}`}>
      {children}
    </div>
  )
}

export function MobileButton({ 
  children, 
  onClick, 
  variant = 'primary',
  className = '',
  disabled = false 
}: { 
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'outline'
  className?: string
  disabled?: boolean
}) {
  const baseClasses = "w-full py-4 px-6 rounded-xl font-semibold text-base transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
  
  const variantClasses = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "border-2 border-primary text-primary hover:bg-primary/10"
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
