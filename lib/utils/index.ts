// Utility functions barrel export
// Re-export all utilities for backward compatibility

export * from './date'
export * from './location'
export * from './images'
export * from './pdf'

// Legacy exports for backward compatibility
import { formatDate, formatTime } from './date'
import { openInGoogleMaps, createGoogleMapsList, shareLocation, generateAlternativeLocation, createCircularGoogleMapsRoute, createGoogleMapsUrl } from './location'
import { getPlaceholderImage, getImageUrl } from './images'

export {
  formatDate,
  formatTime,
  openInGoogleMaps,
  createGoogleMapsList,
  shareLocation,
  generateAlternativeLocation,
  createCircularGoogleMapsRoute,
  createGoogleMapsUrl,
  getPlaceholderImage,
  getImageUrl,
}
