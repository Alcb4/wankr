import { type ReactNode, type HTMLAttributes } from 'react'
import { components } from '../../theme'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: 'base' | 'hover' | 'interactive'
  padding?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Card({ 
  children, 
  variant = 'base',
  padding = 'md',
  className = '',
  ...props 
}: CardProps) {
  const baseClasses = components.card[variant]
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  }
  
  const combinedClasses = `${baseClasses} ${paddingClasses[padding]} ${className}`.trim()

  return (
    <div className={combinedClasses} {...props}>
      {children}
    </div>
  )
}
