import { type ReactNode, type ButtonHTMLAttributes } from 'react'
import { components } from '../../theme'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  isLoading = false,
  disabled,
  className = '',
  ...props 
}: ButtonProps) {
  const baseClasses = components.button[variant]
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }
  const disabledClasses = (disabled || isLoading) ? components.button.disabled : ''
  
  const combinedClasses = `${baseClasses} ${sizeClasses[size]} ${disabledClasses} ${className}`.trim()

  return (
    <button
      className={combinedClasses}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Loading...
        </div>
      ) : (
        children
      )}
    </button>
  )
}
