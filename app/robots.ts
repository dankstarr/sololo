import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/app/*/chat', '/api/'],
    },
    sitemap: 'https://sololo.com/sitemap.xml',
  }
}
