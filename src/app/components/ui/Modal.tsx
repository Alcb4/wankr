import { type ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  buttonPosition?: { top: number; right: number }
}

export function Modal({ isOpen, onClose, children, title, buttonPosition }: ModalProps) {
  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking the backdrop itself, not any child elements
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50"
      onClick={handleBackdropClick}
    >
      {/* Backdrop overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Modal - positioned relative to button */}
      <div 
        className="absolute bg-card border border-border rounded-xl p-6 w-96 shadow-xl animate-in slide-in-from-top-right duration-200"
        style={{
          top: buttonPosition ? `${buttonPosition.top}px` : '1rem',
          right: buttonPosition ? `${buttonPosition.right}px` : '1rem'
        }}
      >
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
