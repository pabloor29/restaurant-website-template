export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import { getOpeningHours, DAYS_FR } from '@/lib/opening-hours'
import { getRestaurantInfo } from '@/lib/restaurant-contact'
import { SHOW_PHONE, telHref } from '@/lib/phone'
import { HeroHeader } from '@/components/HeroHeader'
import { alternatesFor } from '@/lib/i18n-meta'
import { siteConfig } from '@/config/site'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const [tMeta, tHero, info] = await Promise.all([
    getTranslations({ locale, namespace: 'meta' }),
    getTranslations({ locale, namespace: 'hero' }),
    getRestaurantInfo(),
  ])
  return { title: tHero('contact'), description: tMeta('contactDescription', { name: info.name }), alternates: alternatesFor(locale, '/contact') }
}

const LANG_KEY: Record<string, 'langEnglish' | 'langSpanish' | 'langItalian'> = {
  en: 'langEnglish',
  es: 'langSpanish',
  it: 'langItalian',
}

const labelStyle: React.CSSProperties = { fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 4 }

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const [info, hours, t, tHero, tRoot] = await Promise.all([
    getRestaurantInfo(),
    getOpeningHours(),
    getTranslations('contact'),
    getTranslations('hero'),
    getTranslations(),
  ])
  const week = tRoot.raw('week') as string[]
  const am = siteConfig.amenities

  const addressOneLine = info.address.replace(/\n/g, ', ')
  const mapSrc = siteConfig.maps.embedSrc || (info.address ? `https://maps.google.com/maps?q=${encodeURIComponent(addressOneLine)}&output=embed&z=15` : null)
  const placeUrl = siteConfig.maps.placeUrl || (info.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressOneLine)}` : '#')

  const todayIdx = (() => {
    const d = new Date().getDay()
    return d === 0 ? 6 : d - 1
  })()

  return (
    <>
      <HeroHeader title={tHero('contact')} subtitle={t('findUs')} />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(40px, 6vw, 72px) 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'clamp(24px, 4vw, 48px)', alignItems: 'start' }}>
        {/* Left — map + coordinates + amenities */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {mapSrc && (
            <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)', aspectRatio: '4 / 3', background: 'var(--surface-alt)' }}>
              <iframe src={mapSrc} width="100%" height="100%" style={{ border: 0, display: 'block' }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title={`${info.name} — ${t('addressTitle')}`} />
            </div>
          )}

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {info.address && (
              <div>
                <p className="font-secondary" style={labelStyle}>{t('addressTitle')}</p>
                <a href={placeUrl} target="_blank" rel="noreferrer" className="font-secondary" style={{ fontSize: '0.925rem', color: 'var(--ink)', textDecoration: 'none', lineHeight: 1.6 }}>
                  {info.address.split('\n').map((line, i) => (<span key={i}>{line}<br /></span>))}
                </a>
              </div>
            )}
            {SHOW_PHONE && info.phone && (
              <div>
                <p className="font-secondary" style={labelStyle}>{t('phonePrefix')}</p>
                <a href={telHref(info.phone)} className="font-secondary" style={{ fontSize: '0.925rem', color: 'var(--ink)', textDecoration: 'none', fontWeight: 500 }}>{info.phone}</a>
              </div>
            )}
            {info.email && (
              <div>
                <p className="font-secondary" style={labelStyle}>{t('contactTitle')}</p>
                <a href={`mailto:${info.email}`} className="font-secondary" style={{ fontSize: '0.925rem', color: 'var(--ink)', textDecoration: 'none', fontWeight: 500 }}>{info.email}</a>
              </div>
            )}

            {/* Amenities */}
            <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 14 }}>
              <p className="font-secondary" style={labelStyle}>{t('amenitiesTitle')}</p>
              <ul className="font-secondary" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.9rem', color: 'var(--slate)' }}>
                {am.creditCard && <li>💳 {t('creditCard')}</li>}
                {am.cash && <li>💶 {t('cash')}</li>}
                {am.wifi && <li>📶 {t('wifi')}</li>}
                {am.petsAllowed && <li>🐾 {t('petsAllowed')}</li>}
                {am.languages.length > 0 && (
                  <li>🗣 {t('languagesTitle')} : {am.languages.map((l) => t(LANG_KEY[l])).filter(Boolean).join(', ')}</li>
                )}
              </ul>
            </div>

            <Link href="/reservation" style={{ textDecoration: 'none' }}>
              <span className="font-secondary" style={{ display: 'block', textAlign: 'center', width: '100%', padding: '12px', background: 'var(--pine)', color: 'var(--paper)', borderRadius: 10, fontWeight: 600, fontSize: '0.9rem' }}>{t('reserveCta')}</span>
            </Link>
          </div>
        </div>

        {/* Right — hours */}
        {hours && hours.length === 7 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-soft)' }}>
              <p className="font-secondary" style={labelStyle}>{t('hoursTitle')}</p>
            </div>
            {DAYS_FR.map((day, i) => {
              const h = hours[i]
              const isToday = i === todayIdx
              const parts: string[] = []
              if (!h.closedDay) {
                if (!h.closedLunch && h.midi?.debut) parts.push(`${h.midi.debut}–${h.midi.fin}`)
                if (!h.closedDiner && h.soir?.debut) parts.push(`${h.soir.debut}–${h.soir.fin}`)
              }
              return (
                <div key={day} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 22px', borderBottom: i < 6 ? '1px solid var(--border-soft)' : 'none', background: isToday ? 'var(--pine-light)' : 'transparent' }}>
                  <span className="font-secondary" style={{ fontSize: '0.875rem', fontWeight: isToday ? 600 : 400, color: isToday ? 'var(--pine)' : 'var(--ink)' }}>{week[i] ?? day}</span>
                  <span className="font-secondary" style={{ fontSize: '0.875rem', textAlign: 'right', color: h.closedDay || parts.length === 0 ? 'var(--muted)' : 'var(--slate)' }}>
                    {h.closedDay ? t('closed') : parts.length ? parts.join(' · ') : '–'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
