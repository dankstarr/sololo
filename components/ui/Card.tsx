'use client'

import { ReactNode, HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/ui/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  hover?: boolean
  padding?: 'none' | 'small' | 'medium' | 'large'
}

export default function Card({
  children,
  hover = false,
  padding = 'medium',
  className = '',
  ...props
}: CardProps) {
  const paddingClasses = {
    none: '',
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8',
  }
  
  const hoverClass = hover ? 'hover:shadow-xl hover:scale-[1.02] transition-all duration-200' : ''
  
  return (
    <div
      className={cn(
        'card-modern bg-card text-card-foreground rounded-3xl shadow-lg border border-border',
        paddingClasses[padding],
        hover ? 'tilt-card' : hoverClass,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
