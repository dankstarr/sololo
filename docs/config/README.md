# Configuration Guide

All important app settings and content are centralized in `app.config.ts`. Edit this file to customize your app without touching component code.

## Quick Start

1. Open `config/app.config.ts`
2. Edit the values you want to change
3. Save and rebuild your app

## Configuration Sections

### App Information
```typescript
app: {
  name: 'Sololo',              // App name
  tagline: 'Your AI Travel Companion',
  description: '...',         // Meta description
  url: 'https://sololo.com',  // Your domain
  email: 'hello@sololo.com',  // Contact email
  phone: '+1 (555) 123-4567', // Contact phone
}
```

### Pricing & Limits
```typescript
pricing: {
  freeLimit: 20,  // Number of free itinerary generations
  plans: {
    free: { ... },  // Free plan details
    pro: { ... },   // Pro plan details
  }
}
```

### Social Links
Update your social media URLs:
```typescript
social: {
  twitter: 'https://twitter.com/sololo',
  instagram: 'https://instagram.com/sololo',
  // ...
}
```

### Hero Section
Customize the main landing page headline:
```typescript
hero: {
  headline: 'Your tourist friend',
  headlineHighlight: 'for smarter, social travel',
  subheadline: 'AI itineraries, circular routes...',
  primaryCTA: { text: 'Plan Your Trip', href: '/app' },
  secondaryCTA: { text: 'Explore Trips', href: '/discover' },
}
```

### Features
Edit the features list shown on the marketing page:
```typescript
features: [
  {
    icon: 'Sparkles',  // Icon name (must match Lucide icon)
    title: 'AI Itinerary Generator',
    description: 'Get personalized trip plans...',
  },
  // Add more features...
]
```

### Sample Data
The config includes sample data for:
- **sampleLocations**: Default locations shown in Location Selection
- **sampleGroups**: Example groups for Group Discovery
- **sampleDiscoverItems**: Items shown on Discover page

### Placeholder Images
Images use Unsplash placeholders by default. To use your own:
1. Add images to `public/images/`
2. Update image paths in config
3. Or replace with your image URLs

### API Configuration
```typescript
api: {
  baseUrl: 'https://api.sololo.com',
  googleMapsKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
}
```

Set these via environment variables in `.env.local`:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here
```

### Feature Flags
Enable/disable features:
```typescript
featureFlags: {
  googleSignIn: true,
  emailSignIn: true,
  offlineMode: true,
  // ...
}
```

## Tips

1. **Icons**: Use Lucide React icon names (e.g., 'Sparkles', 'Route', 'Map')
2. **Images**: Use Unsplash URLs or your own hosted images
3. **Text**: All marketing text can be edited here
4. **Pricing**: Update prices and features easily
5. **Navigation**: Add/remove navigation links

## Need Help?

- Check component files to see how config is used
- All components import from `@/config/app.config`
- Changes require a rebuild: `npm run build`
