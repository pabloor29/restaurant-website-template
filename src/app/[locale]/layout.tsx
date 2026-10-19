import type { Metadata } from 'next'
import { Schibsted_Grotesk, Hanken_Grotesk, Newsreader } from 'next/font/google'
import { notFound } from 'next/navigation'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import { Analytics } from '@vercel/analytics/react'
import '../globals.css'

import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { routing } from '@/i18n/routing'
import { SITE_URL, alternatesFor, ogLocale } from '@/lib/i18n-meta'
import { siteConfig } from '@/config/site'
import { getRestaurantInfo } from '@/lib/restaurant-contact'
import { getOpeningHours, toSchemaOpeningHours } from '@/lib/opening-hours'
import { SHOW_PHONE, normalizePhone } from '@/lib/phone'

// Every page renders live data (hours, reservation slots, menus), so render
// on-demand per request rather than freezing content at build time.
export const dynamic = 'force-dynamic'

const schibsted = Schibsted_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-primary-loaded',
  display: 'swap',
})
const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-secondary-loaded',
  display: 'swap',
})
const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['italic'],
  weight: ['400', '500'],
  variable: '--font-accent-loaded',
  display: 'swap',
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const [t, info] = await Promise.all([
    getTranslations({ locale, namespace: 'meta' }),
    getRestaurantInfo(),
  ])
  const name = info.name
  const description = t('defaultDescription', { name })

  return {
    title: { default: name, template: `%s — ${name}` },
    description,
    metadataBase: new URL(SITE_URL),
    alternates: alternatesFor(locale, ''),
    openGraph: {
      type: 'website',
      locale: ogLocale(locale),
      alternateLocale: routing.locales.filter((l) => l !== locale).map(ogLocale),
      url: alternatesFor(locale, '').canonical,
      siteName: name,
      title: name,
      description,
      images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: name,
      description,
      images: [siteConfig.ogImage],
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
    icons: { icon: siteConfig.icon },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)

  const [messages, info, hours] = await Promise.all([
    getMessages(),
    getRestaurantInfo(),
    getOpeningHours(),
  ])

  const schemaHours = hours ? toSchemaOpeningHours(hours) : []

  const restaurantJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: info.name,
    url: SITE_URL,
    image: `${SITE_URL}${siteConfig.ogImage}`,
    ...(info.address ? { address: { '@type': 'PostalAddress', streetAddress: info.address.replace(/\n/g, ', ') } } : {}),
    ...(siteConfig.maps.lat && siteConfig.maps.lng
      ? { geo: { '@type': 'GeoCoordinates', latitude: siteConfig.maps.lat, longitude: siteConfig.maps.lng } }
      : {}),
    ...(SHOW_PHONE && info.phone ? { telephone: normalizePhone(info.phone) } : {}),
    servesCuisine: siteConfig.cuisine,
    priceRange: siteConfig.priceRange,
    acceptsReservations: `${SITE_URL}/reservation`,
    hasMenu: `${SITE_URL}/menus`,
    currenciesAccepted: 'EUR',
    paymentAccepted: 'Cash, Credit Card',
    ...(schemaHours.length > 0 ? { openingHours: schemaHours } : {}),
    ...(siteConfig.rating.count > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: String(siteConfig.rating.value),
            reviewCount: String(siteConfig.rating.count),
            bestRating: '5',
            worstRating: '1',
          },
        }
      : {}),
  }

  return (
    <html lang={locale} className={`${schibsted.variable} ${hanken.variable} ${newsreader.variable}`}>
      <head>
        <style>{`
          :root {
            --font-primary: var(--font-primary-loaded, 'Schibsted Grotesk', sans-serif);
            --font-secondary: var(--font-secondary-loaded, 'Hanken Grotesk', sans-serif);
            --font-accent: var(--font-accent-loaded, 'Newsreader', serif);
          }
        `}</style>
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantJsonLd) }}
        />
        <NextIntlClientProvider messages={messages}>
          <Navbar restaurantName={info.name} />
          <main>{children}</main>
          <Footer />
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  )
}
