'use client'

import * as React from 'react'
import { cn } from '@/lib/utils/cn'

export interface SliderProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'type' | 'value' | 'defaultValue' | 'onChange'
  > {
  value?: number[]
  onValueChange?: (value: number[]) => void
  min?: number
  max?: number
  step?: number
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value = [0], onValueChange, min = 0, max = 100, step = 1, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(value[0] || min)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Number(e.target.value)
      setInternalValue(newValue)
      onValueChange?.([newValue])
    }

    const currentValue = value?.[0] ?? internalValue

    return (
      <div className={cn('relative flex w-full items-center', className)}>
        <input
          type="range"
          ref={ref}
          min={min}
          max={max}
          step={step}
          value={currentValue}
          onChange={handleChange}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-primary"
          {...props}
        />
        <div className="absolute left-0 top-0 h-2 w-full rounded-lg bg-secondary" />
        <div
          className="absolute left-0 top-0 h-2 rounded-lg bg-primary"
          style={{ width: `${((currentValue - min) / (max - min)) * 100}%` }}
        />
      </div>
    )
  }
)
Slider.displayName = 'Slider'

export { Slider }
