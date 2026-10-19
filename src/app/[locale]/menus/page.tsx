export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Image from 'next/image'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getMenuData, getMenuFileUrl } from '@/lib/menu'
import { getRestaurantInfo } from '@/lib/restaurant-contact'
import { HeroHeader } from '@/components/HeroHeader'
import { FormulaPopup } from '@/components/FormulaPopup'
import { alternatesFor } from '@/lib/i18n-meta'
import { siteConfig } from '@/config/site'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const [tMeta, tHero, info] = await Promise.all([
    getTranslations({ locale, namespace: 'meta' }),
    getTranslations({ locale, namespace: 'hero' }),
    getRestaurantInfo(),
  ])
  return { title: tHero('menus'), description: tMeta('menuDescription', { name: info.name }), alternates: alternatesFor(locale, '/menus') }
}

export default async function MenusPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const [categories, t, tHero] = await Promise.all([
    getMenuData(),
    getTranslations('menus'),
    getTranslations('hero'),
  ])

  const formulaCat = siteConfig.menu.formulaCategoryName
    ? categories.find((c) => c.name === siteConfig.menu.formulaCategoryName)
    : undefined
  const formulaImages = formulaCat?.files.map((f) => getMenuFileUrl(f.file_path)) ?? []

  return (
    <>
      <HeroHeader title={tHero('menus')} subtitle={t('subtitle')} />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(40px, 6vw, 72px) 24px' }}>
        {categories.length === 0 ? (
          <p className="font-secondary" style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{t('soon')}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(48px, 7vw, 72px)' }}>
            {categories.map((cat) => (
              <section key={cat.id}>
                <h2 className="font-primary" style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: 24, paddingBottom: 12, borderBottom: '1.5px solid var(--border)' }}>
                  {cat.name}
                </h2>
                {cat.files.length === 0 ? (
                  <p className="font-secondary" style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>{t('emptyCategory')}</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                    {cat.files.map((f, i) => (
                      <div key={f.id} style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)', position: 'relative', aspectRatio: '800 / 1130', background: 'var(--surface-alt)', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
                        <Image src={getMenuFileUrl(f.file_path)} alt={`${cat.name} — ${i + 1}`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" style={{ objectFit: 'cover' }} priority={i === 0} />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </div>

      <FormulaPopup images={formulaImages} showFloatingButton />
    </>
  )
}
