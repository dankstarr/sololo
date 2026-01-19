'use client'

import { InputHTMLAttributes, ReactNode } from 'react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string | ReactNode
  error?: string
}

export default function Checkbox({
  label,
  error,
  className = '',
  id,
  ...props
}: CheckboxProps) {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`
  
  return (
    <div>
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id={checkboxId}
          className={`
            w-5 h-5 text-primary-600 rounded focus:ring-primary-600
            ${error ? 'border-red-500' : ''}
            ${className}
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${checkboxId}-error` : undefined}
          {...props}
        />
        {label && (
          <label
            htmlFor={checkboxId}
            className="text-gray-700 font-medium cursor-pointer"
          >
            {label}
          </label>
        )}
      </div>
      {error && (
        <p id={`${checkboxId}-error`} className="mt-1 text-sm text-red-600 ml-8" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
