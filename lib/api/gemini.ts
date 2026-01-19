// Gemini API Integration
import { gemini } from '@/config/gemini'
import { geminiCache } from '@/lib/utils/cache'

interface GeminiMessage {
  role: 'user' | 'model'
  parts: Array<{ text: string }>
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>
    }
  }>
}

// Track API usage
interface UsageStats {
  requestsToday: number
  tokensToday: number
  requestsThisMinute: number
  lastRequestTime: number
}

let usageStats: UsageStats = {
  requestsToday: 0,
  tokensToday: 0,
  requestsThisMinute: 0,
  lastRequestTime: 0,
}

// Load usage stats from localStorage
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('gemini_usage_stats')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      // Reset if it's a new day
      const today = new Date().toDateString()
      const savedDate = parsed.date
      if (savedDate === today) {
        usageStats = { ...parsed.stats, lastRequestTime: 0, requestsThisMinute: 0 }
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
}

function saveUsageStats() {
  if (typeof window !== 'undefined') {
    localStorage.setItem(
      'gemini_usage_stats',
      JSON.stringify({
        date: new Date().toDateString(),
        stats: usageStats,
      })
    )
  }
}

function checkRateLimit(): { allowed: boolean; reason?: string } {
  const limits = gemini.freeTierLimits
  const now = Date.now()

  // Reset minute counter if a minute has passed
  if (now - usageStats.lastRequestTime > 60000) {
    usageStats.requestsThisMinute = 0
    usageStats.lastRequestTime = now
  }

  // More conservative limits to avoid 429 errors
  // Use 50% of the limit to be safe
  const safeDailyLimit = Math.floor(limits.requestsPerDay * 0.5)
  const safeMinuteLimit = Math.floor(limits.requestsPerMinute * 0.5)

  // Check daily limit
  if (usageStats.requestsToday >= safeDailyLimit) {
    return { allowed: false, reason: 'Daily request limit reached' }
  }

  // Check per-minute limit (more conservative)
  if (usageStats.requestsThisMinute >= safeMinuteLimit) {
    return { allowed: false, reason: 'Rate limit: Too many requests per minute' }
  }

  // Check token limit (rough estimate: 1 request ≈ 1000 tokens)
  const estimatedTokens = usageStats.requestsToday * 1000
  if (estimatedTokens >= limits.tokensPerDay) {
    return { allowed: false, reason: 'Daily token limit reached' }
  }

  return { allowed: true }
}

function incrementUsage(estimatedTokens: number = 1000) {
  usageStats.requestsToday++
  usageStats.requestsThisMinute++
  usageStats.tokensToday += estimatedTokens
  usageStats.lastRequestTime = Date.now()
  saveUsageStats()
}

export function getUsageStats(): UsageStats {
  return { ...usageStats }
}

export function resetUsageStats() {
  usageStats = {
    requestsToday: 0,
    tokensToday: 0,
    requestsThisMinute: 0,
    lastRequestTime: 0,
  }
  saveUsageStats()
}

