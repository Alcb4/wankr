import { type InputHTMLAttributes, forwardRef } from 'react'
import { components } from '../../theme'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    const inputClasses = `${components.input.base} ${error ? components.input.error : ''} ${className}`.trim()

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label className="font-medium text-muted-foreground">
            {label}
          </label>
        )}
        
        <input
          ref={ref}
          className={inputClasses}
          {...props}
        />
        
        {error && (
          <p className="text-sm text-destructive">
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p className="text-sm text-muted-foreground">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
