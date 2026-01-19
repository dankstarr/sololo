'use client'

import * as React from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

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

  const slideVariants = {
    top: { y: '-100%' },
    right: { x: '100%' },
    bottom: { y: '100%' },
    left: { x: '-100%' },
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <m.div
            className="fixed inset-0 bg-black/50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
          />
          <m.div
            className={cn(
              'fixed z-50 bg-background shadow-lg',
              side === 'top' && 'rounded-b-3xl',
              side === 'bottom' && 'rounded-t-3xl',
              side === 'left' && 'rounded-r-3xl',
              side === 'right' && 'rounded-l-3xl',
              sideClasses[side]
            )}
            initial={slideVariants[side]}
            animate={{ x: 0, y: 0 }}
            exit={slideVariants[side]}
            transition={{ type: 'spring', stiffness: 150, damping: 20 }}
          >
            {children}
          </m.div>
        </>
      )}
    </AnimatePresence>
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