async function callGeminiAPI(prompt: string, systemInstruction?: string): Promise<string> {
  if (!gemini.enabled || !gemini.apiKey) {
    throw new Error('Gemini API not configured')
  }

  // Check cache first
  const cacheKey = geminiCache.key('gemini-api', { prompt, systemInstruction })
  const cached = geminiCache.get<string>(cacheKey)
  if (cached) {
    console.log('Gemini API: Cache hit')
    return cached
  }

  const rateLimit = checkRateLimit()
  if (!rateLimit.allowed) {
    throw new Error(rateLimit.reason || 'Rate limit exceeded')
  }

  // Try multiple models in order of preference (latest first, then fallbacks)
  const modelsToTry = [
    gemini.model, // Primary model from config (latest stable)
    'gemini-2.5-flash-lite', // Latest stable, cheapest
    'gemini-3-flash', // Latest preview, balanced
    'gemini-3-pro', // Latest preview, highest capability
    'gemini-1.5-flash-latest', // Fallback: older latest
    'gemini-1.5-flash-002', // Fallback: specific version
    'gemini-1.5-flash', // Fallback: alternative name
  ]

  // Remove duplicates
  const uniqueModels = [...new Set(modelsToTry)]

  let lastError: Error | null = null

  for (const model of uniqueModels) {
    try {
      // Try v1 API first
      let url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${gemini.apiKey}`
      
      // v1 API structure - systemInstruction needs to be included differently
      // For v1 API, we'll prepend system instruction to the prompt
      const fullPrompt = systemInstruction 
        ? `${systemInstruction}\n\n${prompt}`
        : prompt

      const requestBody: any = {
        contents: [
          {
            parts: [{ text: fullPrompt }],
          },
        ],
        generationConfig: {
          temperature: gemini.temperature,
          maxOutputTokens: gemini.maxTokens,
        },
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        // If 404 or 400 (bad request), try next model
        if (response.status === 404 || response.status === 400) {
          console.warn(`Model ${model} failed with ${response.status}, trying next...`)
          lastError = new Error(`Gemini API error: ${response.status} - ${errorText}`)
          continue
        }
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
      }

      const data: GeminiResponse = await response.json()

      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response from Gemini API')
      }

      const text = data.candidates[0].content.parts[0].text
      // Rough estimate: Gemini uses ~4 characters per token, but we'll be conservative
      const estimatedTokens = Math.ceil(text.length / 3)
      incrementUsage(estimatedTokens)

      // Cache the result (cache for 1 hour)
      geminiCache.set(cacheKey, text, 60 * 60 * 1000)

      console.log(`Successfully used model: ${model}`)
      return text
    } catch (error) {
      // If it's a 404 or model not found, try next model
      if (error instanceof Error && (error.message.includes('404') || error.message.includes('not found'))) {
        console.warn(`Model ${model} failed, trying next...`)
        lastError = error
        continue
      }
      // For other errors, throw immediately
      throw error
    }
  }

  // If all models failed, throw the last error
  throw lastError || new Error('All Gemini models failed')
}

export async function generateItinerary(
  destination: string,
  days: number,
  interests: string[],
  travelMode: string,
  pace: string
): Promise<string> {
  const prompt = `Create a detailed ${days}-day travel itinerary for ${destination}. 
Travel style: ${pace} pace, ${travelMode} mode
Interests: ${interests.join(', ')}
Include: daily schedule, recommended locations, estimated times, and practical tips.`

  try {
    return await callGeminiAPI(prompt, gemini.systemPrompt)
  } catch (error) {
    // Fallback to placeholder response
    return `Here's a ${days}-day itinerary for ${destination} focusing on ${interests.join(', ')}. This is a placeholder response. Enable Gemini API to get AI-generated itineraries.`
  }
}

export async function generateLocationExplanation(
  locationName: string,
  destination: string,
  interests: string[]
): Promise<string> {
  const prompt = `Explain why ${locationName} in ${destination} is worth visiting, especially for someone interested in ${interests.join(', ')}. Keep it concise (2-3 sentences).`

  try {
    return await callGeminiAPI(prompt, gemini.systemPrompt)
  } catch (error) {
    return `Why visit ${locationName}? This location is perfect for your interests in ${interests.join(', ')}.`
  }
}

export async function generateAlternativeLocation(
  currentLocation: string,
  destination: string,
  interests: string[]
): Promise<string> {
  const prompt = `Suggest a similar alternative location to ${currentLocation} in ${destination} that matches interests in ${interests.join(', ')}. Just return the location name.`

  try {
    const response = await callGeminiAPI(prompt, gemini.systemPrompt)
    return response.trim().split('\n')[0].replace(/^[-•]\s*/, '').trim()
  } catch (error) {
    return `Alternative to ${currentLocation}`
  }
}

export async function generateAudioGuideScript(
  locationName: string,
  destination: string
): Promise<string> {
  const prompt = `Write a 2-3 minute audio guide script for ${locationName} in ${destination}. Make it engaging, informative, and suitable for walking while listening. Include historical context, interesting facts, and what to look for.`

  try {
    return await callGeminiAPI(prompt, gemini.systemPrompt)
  } catch (error) {
    return `Welcome to ${locationName} in ${destination}. This is a placeholder audio guide script.`
  }
}

export async function generateLocationSuggestions(
  destination: string,
  days: number,
  interests: string[]
): Promise<string[]> {
  const targetCount = 25 // Always generate 20-25 locations
  const prompt = `Generate a list of ${targetCount} must-visit locations in ${destination} for a ${days}-day trip. 
Interests: ${interests.join(', ') || 'general tourism'}
Return ONLY a JSON array of location names, like: ["Location 1", "Location 2", "Location 3"]
Do not include any other text, just the JSON array.`

  try {
    const response = await callGeminiAPI(prompt, gemini.systemPrompt)
    // Try to parse as JSON array
    const cleaned = response.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed)) {
      return parsed.slice(0, targetCount) // Limit to requested number
    }
    // Fallback: try to extract from text
    const lines = cleaned.split('\n').filter(line => line.trim().startsWith('"') || line.trim().startsWith('-'))
    return lines.map(line => line.replace(/^[-•]\s*/, '').replace(/^["']|["']$/g, '').trim()).filter(Boolean).slice(0, targetCount)
  } catch (error) {
    console.error('Error parsing location suggestions:', error)
    // Return empty array - will fallback to Google Places search
    return []
  }
}

// Combined function: Get locations WITH explanations in ONE API call
export async function generateLocationsWithExplanations(
  destination: string,
  days: number,
  interests: string[],
  locationNames: string[]
): Promise<Array<{ name: string; explanation: string }>> {
  if (locationNames.length === 0) {
    return []
  }

  const prompt = `For a ${days}-day trip to ${destination} with interests in ${interests.join(', ') || 'general tourism'}, provide a brief explanation (2-3 sentences) for why each of these locations is worth visiting:

${locationNames.map((name, idx) => `${idx + 1}. ${name}`).join('\n')}

Return ONLY a valid JSON array where each object has "name" and "explanation" fields, like:
[
  {"name": "Location 1", "explanation": "Why visit this place..."},
  {"name": "Location 2", "explanation": "Why visit this place..."}
]
Do not include any other text, just the JSON array.`

  try {
    const response = await callGeminiAPI(prompt, gemini.systemPrompt)
    // Try to parse as JSON array
    const cleaned = response.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)
    
    if (Array.isArray(parsed)) {
      return parsed.map((item: any) => ({
        name: item.name || item.location || '',
        explanation: item.explanation || item.description || `Worth visiting in ${destination}`
      })).filter((item: any) => item.name)
    }
    
    // Fallback: return with basic explanations
    return locationNames.map(name => ({
      name,
      explanation: `A must-visit location in ${destination} perfect for your interests in ${interests.join(', ') || 'general tourism'}.`
    }))
  } catch (error) {
    console.error('Error parsing locations with explanations:', error)
    // Fallback: return with basic explanations
    return locationNames.map(name => ({
      name,
      explanation: `A must-visit location in ${destination} perfect for your interests in ${interests.join(', ') || 'general tourism'}.`
    }))
  }
}
