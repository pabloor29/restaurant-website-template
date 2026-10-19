export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import { createClient } from '@/lib/supabase/server'
import { RESTAURANT_ID, type OpeningHourDay } from '@/lib/restaurant'
import { getRestaurantInfo } from '@/lib/restaurant-contact'
import { getOpeningHours, DAYS_FR } from '@/lib/opening-hours'
import { getMenuData, getMenuFileUrl } from '@/lib/menu'
import { HeroBanner } from '@/components/HeroBanner'
import { IntroRestaurant } from '@/components/IntroRestaurant'
import { GoogleReviews } from '@/components/GoogleReviews'
import { FormulaPopup } from '@/components/FormulaPopup'
import { alternatesFor, INTL_LOCALE } from '@/lib/i18n-meta'
import { siteConfig } from '@/config/site'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const [t, info] = await Promise.all([getTranslations({ locale, namespace: 'meta' }), getRestaurantInfo()])
  return { description: t('homeDescription', { name: info.name }), alternates: alternatesFor(locale, '') }
}

function fmtTime(t: string) {
  if (!t) return null
  const [h, m] = t.split(':')
  return m === '00' ? `${h}h` : `${h}h${m}`
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const supabase = await createClient()
  const [info, hours, menuCategories, { data: formules }, { data: events }, t] = await Promise.all([
    getRestaurantInfo(),
    getOpeningHours(),
    getMenuData(),
    supabase.from('formules').select('id, nom, prix').eq('restaurant_id', RESTAURANT_ID).eq('active', true).limit(3),
    supabase
      .from('restaurant_events')
      .select('id, event_date')
      .eq('restaurant_id', RESTAURANT_ID)
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date', { ascending: true })
      .limit(3),
    getTranslations('home'),
  ])

  const todayIdx = (() => {
    const d = new Date().getDay()
    return d === 0 ? 6 : d - 1
  })()
  const todayHours = hours?.[todayIdx]
  const [tContact, tRoot] = await Promise.all([getTranslations('contact'), getTranslations()])
  const week = tRoot.raw('week') as string[]
  const todayLabel = (() => {
    if (!todayHours) return null
    if (todayHours.closedDay) return tContact('closed')
    const parts: string[] = []
    if (!todayHours.closedLunch && todayHours.midi?.debut) parts.push(`${fmtTime(todayHours.midi.debut)}–${fmtTime(todayHours.midi.fin)}`)
    if (!todayHours.closedDiner && todayHours.soir?.debut) parts.push(`${fmtTime(todayHours.soir.debut)}–${fmtTime(todayHours.soir.fin)}`)
    return parts.length ? parts.join(' · ') : tContact('closed')
  })()

  const formulaCat = siteConfig.menu.formulaCategoryName
    ? menuCategories.find((c) => c.name === siteConfig.menu.formulaCategoryName)
    : undefined
  const formulaImages = formulaCat?.files.map((f) => getMenuFileUrl(f.file_path)) ?? []

  const intl = INTL_LOCALE[locale] ?? 'fr-FR'

  return (
    <>
      <HeroBanner name={info.name} todayLabel={todayLabel} />
      <IntroRestaurant />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(48px, 7vw, 80px) 24px' }}>
        {/* Formules preview */}
        {formules && formules.length > 0 && (
          <section style={{ marginBottom: 'clamp(48px, 7vw, 80px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
              <h2 className="font-primary" style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em' }}>{t('formulesTitle')}</h2>
              <Link href="/formules" className="font-secondary" style={{ fontSize: '0.875rem', color: 'var(--pine)', textDecoration: 'none', fontWeight: 600 }}>{t('seeAll')} →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
              {formules.map((f) => (
                <div key={f.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px' }}>
                  <p className="font-secondary" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>{f.nom}</p>
                  <p className="font-primary" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--amber)', letterSpacing: '-0.02em' }}>{f.prix}€</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Events preview */}
        {events && events.length > 0 && (
          <section style={{ marginBottom: 'clamp(48px, 7vw, 80px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
              <h2 className="font-primary" style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em' }}>{t('eventsTitle')}</h2>
              <Link href="/evenements" className="font-secondary" style={{ fontSize: '0.875rem', color: 'var(--pine)', textDecoration: 'none', fontWeight: 600 }}>{t('seeAll')} →</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {events.map((evt) => {
                const label = new Date(evt.event_date + 'T00:00:00').toLocaleDateString(intl, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                return (
                  <Link key={evt.id} href={`/evenements#${evt.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span style={{ fontSize: '1.4rem' }}>🗓</span>
                      <p className="font-secondary" style={{ fontSize: '0.95rem', color: 'var(--ink)', fontWeight: 500, textTransform: 'capitalize' }}>{label}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Hours */}
        {hours && hours.length === 7 && (
          <section>
            <h2 className="font-primary" style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: 24 }}>{t('hoursTitle')}</h2>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', maxWidth: 560 }}>
              {DAYS_FR.map((day, i) => {
                const h = hours[i]
                const isToday = i === todayIdx
                const parts: string[] = []
                if (!h.closedDay) {
                  if (!h.closedLunch && h.midi?.debut) parts.push(`${fmtTime(h.midi.debut)}–${fmtTime(h.midi.fin)}`)
                  if (!h.closedDiner && h.soir?.debut) parts.push(`${fmtTime(h.soir.debut)}–${fmtTime(h.soir.fin)}`)
                }
                return (
                  <div key={day} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 20px', borderBottom: i < 6 ? '1px solid var(--border-soft)' : 'none', background: isToday ? 'var(--pine-light)' : 'transparent' }}>
                    <span className="font-secondary" style={{ fontSize: '0.875rem', fontWeight: isToday ? 600 : 400, color: isToday ? 'var(--pine)' : 'var(--ink)' }}>{week[i] ?? day}</span>
                    <span className="font-secondary" style={{ fontSize: '0.875rem', color: h.closedDay || parts.length === 0 ? 'var(--muted)' : 'var(--slate)' }}>
                      {h.closedDay ? tContact('closed') : parts.length ? parts.join(' · ') : '–'}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>

      <GoogleReviews />
      <FormulaPopup images={formulaImages} autoOpen />
    </>
  )
}
