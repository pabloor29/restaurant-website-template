import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { RESTAURANT_ID } from '@/lib/restaurant'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Événements' }

export default async function EvenementsPage() {
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]

  const [{ data: upcoming }, { data: past }] = await Promise.all([
    supabase
      .from('restaurant_events')
      .select('id, event_date, position')
      .eq('restaurant_id', RESTAURANT_ID)
      .gte('event_date', today)
      .order('event_date', { ascending: true }),
    supabase
      .from('restaurant_events')
      .select('id, event_date, position')
      .eq('restaurant_id', RESTAURANT_ID)
      .lt('event_date', today)
      .order('event_date', { ascending: false })
      .limit(6),
  ])

  const allEvents = [...(upcoming ?? []), ...(past ?? [])]
  const allIds = allEvents.map(e => e.id)

  const { data: files } = allIds.length
    ? await supabase.from('event_files').select('id, file_path, event_id, position').in('event_id', allIds).order('position')
    : { data: [] }

  const grouped: Record<string, { id: string; file_path: string }[]> = {}
  files?.forEach(f => {
    if (!grouped[f.event_id]) grouped[f.event_id] = []
    grouped[f.event_id].push(f)
  })

  function getPublicUrl(path: string) {
    const { data } = supabase.storage.from('events').getPublicUrl(path)
    return data.publicUrl
  }

  function fmtDate(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  function EventSection({ events, title }: { events: typeof upcoming; title: string }) {
    if (!events || events.length === 0) return null
    return (
      <section style={{ marginBottom: 'clamp(40px, 6vw, 64px)' }}>
        <h2 className="font-primary" style={{
          fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)', fontWeight: 700,
          color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: 24,
          paddingBottom: 12, borderBottom: '1.5px solid var(--border)',
        }}>
          {title}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {events.map(evt => {
            const evtFiles = grouped[evt.id] ?? []
            return (
              <article key={evt.id} id={evt.id} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 16, overflow: 'hidden',
              }}>
                <div style={{ padding: '18px 22px', borderBottom: evtFiles.length > 0 ? '1px solid var(--border-soft)' : 'none' }}>
                  <p className="font-secondary capitalize" style={{
                    fontSize: '1rem', fontWeight: 600, color: 'var(--ink)',
                  }}>
                    {fmtDate(evt.event_date)}
                  </p>
                </div>

                {evtFiles.length > 0 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: 12, padding: 16,
                  }}>
                    {evtFiles.map((f, i) => {
                      const url = getPublicUrl(f.file_path)
                      return (
                        <a key={f.id} href={url} target="_blank" rel="noreferrer" style={{ display: 'block', textDecoration: 'none' }}>
                          <div style={{
                            borderRadius: 10, overflow: 'hidden',
                            border: '1px solid var(--border-soft)',
                            aspectRatio: '3 / 4', position: 'relative',
                            background: 'var(--surface-alt)',
                          }}>
                            <Image
                              src={url}
                              alt={`Événement ${fmtDate(evt.event_date)} — image ${i + 1}`}
                              fill
                              sizes="(max-width: 768px) 100vw, 25vw"
                              style={{ objectFit: 'cover' }}
                            />
                          </div>
                        </a>
                      )
                    })}
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
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(40px, 6vw, 72px) 24px' }}>
      <h1 className="font-primary" style={{
        fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800,
        color: 'var(--ink)', letterSpacing: '-0.03em', marginBottom: 8,
      }}>
        Événements
      </h1>
      <p className="font-accent" style={{ fontSize: '1.1rem', color: 'var(--muted)', marginBottom: 'clamp(32px, 5vw, 56px)', fontStyle: 'italic' }}>
        Soirées thématiques, concerts, et rendez-vous spéciaux
      </p>

      {!hasAny ? (
        <p className="font-secondary" style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
          Aucun événement à venir pour le moment.
        </p>
      ) : (
        <>
          <EventSection events={upcoming} title="À venir" />
          <EventSection events={past} title="Événements passés" />
        </>
      )}
    </div>
  )
}
