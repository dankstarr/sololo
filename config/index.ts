// Configuration barrel export
// Re-export main config and individual configs for convenience

export { appConfig, default as defaultAppConfig } from './app.config'

// Re-export individual configs for direct imports (better tree-shaking)
export { appInfo } from './app-info'
export { pricing } from './pricing'
export { social } from './social'
export { navigation } from './navigation'
export { hero, features, howItWorks, groupPromo } from './content'
export { defaultTrip, sampleLocations, sampleGroups, sampleDiscoverItems, placeholderImages } from './sample-data'
export { api } from './api'
export { featureFlags } from './features'
export { animations } from './animations'
export { performance } from './performance'
export { ui } from './ui'
export { gemini } from './gemini'
export { googleMaps } from './google-maps'
