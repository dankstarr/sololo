import { NextRequest, NextResponse } from 'next/server'
import { GoogleAuth } from 'google-auth-library'
import { withAdmin } from '@/lib/auth/server'

interface GCPUsageData {
  gemini?: {
    requestsToday: number
    tokensToday: number
    requestsThisHour: number
    errorsToday: number
  }
  maps?: {
    requestsToday: number
    requestsThisHour: number
    geocodeRequests: number
    placesRequests: number
    directionsRequests: number
    errorsToday: number
  }
  projectId?: string
  lastUpdated?: string
  error?: string
  configured: boolean
  setupInstructions?: string
}

/**
 * Fetch API usage from Google Cloud Monitoring API
 * 
 * Setup Instructions:
 * 1. Set GOOGLE_CLOUD_PROJECT_ID environment variable
 * 2. Option A: Set GOOGLE_APPLICATION_CREDENTIALS to path of service account JSON
 *    Option B: Run `gcloud auth application-default login` for local dev
 * 3. Enable Cloud Monitoring API in your GCP project
 */
async function handleGet(request: NextRequest) {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.GCLOUD_PROJECT
  
  if (!projectId) {
    return NextResponse.json({
      error: 'GCP Project ID not configured',
      configured: false,
      setupInstructions: 'Set GOOGLE_CLOUD_PROJECT_ID environment variable with your GCP project ID',
    } as GCPUsageData, { status: 200 })
  }

  try {
    // Production-grade auth:
    // - On Cloud Run/GKE/etc: Application Default Credentials via metadata server (Workload Identity)
    // - On other hosts (e.g. Vercel): provide service account JSON via env (GOOGLE_APPLICATION_CREDENTIALS / GOOGLE_APPLICATION_CREDENTIALS_JSON)
    const accessToken = await getAccessToken()
    
    if (!accessToken) {
      return NextResponse.json({
        error: 'GCP credentials not configured',
        configured: false,
        projectId,
        setupInstructions:
          'Production (recommended): run on GCP with Workload Identity (ADC) so no keys are needed.\n' +
          'Non-GCP hosts: set GOOGLE_APPLICATION_CREDENTIALS_JSON (service account JSON) OR GOOGLE_APPLICATION_CREDENTIALS (path to JSON).',
        // Safe debug hints (no secrets)
        debug: {
          hasCredentialsJson: Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON),
          credentialsJsonLength: process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
            ? process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON.length
            : 0,
          hasCredentialsPath: Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS),
        },
      } as GCPUsageData, { status: 200 })
    }

    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    // Fetch Gemini API usage
    const geminiUsage = await fetchApiUsage(
      accessToken,
      projectId,
      'generativelanguage.googleapis.com',
      oneDayAgo,
      oneHourAgo
    )

    // Fetch Google Maps API usage  
    const mapsUsage = await fetchApiUsage(
      accessToken,
      projectId,
      'maps.googleapis.com',
      oneDayAgo,
      oneHourAgo
    )

    return NextResponse.json({
      gemini: geminiUsage,
      maps: mapsUsage,
      projectId,
      lastUpdated: now.toISOString(),
      configured: true,
    } as GCPUsageData)
  } catch (error) {
    console.error('Error fetching GCP usage:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch GCP usage data'
    
    // If error is about "no time series" or "invalid combination", that's expected
    // (metrics may not exist yet for new projects or unused APIs)
    if (errorMessage.includes('no time series') || 
        errorMessage.includes('invalid combination') ||
        errorMessage.includes('will not return any time series')) {
      return NextResponse.json({
        gemini: { requestsToday: 0, requestsThisHour: 0, errorsToday: 0 },
        maps: { requestsToday: 0, requestsThisHour: 0, errorsToday: 0 },
        projectId,
        lastUpdated: new Date().toISOString(),
        configured: true,
        error: 'No usage metrics available yet. Metrics appear after API calls are made.',
      } as GCPUsageData, { status: 200 })
    }
    
    return NextResponse.json({
      error: errorMessage,
      configured: true,
      projectId,
      setupInstructions: 'Ensure Cloud Monitoring API is enabled in your GCP project',
    } as GCPUsageData, { status: 200 })
  }
}

// Export with admin protection
export const GET = withAdmin(handleGet)

/**
 * Get OAuth2 access token for GCP API calls
 * Tries: gcloud CLI token (local dev) -> service account -> null
 */
