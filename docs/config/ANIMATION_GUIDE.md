# Animation & Performance Configuration Guide

All animation speeds, delays, and performance settings are configurable in `config/app.config.ts`.

## Animation Settings

### Page Transitions
```typescript
animations: {
  pageTransition: 300,      // Page transitions (ms)
  modalTransition: 200,      // Modal open/close (ms)
  cardHover: 150,           // Card hover effects (ms)
}
```

### Scroll Animations
```typescript
scrollReveal: 400,          // Scroll reveal duration (ms)
scrollRevealDelay: 100,    // Delay between items (ms)
```

### Component Animations
```typescript
fadeIn: 300,                // Fade in duration (ms)
slideIn: 400,               // Slide in duration (ms)
scaleIn: 300,               // Scale in duration (ms)
```

### Stagger Effects
```typescript
staggerDelay: 50,           // Delay between list items (ms)
```

### Hover Effects
```typescript
hoverScale: 1.05,           // Scale factor on hover
hoverDuration: 200,         // Hover animation duration (ms)
```

### Special Animations
```typescript
routeDrawDuration: 3000,    // Route drawing animation (ms)
routeDrawDelay: 500,        // Delay before route starts (ms)
glitchDuration: 100,        // Glitch effect duration (ms)
pinBounceDuration: 2000,    // Map pin bounce (ms)
```

## Performance Settings

### Lazy Loading
```typescript
performance: {
  lazyLoadThreshold: 50,    // Pixels from viewport to load
  imageLoading: 'lazy',     // 'lazy' | 'eager'
  imagePlaceholder: true,   // Show placeholders while loading
}
```

### Debounce Delays
```typescript
searchDebounce: 300,        // Search input debounce (ms)
scrollDebounce: 100,        // Scroll event debounce (ms)
resizeDebounce: 200,        // Resize event debounce (ms)
```

### Pagination
```typescript
itemsPerPage: 12,           // Items per page
discoverItemsPerPage: 9,    // Discover page items
```

### Caching
```typescript
cacheDuration: 60,          // Cache duration (minutes)
```

## UI Settings

### Colors
```typescript
ui: {
  primaryColor: '#0284c7',
  secondaryColor: '#0ea5e9',
}
```

### Spacing
```typescript
containerPadding: 'px-4 sm:px-6',
sectionPadding: 'py-12 sm:py-16 md:py-24',
```

### Border Radius
```typescript
borderRadius: {
  small: 'rounded-lg',
  medium: 'rounded-xl',
  large: 'rounded-2xl',
}
```

### Shadows
```typescript
shadow: {
  small: 'shadow-md',
  medium: 'shadow-lg',
  large: 'shadow-xl',
  xl: 'shadow-2xl',
}
```

## ChatGPT Settings

```typescript
chatgpt: {
  enabled: true,
  model: 'gpt-4',           // 'gpt-4' | 'gpt-3.5-turbo'
  maxTokens: 1000,
  temperature: 0.7,         // 0-1, higher = more creative
  systemPrompt: '...',      // System prompt for AI
}
```

## Google Maps Settings

```typescript
googleMaps: {
  enabled: true,
  defaultZoom: 13,
  defaultCenter: { lat: 35.6762, lng: 139.6503 },
  mapStyles: 'standard',    // 'standard' | 'satellite' | 'terrain' | 'hybrid'
  routeColor: '#0284c7',
  routeWidth: 4,
  animation: {
    enabled: true,
    duration: 2000,
  },
}
```

## Tips

1. **Faster Animations**: Reduce duration values (e.g., `pageTransition: 200`)
2. **Slower Animations**: Increase duration values (e.g., `pageTransition: 500`)
3. **Disable Animations**: Set durations to 0 or use `prefers-reduced-motion`
4. **Performance**: Increase debounce delays for slower devices
5. **Pagination**: Adjust `itemsPerPage` based on content size

## Example: Making Everything Faster

```typescript
animations: {
  pageTransition: 150,      // Faster page transitions
  modalTransition: 100,     // Faster modals
  scrollReveal: 200,        // Faster scroll reveals
  hoverDuration: 100,       // Faster hover effects
}
```

## Example: Making Everything Slower/Smoother

```typescript
animations: {
  pageTransition: 500,      // Slower, smoother transitions
  modalTransition: 300,     // Slower modals
  scrollReveal: 600,         // Slower scroll reveals
  hoverDuration: 300,        // Slower hover effects
}
```
