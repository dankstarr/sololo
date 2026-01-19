// Gemini AI Settings
export const gemini = {
  enabled: true,
  // Latest Gemini models (as of 2024):
  // gemini-2.5-flash-lite: Latest stable, cheapest, fastest (best value)
  // gemini-3-flash: Latest preview, balanced speed/capability
  // gemini-3-pro: Latest preview, highest capability
  model: 'gemini-2.5-flash-lite', // Latest stable model - fastest and most cost-effective
  maxTokens: 1000,
  temperature: 0.7,
  systemPrompt: 'You are a helpful travel assistant for Sololo, an AI-powered travel companion app. Provide personalized, practical travel advice and itinerary suggestions.',
  // API key should be in .env.local
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
  baseUrl: 'https://generativelanguage.googleapis.com/v1', // Using v1 API
  // Free tier limits (per day)
  freeTierLimits: {
    requestsPerDay: 60, // Gemini free tier: 60 requests per minute, but we'll track daily
    tokensPerDay: 15000000, // 15M tokens per day
    requestsPerMinute: 60,
  },
}
