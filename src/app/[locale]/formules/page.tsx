export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import { createClient } from '@/lib/supabase/server'
import { RESTAURANT_ID } from '@/lib/restaurant'
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
  return { title: tHero('formules'), description: tMeta('formulesDescription', { name: info.name }), alternates: alternatesFor(locale, '/formules') }
}

export default async function FormulesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const supabase = await createClient()
  const [{ data: formules }, t, tHero] = await Promise.all([
    supabase
      .from('formules')
      .select('id, nom, prix, description, elements, active')
      .eq('restaurant_id', RESTAURANT_ID)
      .eq('active', true)
      .order('created_at', { ascending: true }),
    getTranslations('formules'),
    getTranslations('hero'),
  ])

  return (
    <>
      <HeroHeader title={tHero('formules')} subtitle={t('subtitle')} />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(40px, 6vw, 72px) 24px' }}>
        {!formules || formules.length === 0 ? (
          <p className="font-secondary" style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{t('soon')}</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {formules.map((f) => (
              <div key={f.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <h2 className="font-primary" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>{f.nom}</h2>
                  <p className="font-primary" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--amber)', letterSpacing: '-0.02em', flexShrink: 0 }}>{f.prix}€</p>
                </div>
                {f.description && (
                  <p className="font-accent" style={{ fontSize: '0.95rem', color: 'var(--slate)', fontStyle: 'italic', lineHeight: 1.6 }}>{f.description}</p>
                )}
                {f.elements && f.elements.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {f.elements.map((el: string) => (
                      <span key={el} className="font-secondary" style={{ fontSize: '0.8rem', padding: '4px 12px', borderRadius: 99, background: 'var(--pine-light)', color: 'var(--pine)', fontWeight: 500 }}>{el}</span>
                    ))}
                  </div>
                )}
                <Link href="/reservation" style={{ textDecoration: 'none', marginTop: 'auto' }}>
                  <span className="font-secondary" style={{ display: 'block', textAlign: 'center', width: '100%', padding: '11px', borderRadius: 10, background: 'var(--pine)', color: 'var(--paper)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                    {t('reserveWith')}
                  </span>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
