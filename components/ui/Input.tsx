'use client'

import { InputHTMLAttributes, ReactNode, useId } from 'react'
import { cn } from '@/lib/utils/ui/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  icon?: ReactNode
  fullWidth?: boolean
}

export default function Input({
  label,
  error,
  helperText,
  icon,
  fullWidth = true,
  className = '',
  id,
  value,
  onChange,
  ...props
}: InputProps) {
  const reactId = useId()
  const inputId = id || reactId
  
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-gray-700 font-semibold mb-2"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            'w-full px-4 py-3 border rounded-lg bg-background text-foreground',
            'focus:ring-2 focus:ring-ring focus:border-transparent',
            'outline-none transition-all',
            error ? 'border-destructive' : 'border-input',
            icon ? 'pl-10' : undefined,
            className
          )}
          value={value}
          onChange={onChange}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
      </div>
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${inputId}-helper`} className="mt-1 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  )
}
