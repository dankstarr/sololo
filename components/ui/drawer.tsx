'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/ui/cn'

export interface DrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
}

const Drawer = ({ open, onOpenChange, children, side = 'bottom' }: DrawerProps) => {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [open])

  const sideClasses = {
    top: 'top-0 left-0 right-0',
    right: 'top-0 right-0 bottom-0',
    bottom: 'bottom-0 left-0 right-0',
    left: 'top-0 left-0 bottom-0',
  }

  const slideClasses = {
    top: 'animate-slide-in-from-top',
    right: 'animate-slide-in-from-right',
    bottom: 'animate-slide-in-from-bottom',
    left: 'animate-slide-in-from-left',
  }

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          'fixed z-50 bg-background shadow-lg transition-transform duration-300',
          side === 'top' && 'rounded-b-3xl',
          side === 'bottom' && 'rounded-t-3xl',
          side === 'left' && 'rounded-r-3xl',
          side === 'right' && 'rounded-l-3xl',
          sideClasses[side],
          slideClasses[side]
        )}
      >
        {children}
      </div>
    </>
  )
}

const DrawerContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { onClose?: () => void }
>(({ className, children, onClose, ...props }, ref) => (
  <div ref={ref} className={cn('p-6', className)} {...props}>
    {onClose && (
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-lg hover:bg-secondary transition-colors"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>
    )}
    {children}
  </div>
))
DrawerContent.displayName = 'DrawerContent'

export { Drawer, DrawerContent }
