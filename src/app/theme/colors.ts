export const colors = {
  // Official WANKR Color Palette (Adobe Color Theme)
  wankr1: '#F06BF2', // Pink accent
  wankr2: '#532473', // Dark purple
  wankr3: '#7630D9', // Primary purple
  wankr4: '#04588C', // Blue
  wankr5: '#79F2E6', // Cyan
  
  // Core Brand Colors (Official WANKR Palette)
  primary: '#7630D9', // Wankr-Gyatt-3 - buttons, links, key accents
  secondary: '#79F2E6', // Wankr-Gyatt-5 - cyan accent for highlights
  accent: '#F06BF2', // Wankr-Gyatt-1 - pink accent for gradients
  cyber: '#04588C', // Wankr-Gyatt-4 - blue for borders, underlines
  darkPurple: '#532473', // Wankr-Gyatt-2 - dark purple for depth
  
  // Text Colors (Updated for Better Readability)
  textPrimary: '#FFFFFF', // Pure white for maximum readability
  textSecondary: '#E0E0E0', // Light gray for secondary text
  textMuted: '#B0B0B0', // Medium gray for muted text
  textDark: '#FFFFFF', // Main text on dark backgrounds
  textDarkSecondary: '#E0E0E0', // Secondary text on dark backgrounds
  
  // Background Colors (Official WANKR Black)
  backgroundLight: '#FAFAFF', // Light mode background
  backgroundDark: '#0C0A12', // Official WANKR black
  cardLight: '#FFFFFF', // Light mode card background
  cardDark: 'rgba(26, 22, 32, 0.8)', // Dark glass morphism card background
  cardBorder: 'rgba(118, 48, 217, 0.2)', // WANKR primary with transparency
  mutedDark: 'rgba(26, 22, 32, 0.6)', // Dark glass morphism muted background
  inputDark: 'rgba(26, 22, 32, 0.7)', // Dark glass morphism input background
  
  // Gradients (Official WANKR gradient with all 5 colors)
  gradientHero: 'linear-gradient(90deg, #F06BF2 0%, #7630D9 50%, #79F2E6 100%)',
  gradientCTA: 'linear-gradient(135deg, #7630D9 0%, #04588C 100%)',
  gradientSection: 'radial-gradient(circle at 20% 10%, #F06BF2 0%, transparent 40%), radial-gradient(circle at 80% 80%, #04588C 0%, transparent 45%)',
  gradientFull: 'linear-gradient(135deg, #F06BF2 0%, #532473 25%, #7630D9 50%, #04588C 75%, #79F2E6 100%)',
  
  // Button Colors
  buttonPrimary: 'linear-gradient(135deg, #7630D9 0%, #04588C 100%)',
  buttonSecondary: 'rgba(255, 255, 255, 0.05)',
  buttonOutline: '#04588C',
  
  // Status Colors
  success: '#2ed573',
  error: '#ff4757',
  warning: '#ffc107',
  
  // Input Colors
  inputBackground: 'rgba(255, 255, 255, 0.05)',
  inputBorder: 'rgba(255, 255, 255, 0.1)',
  
  // Overlay Colors
  overlay: 'rgba(255, 255, 255, 0.02)',
  overlayHover: 'rgba(255, 255, 255, 0.04)',
  
  // Live status
  liveStatus: '#2ed573',
  liveStatusBg: 'rgba(46, 213, 115, 0.1)',
  
  // Hover Effects
  hoverCyber: 'linear-gradient(135deg, #7630D9 0%, #04588C 100%)',
  hoverGlow: '0 0 20px rgba(118, 48, 217, 0.3)',
} as const
