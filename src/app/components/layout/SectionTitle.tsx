import { type ReactNode } from 'react'

interface SectionTitleProps {
  children: ReactNode
  textAlign?: 'left' | 'center' | 'right'
}

export function SectionTitle({ children, textAlign = 'left' }: SectionTitleProps) {
  const textAlignClass = textAlign === 'center' ? 'text-center' : textAlign === 'right' ? 'text-right' : 'text-left'
  
  return (
    <h2 className={`text-2xl mb-4 text-primary font-bold ${textAlignClass}`}>
      {children}
    </h2>
  )
}
