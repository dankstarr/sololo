// Image utility functions
import { placeholderImages } from '@/config/sample-data'

export function getPlaceholderImage(type: 'location' | 'discover' | 'user' | 'trip'): string {
  return placeholderImages[type]
}

export function getImageUrl(image: string | undefined | null, fallbackType: 'location' | 'discover' | 'user' | 'trip' = 'location'): string {
  // Handle null, undefined, empty string, or non-string values
  if (!image || typeof image !== 'string' || image.trim() === '') {
    return getPlaceholderImage(fallbackType)
  }
  
  // If it's already a full URL, return as is
  if (image.startsWith('http://') || image.startsWith('https://')) {
    return image
  }
  
  // For relative paths, check if they look valid (start with /)
  // If not, use placeholder to avoid broken images
  if (image.startsWith('/')) {
    // For now, we'll return the path and let Next.js Image handle 404s
    // In production, you might want to validate these paths exist
    return image
  }
  
  // Invalid path format, use placeholder
  return getPlaceholderImage(fallbackType)
}
