'use client'

import { m } from 'framer-motion'
import { X, Utensils, Landmark, Mountain } from 'lucide-react'

interface Filter {
  key: string
  label: string
  icon: typeof Utensils
}

interface FilterPanelProps {
  isOpen: boolean
  onClose: () => void
  filters: Record<string, boolean>
  onFilterChange: (key: string, value: boolean) => void
  filterOptions?: Filter[]
}

const defaultFilters: Filter[] = [
  { key: 'food', label: 'Food', icon: Utensils },
  { key: 'culture', label: 'Culture', icon: Landmark },
  { key: 'scenic', label: 'Scenic', icon: Mountain },
]

export default function FilterPanel({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  filterOptions = defaultFilters,
}: FilterPanelProps) {
  if (!isOpen) return null

  return (
    <m.div
      className="absolute top-20 left-4 bg-white rounded-lg shadow-xl p-4 z-20 min-w-[200px]"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Filters</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Close filters"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-2">
        {filterOptions.map(({ key, label, icon: Icon }) => (
          <label
            key={key}
            className="flex items-center gap-2 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={filters[key] ?? false}
              onChange={(e) => onFilterChange(key, e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-600"
            />
            <Icon className="w-4 h-4 text-gray-600" />
            <span className="text-gray-700">{label}</span>
          </label>
        ))}
      </div>
    </m.div>
  )
}
