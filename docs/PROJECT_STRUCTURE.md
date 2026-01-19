# Project Structure

Complete overview of the Sololo project structure for Cursor AI and developers.

## 📁 Directory Structure

```
sololo/
├── .cursor/                    # Cursor AI prompt files
│   ├── component-patterns.md  # Component development patterns
│   ├── api-integration.md     # API integration guide
│   └── configuration-guide.md # Configuration reference
├── .cursorrules               # Cursor AI project rules
├── app/                       # Next.js App Router
│   ├── app/                   # Web app pages (authenticated)
│   │   ├── home/              # Trip creation
│   │   ├── locations/         # Location selection
│   │   ├── itinerary/         # Itinerary overview
│   │   ├── map/               # Map view
│   │   ├── groups/            # Group discovery & chat
│   │   ├── nearby/            # Nearby discovery
│   │   └── upgrade/           # Upgrade page
│   ├── about/                 # Marketing pages
│   ├── contact/
│   ├── privacy/
│   ├── terms/
│   ├── discover/              # Public discover page
│   ├── admin/                 # Admin dashboard
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Landing page
│   └── globals.css            # Global styles
├── components/
│   ├── app/                   # App-specific components
│   │   ├── index.ts          # Barrel export
│   │   ├── TripCreation.tsx
│   │   ├── LocationSelection.tsx
│   │   ├── ItineraryOverview.tsx
│   │   ├── MapView.tsx
│   │   ├── LocationDetail.tsx
│   │   ├── AudioGuide.tsx
│   │   ├── GroupDiscovery.tsx
│   │   ├── GroupChat.tsx
│   │   ├── DiscoverPage.tsx
│   │   └── ...
│   ├── marketing/             # Marketing website components
│   │   ├── index.ts          # Barrel export
│   │   ├── Header.tsx
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── Pricing.tsx
│   │   └── Footer.tsx
│   ├── common/                # Shared components
│   │   ├── index.ts          # Barrel export
│   │   ├── FilterPanel.tsx
│   │   ├── DaySelector.tsx
│   │   ├── OfflineIndicator.tsx
│   │   ├── AIReasoningPanel.tsx
│   │   └── ...
│   ├── ui/                    # Reusable UI primitives
│   │   ├── index.ts          # Barrel export
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Input.tsx
│   │   └── ...
│   └── maps/                  # Map components
│       ├── index.ts          # Barrel export
│       └── GoogleMap.tsx
├── config/                     # Configuration files
│   ├── app.config.ts          # Main config (exports all)
│   ├── app-info.ts            # App metadata
│   ├── pricing.ts              # Pricing plans
│   ├── navigation.ts           # Navigation links
│   ├── social.ts               # Social media links
│   ├── content.ts              # Marketing content
│   ├── sample-data.ts          # Sample data
│   ├── api.ts                  # API configuration
│   ├── features.ts             # Feature flags
│   ├── animations.ts           # Animation settings
│   ├── performance.ts          # Performance settings
│   ├── ui.ts                   # UI configuration
│   ├── gemini.ts               # Gemini AI config
│   └── google-maps.ts          # Google Maps config
├── docs/                       # Documentation
│   ├── setup/                  # Setup guides
│   ├── deployment/             # Deployment guides
│   ├── config/                 # Configuration docs
│   ├── guides/                 # Development guides
│   └── README.md               # Docs index
├── hooks/                      # Custom React hooks
│   ├── index.ts               # Barrel export
│   ├── useModal.ts
│   ├── useOffline.ts
│   ├── useDebounce.ts
│   └── useAIReasoning.ts
├── lib/
│   ├── api/                    # API clients
│   │   ├── index.ts           # Barrel export
│   │   ├── google-maps.ts     # Google Maps API
│   │   └── gemini.ts          # Gemini AI API
│   └── utils/                  # Utility functions
│       ├── index.ts           # Barrel export
│       ├── date.ts            # Date/time utilities
│       ├── location.ts         # Location utilities
│       ├── images.ts           # Image utilities
│       └── cn.ts              # Class name utility
├── scripts/                    # Build & deployment scripts
│   └── deploy.sh               # Deployment script
├── store/                      # State management
│   └── useAppStore.ts          # Zustand store
├── types/                      # TypeScript types
│   └── index.ts               # Type definitions
├── __tests__/                  # Test files
│   └── components/            # Component tests
├── public/                     # Static assets
│   └── images/                # Image assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## 🔑 Key Files

### Configuration
- `config/app.config.ts` - Main configuration file (imports all configs)
- `.env.local` - Environment variables (not in git)

### Entry Points
- `app/layout.tsx` - Root layout
- `app/page.tsx` - Landing page
- `app/app/home/page.tsx` - App home

### State Management
- `store/useAppStore.ts` - Global Zustand store

### Types
- `types/index.ts` - Shared TypeScript types

### Utilities
- `lib/utils/index.ts` - Utility functions
- `lib/api/index.ts` - API clients

## 📦 Import Patterns

### Components
```typescript
// App components
import { TripCreation, MapView } from '@/components/app'

// Marketing components
import { Header, Hero } from '@/components/marketing'

// Common components
import { FilterPanel, DaySelector } from '@/components/common'

// UI components
import { Button, Modal, Input } from '@/components/ui'
```

### Configuration
```typescript
// Main config (backward compatible)
import appConfig from '@/config/app.config'

// Specific configs (better tree-shaking)
import { gemini } from '@/config/gemini'
import { googleMaps } from '@/config/google-maps'
```

### Utilities
```typescript
// All utilities
import { formatDate, shareLocation } from '@/lib/utils'

// Specific utilities
import { formatDate } from '@/lib/utils/date'
import { shareLocation } from '@/lib/utils/location'
```

### Hooks
```typescript
import { useModal, useOffline, useDebounce } from '@/hooks'
```

### API
```typescript
import { searchPlaces, getPlaceDetails } from '@/lib/api/google-maps'
import { generateItinerary } from '@/lib/api/gemini'
```

## 🎯 Best Practices

1. **Use barrel exports** (`index.ts`) for convenient imports
2. **Import from specific files** when you only need one thing (better tree-shaking)
3. **Use TypeScript types** from `@/types`
4. **Configure in `config/`** - don't hardcode values
5. **Use shared components** from `components/common/` and `components/ui/`
6. **Follow naming conventions** - PascalCase for components, camelCase for utilities

## 📝 File Naming

- **Components**: PascalCase (e.g., `TripCreation.tsx`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Config**: kebab-case (e.g., `app-info.ts`)
- **Pages**: Next.js convention (e.g., `page.tsx`, `layout.tsx`)

## 🔍 Finding Things

- **Components**: `components/` directory
- **Configuration**: `config/` directory
- **Utilities**: `lib/utils/` directory
- **API Clients**: `lib/api/` directory
- **Types**: `types/index.ts`
- **Hooks**: `hooks/` directory
- **Documentation**: `docs/` directory
