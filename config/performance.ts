// Performance Settings
export const performance = {
  // Lazy load threshold (pixels from viewport)
  lazyLoadThreshold: 50,
  
  // Debounce delays (milliseconds)
  searchDebounce: 300,
  scrollDebounce: 100,
  resizeDebounce: 200,
  
  // Image loading
  imageLoading: 'lazy' as 'lazy' | 'eager',
  imagePlaceholder: true,
  
  // Pagination
  itemsPerPage: 12,
  discoverItemsPerPage: 9,
  
  // Cache settings
  cacheDuration: 60, // minutes
}
