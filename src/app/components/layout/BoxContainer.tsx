import { type ReactNode, CSSProperties } from 'react'
import { components } from '../../theme'

interface BoxContainerProps {
  children: ReactNode
  minHeight?: string
  padding?: string
  style?: CSSProperties
}

export function BoxContainer({ children, minHeight = 'auto', padding = '2rem', style }: BoxContainerProps) {
  return (
    <div 
      className={components.card.base + ' ' + components.card.hover + ' p-4 sm:p-6'}
      style={{
        padding: padding !== '2rem' ? padding : undefined, // Only override if custom padding is provided
        minHeight,
        maxWidth: '100%',
        ...style
      }}
    >
      {children}
    </div>
  )
}
