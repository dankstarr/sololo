/**
 * Environment Variable Validation
 * Validates all required environment variables on startup
 */

interface EnvVar {
  name: string
  required: boolean
  serverOnly?: boolean
  validator?: (value: string) => boolean
  warning?: string
}

const envVars: EnvVar[] = [
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    validator: (v) => v.startsWith('https://'),
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    validator: (v) => v.length > 20,
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    serverOnly: true,
    validator: (v) => v.length > 20,
  },
  {
    name: 'NEXT_PUBLIC_GEMINI_API_KEY',
    required: false,
    warning: '⚠️  WARNING: This key is exposed to the browser. Consider using server-side proxy.',
  },
  {
    name: 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
    required: false,
    warning: '⚠️  WARNING: This key is exposed to the browser. Restrict it in Google Cloud Console.',
  },
  {
    name: 'GEMINI_API_KEY',
    required: false,
    serverOnly: true,
    warning: '✅ RECOMMENDED: Use this server-only key instead of NEXT_PUBLIC_GEMINI_API_KEY',
  },
  {
    name: 'ADMIN_EMAILS',
    required: false,
    serverOnly: true,
  },
]

export function validateEnvironmentVariables() {
  const errors: string[] = []
  const warnings: string[] = []
  
  for (const envVar of envVars) {
    const value = process.env[envVar.name]
    
    // Check if required variable is missing
    if (envVar.required && !value) {
      errors.push(`Missing required environment variable: ${envVar.name}`)
      continue
    }
    
    // Skip validation if variable doesn't exist
    if (!value) continue
    
    // Validate format if validator provided
    if (envVar.validator && !envVar.validator(value)) {
      errors.push(`Invalid format for ${envVar.name}`)
      continue
    }
    
    // Check for exposed keys in production
    if (envVar.serverOnly && value && process.env.NODE_ENV === 'production') {
      if (envVar.name.startsWith('NEXT_PUBLIC_')) {
        warnings.push(`⚠️  ${envVar.name} is exposed to browser but marked as server-only`)
      }
    }
    
    // Show warnings
    if (envVar.warning && value) {
      warnings.push(envVar.warning)
    }
  }
  
  // Check for exposed secrets
  const exposedSecrets = [
    'NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_GCP_SERVICE_ACCOUNT',
  ]
  
  for (const secret of exposedSecrets) {
    if (process.env[secret]) {
      errors.push(`CRITICAL: ${secret} should NEVER be exposed to browser (remove NEXT_PUBLIC_ prefix)`)
    }
  }
  
  // Log errors
  if (errors.length > 0) {
    console.error('❌ Environment Variable Errors:')
    errors.forEach(err => console.error(`  ${err}`))
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Environment validation failed: ${errors.join(', ')}`)
    }
  }
  
  // Log warnings
  if (warnings.length > 0) {
    console.warn('⚠️  Environment Variable Warnings:')
    warnings.forEach(warn => console.warn(`  ${warn}`))
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

// Validate on module load (server-side only)
if (typeof window === 'undefined') {
  validateEnvironmentVariables()
}
