import { type ReactNode, CSSProperties } from 'react'
import { components } from '../../theme'

interface BoxContainerProps {
  children: ReactNode
  minHeight?: string
  style?: CSSProperties
  className?: string // Allow passing extra classes
}

export function BoxContainer({ children, minHeight = 'auto', style, className = '' }: BoxContainerProps) {
  // Combine the base classes with any extra classes passed in
  const combinedClassName = `${components.card.base} ${components.card.hover} p-4 sm:p-6 ${className}`;

  return (
    <div 
      className={combinedClassName}
      style={{
        minHeight,
        width: '100%', // Ensure full width
        ...style
      }}
    >
      {children}
    </div>
  )
}
