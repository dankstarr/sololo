'use client'

import { ReactNode, HTMLAttributes } from 'react'
import { m } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

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
  
  const hoverClass = hover ? 'hover:shadow-xl transition-shadow' : ''
  
  return (
    <m.div
      className={cn(
        'bg-card text-card-foreground rounded-3xl shadow-lg border border-border',
        paddingClasses[padding],
        hoverClass,
        className
      )}
      whileHover={hover ? { scale: 1.02, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' } : undefined}
      {...props}
    >
      {children}
    </m.div>
  )
}
