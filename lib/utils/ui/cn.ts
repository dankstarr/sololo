// Utility function to merge class names
// Simple implementation - install clsx and tailwind-merge for better merging
export function cn(...inputs: (string | undefined | null | boolean | Record<string, boolean>)[]): string {
  return inputs
    .map((input) => {
      if (typeof input === 'string') return input
      if (typeof input === 'object' && input !== null) {
        return Object.entries(input)
          .filter(([_, value]) => Boolean(value))
          .map(([key]) => key)
          .join(' ')
      }
      return ''
    })
    .filter(Boolean)
    .join(' ')
    .split(/\s+/)
    .filter((v, i, a) => a.indexOf(v) === i) // Remove duplicates
    .join(' ')
}
