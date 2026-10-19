export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getRestaurantInfo } from '@/lib/restaurant-contact'
import { HeroHeader } from '@/components/HeroHeader'
import { alternatesFor } from '@/lib/i18n-meta'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const [tMeta, tHero, info] = await Promise.all([
    getTranslations({ locale, namespace: 'meta' }),
    getTranslations({ locale, namespace: 'hero' }),
    getRestaurantInfo(),
  ])
  return { title: tHero('about'), description: tMeta('aboutDescription', { name: info.name }), alternates: alternatesFor(locale, '/apropos') }
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const [t, tHero] = await Promise.all([getTranslations('about'), getTranslations('hero')])
  const members = t.raw('members') as { title: string; body: string }[]

  return (
    <>
      <HeroHeader title={tHero('about')} subtitle={t('subtitle')} />

      <div style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(40px, 6vw, 72px) 24px', display: 'flex', flexDirection: 'column', gap: 'clamp(32px, 5vw, 56px)' }}>
        {members.map((m, i) => (
          <section key={i} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 className="font-primary" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.9rem)', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em' }}>{m.title}</h2>
            <p className="font-accent" style={{ fontSize: '1.1rem', color: 'var(--slate)', lineHeight: 1.75, fontStyle: 'italic' }}>{m.body}</p>
          </section>
        ))}
      </div>
    </>
  )
}
