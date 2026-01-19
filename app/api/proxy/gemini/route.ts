import { NextRequest, NextResponse } from 'next/server'
import { secureRoute, validateRequestBody, validators } from '@/lib/security/middleware'

/**
 * Proxy endpoint for Gemini API calls
 * Keeps API key server-side only
 */
async function handlePost(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Validate request body
    const validation = validateRequestBody(body, {
      prompt: validators.string(1, 10000),
      systemInstruction: validators.string(0, 1000),
    })
    
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid request', errors: validation.errors },
        { status: 400 }
      )
    }
    
    const { prompt, systemInstruction } = validation.sanitized
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY
    
    if (!apiKey) {
      console.error('Gemini API key not configured')
      return NextResponse.json(
        { error: 'API not configured' },
        { status: 500 }
      )
    }
    
    // Make request to Gemini API (server-side only)
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite'
    const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`
    
    const fullPrompt = systemInstruction 
      ? `${systemInstruction}\n\n${prompt}`
      : prompt
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: fullPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      }),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', response.status, errorText)
      return NextResponse.json(
        { error: 'AI service error', message: 'Failed to generate response' },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    
    if (!data.candidates || data.candidates.length === 0) {
      return NextResponse.json(
        { error: 'No response from AI service' },
        { status: 500 }
      )
    }
    
    const text = data.candidates[0].content.parts[0].text
    
    return NextResponse.json({ text })
  } catch (error) {
    console.error('Error in Gemini proxy:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export with security middleware (rate limiting, request size limits)
export const POST = secureRoute(handlePost, {
  rateLimit: {
    maxRequests: 10, // 10 requests per minute per IP/user
    windowMs: 60 * 1000,
  },
  maxRequestSize: 100 * 1024, // 100KB max
})
