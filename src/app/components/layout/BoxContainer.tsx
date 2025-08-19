import { type ReactNode, CSSProperties } from 'react'

interface BoxContainerProps {
  children: ReactNode
  minHeight?: string
  padding?: string
  style?: CSSProperties
}

export function BoxContainer({ children, minHeight = 'auto', padding = '2rem', style }: BoxContainerProps) {
  return (
    <div 
      className="bg-card border border-border rounded-2xl backdrop-blur-md transition-all duration-300 hover:shadow-lg"
      style={{
        padding,
        minHeight,
        maxWidth: '100%',
        ...style
      }}
    >
      {children}
    </div>
  )
}
