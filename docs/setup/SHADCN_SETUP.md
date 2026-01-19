# Shadcn UI & Premium Design System Setup

## ✅ What's Been Configured

### 1. Premium Travel-AI Design System
- **Updated `tailwind.config.ts`** with premium color palette:
  - Background: Paper White (`#F9F9FB`)
  - Primary: Deep Forest Green (`#2D5A27`)
  - Secondary: Soft Sage (`#E8F0E6`)
  - Border radius: `1.5rem` (3xl) for modern mobile-app feel

### 2. Shadcn UI Components Created
All components are in `components/ui/`:
- ✅ `Badge` - For filter tags
- ✅ `ScrollArea` - For scrollable lists
- ✅ `Slider` - For search radius control
- ✅ `ToggleGroup` - For review count selection
- ✅ `Drawer` - For mobile bottom sheet
- ✅ `Card` - Updated with new design system
- ✅ `Input` - Updated with new design system

### 3. Utility Functions
- ✅ `lib/utils/cn.ts` - Class name merger (works without dependencies, but install for better merging)

### 4. Nearby Discovery Page
- ✅ Created `/app/app/nearby/page.tsx`
- ✅ Created `components/app/NearbyDiscovery.tsx` with:
  - Split-screen layout (40% list, 60% map) on desktop
  - Bottom sheet drawer on mobile
  - Staggered entrance animations
  - Hover scale effects
  - Breathing pulse for high-rated locations (>4.7)
  - Search, filters, and controls
  - 15 sample London locations

## 📦 Required Dependencies

Run this command to install all required packages:

```bash
npm install class-variance-authority clsx tailwind-merge tailwindcss-animate
```

**Note**: The app will work without these packages (using fallbacks), but for optimal experience, install them.

## 🎨 Design System Colors

The new premium palette is now active:
- `bg-background` - Paper White
- `bg-primary` - Deep Forest Green
- `bg-secondary` - Soft Sage
- `text-foreground` - Dark text
- `text-muted-foreground` - Muted text
- `border-border` - Border color

## 🚀 Features Implemented

### Desktop Layout
- Left sidebar (40%) with scrollable location list
- Right side (60%) map placeholder
- Sticky header with search and filters
- Sidebar controls (radius slider, review toggle)

### Mobile Layout
- Full-screen map on top
- Floating "Search & Filter" button
- Bottom sheet drawer with all controls
- Spring animation for drawer (stiffness: 150, damping: 20)

### Animations
- ✅ Staggered entrance (0.05s delay between cards)
- ✅ Hover scale (1.02) with enhanced shadow
- ✅ Breathing pulse for ratings >4.7
- ✅ Spring transitions for drawer
- ✅ Scroll-linked reveal ready

## 📍 Access the Page

Visit: `/app/nearby` to see the Nearby Discovery page

## 🔧 Next Steps

1. **Install dependencies** (if not already):
   ```bash
   npm install class-variance-authority clsx tailwind-merge tailwindcss-animate
   ```

2. **Add Mapbox integration** (replace the placeholder):
   - Sign up at mapbox.com
   - Add API key to `.env.local`
   - Replace map placeholder in `NearbyDiscovery.tsx`

3. **Customize locations**:
   - Edit `config/nearby-locations.ts` to add your own locations
   - Or connect to a real API

## 🎯 Motion Patterns Available

- **Shared Layout Animation**: Use `layoutId` prop for morphing animations
- **Spring Transition**: Already implemented in Drawer (stiffness: 150, damping: 20)
- **Scroll-linked Reveal**: Use `useInView` hook from framer-motion for scroll animations
