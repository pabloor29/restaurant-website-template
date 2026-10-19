import { defineRouting } from 'next-intl/routing'
import { createNavigation } from 'next-intl/navigation'

export const routing = defineRouting({
  // Add/remove a locale here and drop a matching messages/<locale>.json file.
  locales: ['fr', 'en', 'es', 'it'],
  defaultLocale: 'fr',
  // Default locale keeps clean URLs (/reservation); the others are prefixed
  // (/en/reservation). Preserves the default-language SEO.
  localePrefix: 'as-needed',
  // Never auto-switch from the browser's Accept-Language — the visitor picks a
  // language from the navbar switcher. Default locale always wins otherwise.
  localeDetection: false,
})

export type Locale = (typeof routing.locales)[number]

// Locale-aware navigation helpers — use these instead of next/link &
// next/navigation so links keep the current language.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
