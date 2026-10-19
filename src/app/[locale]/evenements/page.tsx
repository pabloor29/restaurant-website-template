export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Image from 'next/image'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { RESTAURANT_ID } from '@/lib/restaurant'
import { getRestaurantInfo } from '@/lib/restaurant-contact'
import { HeroHeader } from '@/components/HeroHeader'
import { alternatesFor, INTL_LOCALE } from '@/lib/i18n-meta'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const [tMeta, tHero, info] = await Promise.all([
    getTranslations({ locale, namespace: 'meta' }),
    getTranslations({ locale, namespace: 'hero' }),
    getRestaurantInfo(),
  ])
  return { title: tHero('events'), description: tMeta('eventsDescription', { name: info.name }), alternates: alternatesFor(locale, '/evenements') }
}

type EventRow = { id: string; event_date: string; position: number }

export default async function EvenementsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const intl = INTL_LOCALE[locale] ?? 'fr-FR'

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const [{ data: upcoming }, { data: past }, t, tHero] = await Promise.all([
    supabase.from('restaurant_events').select('id, event_date, position').eq('restaurant_id', RESTAURANT_ID).gte('event_date', today).order('event_date', { ascending: true }),
    supabase.from('restaurant_events').select('id, event_date, position').eq('restaurant_id', RESTAURANT_ID).lt('event_date', today).order('event_date', { ascending: false }).limit(6),
    getTranslations('events'),
    getTranslations('hero'),
  ])

  const allEvents: EventRow[] = [...(upcoming ?? []), ...(past ?? [])]
  const { data: files } = allEvents.length
    ? await supabase.from('event_files').select('id, file_path, event_id, position').in('event_id', allEvents.map((e) => e.id)).order('position')
    : { data: [] as { id: string; file_path: string; event_id: string; position: number }[] }

  const grouped: Record<string, { id: string; file_path: string }[]> = {}
  files?.forEach((f) => {
    ;(grouped[f.event_id] ??= []).push(f)
  })

  function getPublicUrl(path: string) {
    return supabase.storage.from('events').getPublicUrl(path).data.publicUrl
  }

  const fmtDate = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString(intl, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  function EventSection({ events, title }: { events: EventRow[] | null; title: string }) {
    if (!events || events.length === 0) return null
    return (
      <section style={{ marginBottom: 'clamp(40px, 6vw, 64px)' }}>
        <h2 className="font-primary" style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: 24, paddingBottom: 12, borderBottom: '1.5px solid var(--border)' }}>
          {title}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {events.map((evt) => {
            const evtFiles = grouped[evt.id] ?? []
            return (
              <article key={evt.id} id={evt.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ padding: '18px 22px', borderBottom: evtFiles.length > 0 ? '1px solid var(--border-soft)' : 'none' }}>
                  <p className="font-secondary" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', textTransform: 'capitalize' }}>{fmtDate(evt.event_date)}</p>
                </div>
                {evtFiles.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, padding: 16 }}>
                    {evtFiles.map((f, i) => (
                      <div key={f.id} style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border-soft)', position: 'relative', aspectRatio: '800 / 1130', background: 'var(--surface-alt)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                        <Image src={getPublicUrl(f.file_path)} alt={`${fmtDate(evt.event_date)} — ${i + 1}`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" style={{ objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </section>
    )
  }

  const hasAny = (upcoming?.length ?? 0) + (past?.length ?? 0) > 0

  return (
    <>
      <HeroHeader title={tHero('events')} subtitle={t('subtitle')} />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(40px, 6vw, 72px) 24px' }}>
        {!hasAny ? (
          <p className="font-secondary" style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{t('none')}</p>
        ) : (
          <>
            <EventSection events={upcoming} title={t('upcoming')} />
            <EventSection events={past} title={t('past')} />
          </>
        )}
      </div>
    </>
  )
}
