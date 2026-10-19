import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/i18n-meta'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/reservation-autoreply'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
