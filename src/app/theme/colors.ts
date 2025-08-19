export const colors = {
  // Core Brand Colors (Official WANKR Palette)
  primary: '#7630D9', // Wankr-Gyatt-3 - buttons, links, key accents
  secondary: '#79F2E6', // Neon accent for highlights
  accent: '#F06BF2', // Pink accent for gradients
  cyber: '#04588C', // Borders, underlines, subtle dividers
  
  // Text Colors
  textPrimary: '#532473', // Main text on light backgrounds
  textSecondary: '#7A5A8A', // Secondary text on light backgrounds
  textDark: '#FFFFFF', // Main text on dark backgrounds
  textDarkSecondary: '#79F2E6', // Secondary text on dark backgrounds
  
  // Background Colors
  backgroundLight: '#FAFAFF', // Light mode background
  backgroundDark: '#0C0A12', // Dark mode background
  cardLight: '#FFFFFF', // Light mode card background
  cardDark: '#1A1620', // Dark mode card background
  
  // Gradients (Official WANKR Gradients)
  gradientHero: 'linear-gradient(90deg, #F06BF2 0%, #7630D9 50%, #79F2E6 100%)',
  gradientCTA: 'linear-gradient(135deg, #7630D9 0%, #04588C 100%)',
  gradientSection: 'radial-gradient(circle at 20% 10%, #F06BF2 0%, transparent 40%), radial-gradient(circle at 80% 80%, #04588C 0%, transparent 45%)',
  
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
