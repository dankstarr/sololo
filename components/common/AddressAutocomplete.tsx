'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { getAutocompleteSuggestions } from '@/lib/api/google-maps'
import { useDebounce } from '@/hooks'

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect?: (address: string, placeId?: string) => void
  placeholder?: string
  id?: string
  name?: string
  required?: boolean
  className?: string
  themeStyle?: 'light' | 'dark' | 'vibrant' | 'elegant' | 'mysterious'
  themeColors?: {
    primary: string
    text: string
  }
}

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'e.g., Tokyo, Japan',
  id,
  name,
  required = false,
  className = '',
  themeStyle = 'light',
  themeColors,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Array<{ description: string; placeId: string }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const debouncedValue = useDebounce(value, 300)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Fetch autocomplete suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedValue || debouncedValue.trim().length < 2) {
        setSuggestions([])
        setIsLoading(false)
        setShowSuggestions(false)
        return
      }

      // Check if Google Maps API is configured
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (!apiKey) {
        // Silently fail - autocomplete just won't work
        setSuggestions([])
        setIsLoading(false)
        setShowSuggestions(false)
        return
      }

      setIsLoading(true)
      try {
        const results = await getAutocompleteSuggestions(debouncedValue.trim())
        setSuggestions(results)
        setShowSuggestions(results.length > 0)
        setSelectedIndex(-1)
      } catch (error) {
        console.error('Autocomplete error:', error)
        setSuggestions([])
        setShowSuggestions(false)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSuggestions()
  }, [debouncedValue])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        inputRef.current?.blur()
        break
    }
  }

  const handleSelect = (suggestion: { description: string; placeId: string }) => {
    onChange(suggestion.description)
    onSelect?.(suggestion.description, suggestion.placeId)
    setShowSuggestions(false)
    setSelectedIndex(-1)
    inputRef.current?.blur()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
    setShowSuggestions(true)
  }

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true)
    }
  }

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(document.activeElement)) {
        setShowSuggestions(false)
      }
    }, 200)
  }

  const isDark = themeStyle === 'dark'
  const inputClassName = `w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
    isDark
      ? 'bg-slate-700 border-slate-600 text-gray-100 placeholder-gray-400 focus:ring-offset-slate-800'
      : 'border-gray-300 focus:ring-offset-white'
  } ${className}`

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          id={id}
          name={name}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          required={required}
          className={inputClassName}
          style={{
            '--tw-ring-color': themeColors?.primary || '#0284c7',
          } as React.CSSProperties & { '--tw-ring-color': string }}
          aria-autocomplete="list"
          aria-haspopup="listbox"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className={`absolute z-50 w-full mt-1 rounded-lg shadow-lg border max-h-60 overflow-y-auto ${
            isDark
              ? 'bg-slate-800 border-slate-700'
              : 'bg-white border-gray-200'
          }`}
          role="listbox"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.placeId || index}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-opacity-50 transition-colors ${
                index === selectedIndex
                  ? isDark
                    ? 'bg-slate-700'
                    : 'bg-primary-50'
                  : isDark
                  ? 'hover:bg-slate-700'
                  : 'hover:bg-gray-50'
              } ${index === 0 ? 'rounded-t-lg' : ''} ${
                index === suggestions.length - 1 ? 'rounded-b-lg' : ''
              }`}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <MapPin
                className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}
                style={index === selectedIndex ? { color: themeColors?.primary } : undefined}
              />
              <span
                className={`text-sm ${
                  isDark ? 'text-gray-200' : 'text-gray-900'
                }`}
              >
                {suggestion.description}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
