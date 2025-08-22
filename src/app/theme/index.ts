// Centralized Design System for WANKR
// This file serves as the single source of truth for all styling

import { colors } from './colors'
import { spacing } from './spacing'

// Design Tokens
export const tokens = {
  colors,
  spacing,
  
  // Typography
  typography: {
    fontFamily: {
      sans: 'var(--font-geist-sans)',
      mono: 'var(--font-geist-mono)',
      wankr: 'var(--font-mouse-memoirs)',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
  },
  
  // Border Radius
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  },
  
  // Transitions
  transitions: {
    fast: '150ms ease-in-out',
    normal: '300ms ease-in-out',
    slow: '500ms ease-in-out',
  },
} as const

// Component-Specific Styles
export const components = {
  // Button Variants
  button: {
    primary: 'bg-gradient-cta text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105',
    secondary: 'border border-white text-white px-6 py-3 rounded-xl font-semibold hover:bg-muted/80 transition-all duration-300',
    accent: 'bg-gradient-to-r from-accent to-secondary text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105',
    outline: 'border border-cyber text-cyber px-6 py-3 rounded-xl font-semibold hover:bg-cyber hover:text-white transition-all duration-300',
    danger: 'bg-destructive text-destructive-foreground px-6 py-3 rounded-xl font-semibold hover:bg-destructive/90 transition-all duration-300',
    disabled: 'opacity-60 cursor-not-allowed hover:scale-100',
  },
  
  // Input Variants
  input: {
    base: 'p-3 border border-border rounded-lg bg-input text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200',
    error: 'border-destructive focus:ring-destructive',
  },
  
  // Card Variants
  card: {
    base: 'glass-card border border-border rounded-2xl transition-all duration-300',
    hover: 'hover:shadow-lg hover:glass-muted',
    interactive: 'hover:shadow-lg hover:glass-muted cursor-pointer',
  },
  
  // Table Variants
  table: {
    header: 'bg-muted border-b-2 border-border p-3 text-left font-semibold text-primary text-sm uppercase tracking-wider',
    row: 'border-b border-border/50 hover:bg-muted/30 transition-colors duration-200',
    cell: 'p-3',
  },
  
  // Badge Variants
  badge: {
    primary: 'inline-block px-2 py-0.5 rounded text-xs font-semibold bg-primary/20 text-primary',
    secondary: 'inline-block px-2 py-0.5 rounded text-xs font-semibold bg-secondary/20 text-secondary',
    destructive: 'inline-block px-2 py-0.5 rounded text-xs font-semibold bg-destructive/20 text-destructive',
  },
  
  // Status Indicators
  status: {
    live: 'flex items-center gap-2 px-3 py-1 bg-liveStatusBg rounded-md border border-liveStatus',
    loading: 'inline-block w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin',
  },
} as const

// Layout Utilities
export const layout = {
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  section: 'py-8',
  grid: {
    '2-cols': 'grid grid-cols-1 lg:grid-cols-2 gap-6',
    '3-cols': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  },
  flex: {
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    start: 'flex items-center justify-start',
  },
} as const

// Animation Utilities
export const animations = {
  float: 'animate-float',
  pulse: 'animate-pulse',
  spin: 'animate-spin',
  fadeIn: 'animate-in fade-in duration-300',
  slideIn: 'animate-in slide-in-from-bottom-4 duration-300',
} as const

// Export everything for easy importing
export { colors, spacing }
export type { WankrColor, WankrGradient, WankrHoverEffect } from '../utils/colors'
