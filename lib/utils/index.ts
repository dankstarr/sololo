// Utility functions barrel export
// Re-export all utilities for backward compatibility

export * from './date'
export * from './location'
export * from './images'

// Legacy exports for backward compatibility
import { formatDate, formatTime } from './date'
import { openInGoogleMaps, createGoogleMapsList, shareLocation, generateAlternativeLocation, createCircularGoogleMapsRoute } from './location'
import { getPlaceholderImage, getImageUrl } from './images'

export {
  formatDate,
  formatTime,
  openInGoogleMaps,
  createGoogleMapsList,
  shareLocation,
  generateAlternativeLocation,
  createCircularGoogleMapsRoute,
  getPlaceholderImage,
  getImageUrl,
}
