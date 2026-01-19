// App Configuration - Main export file
// All configs are split into domain-specific files for better organization

import { appInfo } from './app-info'
import { pricing } from './pricing'
import { social } from './social'
import { navigation } from './navigation'
import { hero, features, howItWorks, groupPromo } from './content'
import { defaultTrip, sampleLocations, sampleGroups, sampleDiscoverItems, placeholderImages } from './sample-data'
import { discoverItems } from './discover-items'
import { api } from './api'
import { featureFlags } from './features'
import { animations } from './animations'
import { performance } from './performance'
import { ui } from './ui'
import { gemini } from './gemini'
import { googleMaps } from './google-maps'
import { themes } from './themes'

export const appConfig = {
  app: appInfo,
  pricing,
  social,
  navigation,
  hero,
  features,
  howItWorks,
  groupPromo,
  defaultTrip,
  sampleLocations,
  sampleGroups,
  sampleDiscoverItems,
  discoverItems,
  images: {
    placeholder: placeholderImages,
  },
  api,
  featureFlags,
  animations,
  performance,
  ui,
  gemini,
  googleMaps,
  themes,
}

export default appConfig

// Re-export individual configs for direct imports
export { appInfo, pricing, social, navigation, hero, features, howItWorks, groupPromo }
export { defaultTrip, sampleLocations, sampleGroups, sampleDiscoverItems, placeholderImages, discoverItems }
export { api, featureFlags, animations, performance, ui, gemini, googleMaps, themes }
