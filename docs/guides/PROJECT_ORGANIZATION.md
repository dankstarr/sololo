# Project Organization Guide

This document outlines the new organized structure of the Sololo project, making it easier for Cursor to understand and work with the codebase.

## Directory Structure

```
sololo/
├── app/                    # Next.js app directory
├── components/
│   ├── app/               # App-specific components
│   ├── common/            # Reusable common components
│   ├── maps/              # Map-related components
│   ├── marketing/         # Marketing page components
│   └── ui/                # Base UI components (Button, Card, Modal, etc.)
├── config/                # Configuration files (split by domain)
│   ├── app-info.ts
│   ├── pricing.ts
│   ├── navigation.ts
│   ├── social.ts
│   ├── content.ts
│   ├── sample-data.ts
│   ├── api.ts
│   ├── features.ts
│   ├── animations.ts
│   ├── performance.ts
│   ├── ui.ts
│   ├── gemini.ts
│   ├── google-maps.ts
│   └── app.config.ts      # Main config export (backward compatible)
├── hooks/                 # Custom React hooks
│   ├── useModal.ts
│   ├── useOffline.ts
│   ├── useDebounce.ts
│   └── index.ts
├── lib/
│   ├── api/               # API integrations
│   │   ├── gemini.ts
│   │   └── google-maps.ts
│   └── utils/             # Utility functions (split by domain)
│       ├── date.ts
│       ├── location.ts
│       ├── images.ts
│       └── index.ts       # Barrel export
├── types/                 # Shared TypeScript types
│   └── index.ts
└── store/                 # State management
    └── useAppStore.ts
```

## Key Improvements

### 1. **Split Configuration**
The large `app.config.ts` file (426 lines) has been split into smaller, domain-specific files:
- `app-info.ts` - App metadata
- `pricing.ts` - Pricing plans and limits
- `navigation.ts` - Navigation links
- `social.ts` - Social media links
- `content.ts` - Hero, features, how-it-works content
- `sample-data.ts` - Sample data for development
- `api.ts` - API endpoints
- `features.ts` - Feature flags
- `animations.ts` - Animation settings
- `performance.ts` - Performance settings
- `ui.ts` - UI settings
- `gemini.ts` - Gemini AI configuration
- `google-maps.ts` - Google Maps configuration

**Usage:**
```typescript
// Old way (still works for backward compatibility)
import appConfig from '@/config/app.config'
const apiKey = appConfig.gemini.apiKey

// New way (more efficient, tree-shakeable)
import { gemini } from '@/config/gemini'
const apiKey = gemini.apiKey
```

### 2. **Reusable UI Components**
Created base UI components in `components/ui/`:
- `Button` - Consistent button styling with variants
- `Card` - Reusable card component
- `Modal` - Modal/dialog component
- `Input` - Form input with label and error handling
- `Textarea` - Textarea with label and error handling
- `Checkbox` - Checkbox with label

**Usage:**
```typescript
import { Button, Modal, Input } from '@/components/ui'

<Button variant="primary" size="medium" icon={<Icon />}>
  Click me
</Button>
```

### 3. **Organized Utilities**
Split `lib/utils.ts` into domain-specific files:
- `date.ts` - Date/time formatting functions
- `location.ts` - Location-related utilities (Google Maps, sharing)
- `images.ts` - Image placeholder utilities

**Usage:**
```typescript
// Old way (still works)
import { formatDate, shareLocation } from '@/lib/utils'

// New way (more specific)
import { formatDate } from '@/lib/utils/date'
import { shareLocation } from '@/lib/utils/location'
```

### 4. **Custom Hooks**
Created reusable hooks in `hooks/`:
- `useModal` - Manage modal open/close state
- `useOffline` - Track online/offline status
- `useDebounce` - Debounce values

**Usage:**
```typescript
import { useModal, useOffline } from '@/hooks'

const { isOpen, open, close } = useModal()
const isOffline = useOffline()
```

### 5. **Shared Types**
Centralized TypeScript types in `types/`:
- `Location` - Location interface
- `LocationDetail` - Location detail interface
- `Day` - Day/itinerary day interface
- `Group` - Travel group interface
- `TripFormData` - Trip form data interface
- `DiscoverItem` - Discover page item interface

**Usage:**
```typescript
import { Location, Group } from '@/types'
```

### 6. **Common Components**
Extracted common patterns into reusable components:
- `FilterPanel` - Reusable filter panel
- `DaySelector` - Day selection component
- `OfflineIndicator` - Online/offline status indicator

**Usage:**
```typescript
import { FilterPanel, DaySelector, OfflineIndicator } from '@/components/common'
```

## Benefits for Cursor

1. **Faster Code Navigation**: Smaller, focused files are easier to understand
2. **Better Code Reuse**: Reusable components reduce duplication
3. **Clearer Intent**: Domain-specific files make it obvious where to find things
4. **Easier Refactoring**: Changes are isolated to specific files
5. **Better Type Safety**: Centralized types ensure consistency
6. **Improved Tree Shaking**: Smaller imports reduce bundle size

## Migration Notes

- All old imports still work (backward compatible)
- Gradually migrate to new imports for better performance
- Use barrel exports (`index.ts`) for convenience
- Prefer specific imports when possible for better tree-shaking

## Best Practices

1. **Import from specific files** when you only need one thing:
   ```typescript
   import { gemini } from '@/config/gemini'  // ✅ Better
   ```

2. **Use barrel exports** for multiple imports:
   ```typescript
   import { Button, Modal, Input } from '@/components/ui'  // ✅ Convenient
   ```

3. **Use shared types** instead of inline interfaces:
   ```typescript
   import { Location } from '@/types'  // ✅ Consistent
   ```

4. **Extract common patterns** into reusable components:
   ```typescript
   import { FilterPanel } from '@/components/common'  // ✅ Reusable
   ```
