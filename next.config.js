/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false, // Remove X-Powered-By header for security
  
  // Security headers (additional to middleware)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
        ],
      },
    ]
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
        pathname: '/maps/api/place/photo/**',
      },
    ],
  },
  // experimental: {
  //   optimizeCss: true, // Requires 'critters' package
  // },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  webpack: (config, { dev }) => {
    // Cursor can save frequently while applying changes; debounce rebuilds in dev
    // so hot-reloads happen after a short quiet period instead of per-save.
    if (dev) {
      config.watchOptions = {
        ...(config.watchOptions || {}),
        // Wait for a longer quiet period (ms) before rebuilding.
        // This helps prevent recompiles while Cursor’s agent is rapidly editing files.
        aggregateTimeout: 15000,
        // Keep default polling behavior; just ensure common folders are ignored.
        ignored: [
          '**/.git/**',
          '**/.next/**',
          '**/node_modules/**',
        ],
      }
    }
    return config
  },
}

module.exports = nextConfig