async function getAccessToken(): Promise<string | null> {
  const hadCredentialsJson = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
  const hadCredentialsPath = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  try {
    const scopes = ['https://www.googleapis.com/auth/cloud-platform']

    // Optional: allow providing SA JSON directly as an env var (best for platforms like Vercel)
    const json = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
    let credentials: any | undefined
    if (json) {
      try {
        credentials = JSON.parse(json)
      } catch (e) {
        // Most common cause: value contains invalid JSON like { \"type\": ... } (backslash-escaped quotes).
        // Surface a safe error that helps the user fix formatting without leaking secrets.
        throw new Error(
          `Invalid GOOGLE_APPLICATION_CREDENTIALS_JSON (must be raw JSON, not backslash-escaped). Parse error: ${
            e instanceof Error ? e.message : String(e)
          }`
        )
      }
    }

    // In local dev, if no explicit credentials were provided and we're not on a GCP runtime,
    // avoid hanging while google-auth-library probes metadata server / ADC.
    const isLikelyGcpRuntime = Boolean(
      process.env.K_SERVICE || // Cloud Run
        process.env.GAE_SERVICE || // App Engine
        process.env.GCE_METADATA_HOST || // GCE
        process.env.KUBERNETES_SERVICE_HOST // GKE
    )
    const hasCredentialsEnv = Boolean(credentials || process.env.GOOGLE_APPLICATION_CREDENTIALS)
    if (!isLikelyGcpRuntime && !hasCredentialsEnv) {
      return null
    }

    const auth = new GoogleAuth({
      scopes,
      ...(credentials ? { credentials } : {}),
    })

    // Fail fast if credential discovery is slow
    const client = await withTimeout(auth.getClient(), 2000, 'ADC discovery timed out')
    const tokenResponse = await withTimeout(client.getAccessToken(), 2000, 'Token fetch timed out')
    return tokenResponse?.token || null
  } catch (error) {
    // If env var is present but malformed, surface the real cause to the caller/UI.
    if (error instanceof Error && error.message.startsWith('Invalid GOOGLE_APPLICATION_CREDENTIALS_JSON')) {
      throw error
    }
    // If the user provided credentials and auth still fails, surface the error (don't silently degrade to "not configured").
    if (hadCredentialsJson || hadCredentialsPath) {
      throw error instanceof Error ? error : new Error(String(error))
    }
    console.error('Error getting access token:', error)
    return null
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error(message)), ms)
    promise
      .then((v) => {
        clearTimeout(id)
        resolve(v)
      })
      .catch((err) => {
        clearTimeout(id)
        reject(err)
      })
  })
}

/**
 * Fetch API usage metrics from Cloud Monitoring
 * Uses the correct metric and resource type for consumed API metrics
 */
async function fetchApiUsage(
  accessToken: string,
  projectId: string,
  serviceName: string,
  startTime: Date,
  endTime: Date
): Promise<{
  requestsToday: number
  requestsThisHour: number
  errorsToday: number
  tokensToday?: number
  geocodeRequests?: number
  placesRequests?: number
  directionsRequests?: number
}> {
  // Try multiple filter formats - different APIs may use different resource types
  // Format 1: consumed_api (most common for consumed APIs)
  let filter = `metric.type="serviceruntime.googleapis.com/api/request_count" AND resource.type="consumed_api" AND resource.labels.service_name="${serviceName}"`
  
  let requestCountUrl = `https://monitoring.googleapis.com/v3/projects/${projectId}/timeSeries?` +
    `filter=${encodeURIComponent(filter)}` +
    `&interval.startTime=${startTime.toISOString()}` +
    `&interval.endTime=${endTime.toISOString()}` +
    `&aggregation.alignmentPeriod=3600s` +
    `&aggregation.perSeriesAligner=ALIGN_SUM`

  let response = await fetch(requestCountUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  // If consumed_api fails, try with 'api' resource type (alternative format)
  if (!response.ok) {
    const errorText = await response.text()
    // Try alternative: 'api' resource type instead of 'consumed_api'
    filter = `metric.type="serviceruntime.googleapis.com/api/request_count" AND resource.type="api" AND resource.labels.service="${serviceName}"`
    requestCountUrl = `https://monitoring.googleapis.com/v3/projects/${projectId}/timeSeries?` +
      `filter=${encodeURIComponent(filter)}` +
      `&interval.startTime=${startTime.toISOString()}` +
      `&interval.endTime=${endTime.toISOString()}` +
      `&aggregation.alignmentPeriod=3600s` +
      `&aggregation.perSeriesAligner=ALIGN_SUM`
    
    response = await fetch(requestCountUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  }

  // If both fail, return empty results (metrics may not exist yet or API not enabled)
  if (!response.ok) {
    const errorText = await response.text()
    // If it's a 400 with "no time series" or "invalid combination" message, 
    // that means the metric/resource combo doesn't exist (common for new projects or APIs without usage yet)
    // This is normal - metrics appear after APIs are actually used
    if (response.status === 400 && (
      errorText.includes('no time series') || 
      errorText.includes('invalid combination') ||
      errorText.includes('will not return any time series') ||
      errorText.includes('INVALID_ARGUMENT')
    )) {
      // Return empty results - this is expected if the API hasn't been used yet
      return {
        requestsToday: 0,
        requestsThisHour: 0,
        errorsToday: 0,
      }
    }
    // For other errors, still throw so we can see what went wrong
    throw new Error(`GCP Monitoring API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  
  let requestsToday = 0
  let requestsThisHour = 0
  let errorsToday = 0

  if (data.timeSeries) {
    for (const series of data.timeSeries) {
      if (series.points) {
        const responseCodeClass = series.metric?.labels?.response_code_class || ''
        for (const point of series.points) {
          const value = parseInt(
            point.value?.int64Value || 
            point.value?.doubleValue?.toString() || 
            '0', 
            10
          )
          const pointTime = new Date(point.interval?.endTime || 0)
          
          if (pointTime >= startTime) {
            requestsToday += value
          }
          const oneHourAgo = new Date(endTime.getTime() - 60 * 60 * 1000)
          if (pointTime >= oneHourAgo) {
            requestsThisHour += value
          }
          
          if (responseCodeClass.startsWith('4') || responseCodeClass.startsWith('5')) {
            errorsToday += value
          }
        }
      }
    }
  }

  return {
    requestsToday,
    requestsThisHour,
    errorsToday,
  }
}
