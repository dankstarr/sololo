'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Settings, 
  Home, 
  Map, 
  Users, 
  Compass, 
  Globe, 
  ToggleLeft, 
  ToggleRight,
  RefreshCw,
  Check
} from 'lucide-react'
import appConfig from '@/config/app.config'

interface PageConfig {
  [key: string]: any
}

type TabType = 
  | 'marketing' 
  | 'app-home' 
  | 'app-locations' 
  | 'app-itinerary' 
  | 'app-map' 
  | 'app-groups' 
  | 'discover' 
  | 'global'

export default function PageConfigEditor() {
  const [activeTab, setActiveTab] = useState<TabType>('marketing')
  const [config, setConfig] = useState<PageConfig>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Load config on mount
  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/config')
      const result = await response.json()
      if (result.success) {
        setConfig(result.data || {})
      }
    } catch (error) {
      console.error('Error loading config:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const saveConfig = useCallback(async (section: string, data: any) => {
    setSaving(true)
    setSaved(false)
    try {
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, data }),
      })
      const result = await response.json()
      if (result.success) {
        setConfig((prev) => ({ ...prev, [section]: data }))
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (error) {
      console.error('Error saving config:', error)
      alert('Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }, [])

  const updateConfig = useCallback((section: string, updates: any) => {
    const currentData = config[section] || getDefaultConfig(section)
    const newData = { ...currentData, ...updates }
    saveConfig(section, newData)
  }, [config, saveConfig])

  const getDefaultConfig = (section: string): any => {
    switch (section) {
      case 'marketing':
        return {
          hero: appConfig.hero,
          features: appConfig.features,
          howItWorks: appConfig.howItWorks,
          groupPromo: appConfig.groupPromo,
          pricing: appConfig.pricing,
        }
      case 'app-home':
        return {
          showGroupPromo: true,
          showAccessibilityOptions: true,
          maxDays: 30,
          defaultDays: 3,
          interests: ['food', 'art', 'history', 'nature', 'nightlife'],
        }
      case 'app-locations':
        return {
          showReplaceButton: true,
          allowDragReorder: true,
          maxLocationsPerDay: 10,
          showAIRationale: true,
        }
      case 'app-itinerary':
        return {
          showPaceWarnings: true,
          showBudgetEstimates: true,
          allowDayNotes: true,
          showAISuggestions: true,
        }
      case 'app-map':
        return {
          showFilters: true,
          showGoogleMapsIntegration: true,
          allowRouteOptimization: true,
          showDaySelector: true,
        }
      case 'app-groups':
        return {
          autoExpireAfterTrip: true,
          maxGroupSize: 20,
          allowPublicGroups: true,
          showIcebreakers: true,
        }
      case 'discover':
        return {
          itemsPerPage: 12,
          showFilters: true,
          allowSharing: true,
          showLikes: true,
          showSaves: true,
        }
      case 'global':
        return {
          featureFlags: appConfig.featureFlags,
          navigation: appConfig.navigation,
          ui: appConfig.ui,
        }
      default:
        return {}
    }
  }

  const currentData = config[activeTab] || getDefaultConfig(activeTab)

  const tabs = [
    { id: 'marketing' as TabType, label: 'Marketing', icon: Globe },
    { id: 'app-home' as TabType, label: 'App Home', icon: Home },
    { id: 'app-locations' as TabType, label: 'Locations', icon: Map },
    { id: 'app-itinerary' as TabType, label: 'Itinerary', icon: Compass },
    { id: 'app-map' as TabType, label: 'Map View', icon: Map },
    { id: 'app-groups' as TabType, label: 'Groups', icon: Users },
    { id: 'discover' as TabType, label: 'Discover', icon: Compass },
    { id: 'global' as TabType, label: 'Global', icon: Settings },
  ]

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-6 h-5 text-primary" />
          Page Configuration
        </h2>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <Check className="w-4 h-4" />
              Saved
            </span>
          )}
          <button
            onClick={loadConfig}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Reload
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-t-lg font-medium transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="max-h-[600px] overflow-y-auto">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : (
          <>
            {activeTab === 'marketing' && (
              <MarketingConfig 
                data={currentData} 
                onUpdate={(updates) => updateConfig('marketing', updates)}
              />
            )}
            {activeTab === 'app-home' && (
              <AppHomeConfig 
                data={currentData} 
                onUpdate={(updates) => updateConfig('app-home', updates)}
              />
            )}
            {activeTab === 'app-locations' && (
              <AppLocationsConfig 
                data={currentData} 
                onUpdate={(updates) => updateConfig('app-locations', updates)}
              />
            )}
            {activeTab === 'app-itinerary' && (
              <AppItineraryConfig 
                data={currentData} 
                onUpdate={(updates) => updateConfig('app-itinerary', updates)}
              />
            )}
            {activeTab === 'app-map' && (
              <AppMapConfig 
                data={currentData} 
                onUpdate={(updates) => updateConfig('app-map', updates)}
              />
            )}
            {activeTab === 'app-groups' && (
              <AppGroupsConfig 
                data={currentData} 
                onUpdate={(updates) => updateConfig('app-groups', updates)}
              />
            )}
            {activeTab === 'discover' && (
              <DiscoverConfig 
                data={currentData} 
                onUpdate={(updates) => updateConfig('discover', updates)}
              />
            )}
            {activeTab === 'global' && (
              <GlobalConfig 
                data={currentData} 
                onUpdate={(updates) => updateConfig('global', updates)}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Marketing Page Config Component
function MarketingConfig({ data, onUpdate }: { data: any; onUpdate: (updates: any) => void }) {
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Hero Section</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
            <input
              type="text"
              value={data.hero?.headline || ''}
              onChange={(e) => onUpdate({ hero: { ...data.hero, headline: e.target.value } })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Headline Highlight</label>
            <input
              type="text"
              value={data.hero?.headlineHighlight || ''}
              onChange={(e) => onUpdate({ hero: { ...data.hero, headlineHighlight: e.target.value } })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subheadline</label>
            <textarea
              value={data.hero?.subheadline || ''}
              onChange={(e) => onUpdate({ hero: { ...data.hero, subheadline: e.target.value } })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary CTA Text</label>
              <input
                type="text"
                value={data.hero?.primaryCTA?.text || ''}
                onChange={(e) => onUpdate({ 
                  hero: { ...data.hero, primaryCTA: { ...data.hero?.primaryCTA, text: e.target.value } } 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary CTA Link</label>
              <input
                type="text"
                value={data.hero?.primaryCTA?.href || ''}
                onChange={(e) => onUpdate({ 
                  hero: { ...data.hero, primaryCTA: { ...data.hero?.primaryCTA, href: e.target.value } } 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Features</h3>
        <div className="space-y-3">
          {(data.features || []).map((feature: any, index: number) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-3 mb-2">
                <input
                  type="text"
                  placeholder="Title"
                  value={feature.title || ''}
                  onChange={(e) => {
                    const updated = [...(data.features || [])]
                    updated[index] = { ...updated[index], title: e.target.value }
                    onUpdate({ features: updated })
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Icon name"
                  value={feature.icon || ''}
                  onChange={(e) => {
                    const updated = [...(data.features || [])]
                    updated[index] = { ...updated[index], icon: e.target.value }
                    onUpdate({ features: updated })
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <textarea
                placeholder="Description"
                value={feature.description || ''}
                onChange={(e) => {
                  const updated = [...(data.features || [])]
                  updated[index] = { ...updated[index], description: e.target.value }
                  onUpdate({ features: updated })
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={2}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Pricing</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Free Limit (itineraries)</label>
            <input
              type="number"
              value={data.pricing?.freeLimit || 20}
              onChange={(e) => onUpdate({ pricing: { ...data.pricing, freeLimit: parseInt(e.target.value) } })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pro Price</label>
            <input
              type="text"
              value={data.pricing?.plans?.pro?.price || ''}
              onChange={(e) => onUpdate({ 
                pricing: { 
                  ...data.pricing, 
                  plans: { 
                    ...data.pricing?.plans, 
                    pro: { ...data.pricing?.plans?.pro, price: e.target.value } 
                  } 
                } 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// App Home Config Component
function AppHomeConfig({ data, onUpdate }: { data: any; onUpdate: (updates: any) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
        <div>
          <label className="font-medium text-gray-900">Show Group Promo Banner</label>
          <p className="text-sm text-gray-600">Display the group travel promotion banner</p>
        </div>
        <button
          onClick={() => onUpdate({ showGroupPromo: !data.showGroupPromo })}
          className={`p-2 rounded-lg ${data.showGroupPromo ? 'bg-primary text-white' : 'bg-gray-200'}`}
        >
          {data.showGroupPromo ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
        </button>
      </div>
      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
        <div>
          <label className="font-medium text-gray-900">Show Accessibility Options</label>
          <p className="text-sm text-gray-600">Allow users to specify accessibility needs</p>
        </div>
        <button
          onClick={() => onUpdate({ showAccessibilityOptions: !data.showAccessibilityOptions })}
          className={`p-2 rounded-lg ${data.showAccessibilityOptions ? 'bg-primary text-white' : 'bg-gray-200'}`}
        >
          {data.showAccessibilityOptions ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
        </button>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Days</label>
        <input
          type="number"
          value={data.maxDays || 30}
          onChange={(e) => onUpdate({ maxDays: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Default Days</label>
        <input
          type="number"
          value={data.defaultDays || 3}
          onChange={(e) => onUpdate({ defaultDays: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>
    </div>
  )
}

// App Locations Config Component
function AppLocationsConfig({ data, onUpdate }: { data: any; onUpdate: (updates: any) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
        <div>
          <label className="font-medium text-gray-900">Show Replace Button</label>
          <p className="text-sm text-gray-600">Allow users to replace locations with alternatives</p>
        </div>
        <button
          onClick={() => onUpdate({ showReplaceButton: !data.showReplaceButton })}
          className={`p-2 rounded-lg ${data.showReplaceButton ? 'bg-primary text-white' : 'bg-gray-200'}`}
        >
          {data.showReplaceButton ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
        </button>
      </div>
      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
        <div>
          <label className="font-medium text-gray-900">Allow Drag & Drop Reordering</label>
          <p className="text-sm text-gray-600">Enable drag-and-drop to reorder locations</p>
        </div>
        <button
          onClick={() => onUpdate({ allowDragReorder: !data.allowDragReorder })}
          className={`p-2 rounded-lg ${data.allowDragReorder ? 'bg-primary text-white' : 'bg-gray-200'}`}
        >
          {data.allowDragReorder ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
        </button>
      </div>
      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
        <div>
          <label className="font-medium text-gray-900">Show AI Rationale</label>
          <p className="text-sm text-gray-600">Display AI explanations for why locations were suggested</p>
        </div>
        <button
          onClick={() => onUpdate({ showAIRationale: !data.showAIRationale })}
          className={`p-2 rounded-lg ${data.showAIRationale ? 'bg-primary text-white' : 'bg-gray-200'}`}
        >
          {data.showAIRationale ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
        </button>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Max Locations Per Day</label>
        <input
          type="number"
          value={data.maxLocationsPerDay || 10}
          onChange={(e) => onUpdate({ maxLocationsPerDay: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>
    </div>
  )
}

// App Itinerary Config Component
function AppItineraryConfig({ data, onUpdate }: { data: any; onUpdate: (updates: any) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
        <div>
          <label className="font-medium text-gray-900">Show Pace Warnings</label>
          <p className="text-sm text-gray-600">Warn users if a day feels rushed</p>
        </div>
        <button
          onClick={() => onUpdate({ showPaceWarnings: !data.showPaceWarnings })}
          className={`p-2 rounded-lg ${data.showPaceWarnings ? 'bg-primary text-white' : 'bg-gray-200'}`}
        >
          {data.showPaceWarnings ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
        </button>
      </div>
      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
        <div>
          <label className="font-medium text-gray-900">Show Budget Estimates</label>
          <p className="text-sm text-gray-600">Display estimated budget per day</p>
        </div>
        <button
          onClick={() => onUpdate({ showBudgetEstimates: !data.showBudgetEstimates })}
          className={`p-2 rounded-lg ${data.showBudgetEstimates ? 'bg-primary text-white' : 'bg-gray-200'}`}
        >
          {data.showBudgetEstimates ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
        </button>
      </div>
      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
        <div>
          <label className="font-medium text-gray-900">Allow Day Notes</label>
          <p className="text-sm text-gray-600">Let users add custom notes per day</p>
        </div>
        <button
          onClick={() => onUpdate({ allowDayNotes: !data.allowDayNotes })}
          className={`p-2 rounded-lg ${data.allowDayNotes ? 'bg-primary text-white' : 'bg-gray-200'}`}
        >
          {data.allowDayNotes ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
        </button>
      </div>
      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
        <div>
          <label className="font-medium text-gray-900">Show AI Suggestions</label>
          <p className="text-sm text-gray-600">Display AI-generated suggestions for improvements</p>
        </div>
        <button
          onClick={() => onUpdate({ showAISuggestions: !data.showAISuggestions })}
          className={`p-2 rounded-lg ${data.showAISuggestions ? 'bg-primary text-white' : 'bg-gray-200'}`}
        >
          {data.showAISuggestions ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
        </button>
      </div>
    </div>
  )
}

// App Map Config Component
function AppMapConfig({ data, onUpdate }: { data: any; onUpdate: (updates: any) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
        <div>
          <label className="font-medium text-gray-900">Show Filters</label>
          <p className="text-sm text-gray-600">Display category filters (food, culture, scenic)</p>
        </div>
        <button
          onClick={() => onUpdate({ showFilters: !data.showFilters })}
          className={`p-2 rounded-lg ${data.showFilters ? 'bg-primary text-white' : 'bg-gray-200'}`}
        >
          {data.showFilters ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
        </button>
      </div>
      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
        <div>
          <label className="font-medium text-gray-900">Google Maps Integration</label>
          <p className="text-sm text-gray-600">Enable &quot;Open in Google Maps&quot; buttons</p>
        </div>
        <button
          onClick={() => onUpdate({ showGoogleMapsIntegration: !data.showGoogleMapsIntegration })}
          className={`p-2 rounded-lg ${data.showGoogleMapsIntegration ? 'bg-primary text-white' : 'bg-gray-200'}`}
        >
          {data.showGoogleMapsIntegration ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
        </button>
      </div>
      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
        <div>
          <label className="font-medium text-gray-900">Route Optimization</label>
          <p className="text-sm text-gray-600">Allow circular route optimization</p>
        </div>
        <button
          onClick={() => onUpdate({ allowRouteOptimization: !data.allowRouteOptimization })}
          className={`p-2 rounded-lg ${data.allowRouteOptimization ? 'bg-primary text-white' : 'bg-gray-200'}`}
        >
          {data.allowRouteOptimization ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
        </button>
      </div>
      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
        <div>
          <label className="font-medium text-gray-900">Show Day Selector</label>
          <p className="text-sm text-gray-600">Display day selector to switch between days</p>
        </div>
        <button
          onClick={() => onUpdate({ showDaySelector: !data.showDaySelector })}
          className={`p-2 rounded-lg ${data.showDaySelector ? 'bg-primary text-white' : 'bg-gray-200'}`}
        >
          {data.showDaySelector ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
        </button>
      </div>
    </div>
  )
}

// App Groups Config Component
function AppGroupsConfig({ data, onUpdate }: { data: any; onUpdate: (updates: any) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
        <div>
          <label className="font-medium text-gray-900">Auto-expire After Trip</label>
          <p className="text-sm text-gray-600">Groups automatically expire after trip dates</p>
        </div>
        <button
          onClick={() => onUpdate({ autoExpireAfterTrip: !data.autoExpireAfterTrip })}
          className={`p-2 rounded-lg ${data.autoExpireAfterTrip ? 'bg-primary text-white' : 'bg-gray-200'}`}
        >
          {data.autoExpireAfterTrip ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
        </button>
      </div>
      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
        <div>
          <label className="font-medium text-gray-900">Allow Public Groups</label>
          <p className="text-sm text-gray-600">Allow groups to be publicly discoverable</p>
        </div>
        <button
          onClick={() => onUpdate({ allowPublicGroups: !data.allowPublicGroups })}
          className={`p-2 rounded-lg ${data.allowPublicGroups ? 'bg-primary text-white' : 'bg-gray-200'}`}
        >
          {data.allowPublicGroups ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
        </button>
      </div>
      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
        <div>
          <label className="font-medium text-gray-900">Show Icebreakers</label>
          <p className="text-sm text-gray-600">Display icebreaker prompts in group chat</p>
        </div>
        <button
          onClick={() => onUpdate({ showIcebreakers: !data.showIcebreakers })}
          className={`p-2 rounded-lg ${data.showIcebreakers ? 'bg-primary text-white' : 'bg-gray-200'}`}
        >
          {data.showIcebreakers ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
        </button>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Max Group Size</label>
        <input
          type="number"
          value={data.maxGroupSize || 20}
          onChange={(e) => onUpdate({ maxGroupSize: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>
    </div>
  )
}

// Discover Config Component
function DiscoverConfig({ data, onUpdate }: { data: any; onUpdate: (updates: any) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Items Per Page</label>
        <input
          type="number"
          value={data.itemsPerPage || 12}
          onChange={(e) => onUpdate({ itemsPerPage: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>
      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
        <div>
          <label className="font-medium text-gray-900">Show Filters</label>
          <p className="text-sm text-gray-600">Display filter options (type, destination, etc.)</p>
        </div>
        <button
          onClick={() => onUpdate({ showFilters: !data.showFilters })}
          className={`p-2 rounded-lg ${data.showFilters ? 'bg-primary text-white' : 'bg-gray-200'}`}
        >
          {data.showFilters ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
        </button>
      </div>
      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
        <div>
          <label className="font-medium text-gray-900">Allow Sharing</label>
          <p className="text-sm text-gray-600">Enable sharing of trips and guides</p>
        </div>
        <button
          onClick={() => onUpdate({ allowSharing: !data.allowSharing })}
          className={`p-2 rounded-lg ${data.allowSharing ? 'bg-primary text-white' : 'bg-gray-200'}`}
        >
          {data.allowSharing ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
        </button>
      </div>
      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
        <div>
          <label className="font-medium text-gray-900">Show Likes</label>
          <p className="text-sm text-gray-600">Display like counts on items</p>
        </div>
        <button
          onClick={() => onUpdate({ showLikes: !data.showLikes })}
          className={`p-2 rounded-lg ${data.showLikes ? 'bg-primary text-white' : 'bg-gray-200'}`}
        >
          {data.showLikes ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
        </button>
      </div>
      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
        <div>
          <label className="font-medium text-gray-900">Show Saves</label>
          <p className="text-sm text-gray-600">Display save counts on items</p>
        </div>
        <button
          onClick={() => onUpdate({ showSaves: !data.showSaves })}
          className={`p-2 rounded-lg ${data.showSaves ? 'bg-primary text-white' : 'bg-gray-200'}`}
        >
          {data.showSaves ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
        </button>
      </div>
    </div>
  )
}

// Global Config Component
function GlobalConfig({ 
  data, 
  onUpdate
}: { 
  data: any
  onUpdate: (updates: any) => void
}) {
  const featureFlags = data.featureFlags || {}
  
  return (
    <div className="space-y-6">
      {/* Feature Flags */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Feature Flags</h3>
        <div className="space-y-3">
          {Object.entries(featureFlags).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <label className="font-medium text-gray-900 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                <p className="text-sm text-gray-600">Enable/disable {key}</p>
              </div>
              <button
                onClick={() => onUpdate({ 
                  featureFlags: { ...featureFlags, [key]: !value } 
                })}
                className={`p-2 rounded-lg ${value ? 'bg-primary text-white' : 'bg-gray-200'}`}
              >
                {value ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* UI Settings */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-4">UI Settings</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
            <input
              type="color"
              value={data.ui?.primaryColor || '#0284c7'}
              onChange={(e) => onUpdate({ ui: { ...data.ui, primaryColor: e.target.value } })}
              className="w-full h-10 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
            <input
              type="color"
              value={data.ui?.secondaryColor || '#0ea5e9'}
              onChange={(e) => onUpdate({ ui: { ...data.ui, secondaryColor: e.target.value } })}
              className="w-full h-10 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
