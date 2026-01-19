'use client'

import * as React from 'react'
import { cn } from '@/lib/utils/cn'

export interface ToggleGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'single' | 'multiple'
  value?: string | string[]
  onValueChange?: (value: string | string[]) => void
}

const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(
  ({ className, type = 'single', value, onValueChange, children, ...props }, ref) => {
    const handleToggle = (itemValue: string) => {
      if (type === 'single') {
        onValueChange?.(value === itemValue ? '' : itemValue)
      } else {
        const currentValues = Array.isArray(value) ? value : []
        const newValues = currentValues.includes(itemValue)
          ? currentValues.filter((v) => v !== itemValue)
          : [...currentValues, itemValue]
        onValueChange?.(newValues)
      }
    }

    return (
      <div
        ref={ref}
        className={cn('inline-flex rounded-lg border border-border bg-background p-1', className)}
        role="group"
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.type === ToggleGroupItem) {
            return React.cloneElement(child, {
              ...child.props,
              onToggle: handleToggle,
              isSelected: type === 'single'
                ? value === child.props.value
                : Array.isArray(value) && value.includes(child.props.value),
            } as any)
          }
          return child
        })}
      </div>
    )
  }
)
ToggleGroup.displayName = 'ToggleGroup'

export interface ToggleGroupItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
  onToggle?: (value: string) => void
  isSelected?: boolean
}

const ToggleGroupItem = React.forwardRef<HTMLButtonElement, ToggleGroupItemProps>(
  ({ className, value, onToggle, isSelected, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        onClick={() => onToggle?.(value)}
        className={cn(
          'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
          isSelected
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'bg-transparent text-muted-foreground hover:bg-secondary hover:text-secondary-foreground',
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
ToggleGroupItem.displayName = 'ToggleGroupItem'

export { ToggleGroup, ToggleGroupItem }
