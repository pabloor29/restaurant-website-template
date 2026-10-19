import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'
import { localePath } from '@/lib/i18n-meta'

// path → priority
const ROUTES: { path: string; priority: number }[] = [
  { path: '', priority: 1.0 },
  { path: '/menus', priority: 0.9 },
  { path: '/reservation', priority: 0.9 },
  { path: '/formules', priority: 0.8 },
  { path: '/evenements', priority: 0.8 },
  { path: '/contact', priority: 0.8 },
  { path: '/apropos', priority: 0.7 },
  { path: '/mentions-legales', priority: 0.3 },
  { path: '/politique-confidentialite', priority: 0.3 },
  { path: '/cgu', priority: 0.3 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return ROUTES.flatMap(({ path, priority }) => {
    const languages: Record<string, string> = {}
    for (const l of routing.locales) languages[l] = localePath(l, path)
    languages['x-default'] = localePath(routing.defaultLocale, path)

    return routing.locales.map((locale) => ({
      url: localePath(locale, path),
      lastModified,
      priority,
      alternates: { languages },
    }))
  })
}
