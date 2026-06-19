import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { RESTAURANT_ID, type OpeningHourDay } from '@/lib/restaurant'

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

function fmtTime(t: string) {
  if (!t) return null
  const [h, m] = t.split(':')
  return m === '00' ? `${h}h` : `${h}h${m}`
}

function getTodayIndex() {
  const d = new Date().getDay()
  return d === 0 ? 6 : d - 1
}

export default async function HomePage() {
  const supabase = await createClient()

  const [{ data: restaurant }, { data: hoursData }, { data: formules }, { data: events }] =
    await Promise.all([
      supabase.from('restaurants').select('name, phone, address').eq('id', RESTAURANT_ID).single(),
      supabase.from('opening_hours').select('hours').eq('restaurant_id', RESTAURANT_ID).single(),
      supabase.from('formules').select('id, nom, prix').eq('restaurant_id', RESTAURANT_ID).eq('active', true).limit(3),
      supabase
        .from('restaurant_events')
        .select('id, event_date')
        .eq('restaurant_id', RESTAURANT_ID)
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true })
        .limit(3),
    ])

  const hours: OpeningHourDay[] | null = hoursData?.hours ?? null
  const todayIdx = getTodayIndex()
  const todayHours = hours?.[todayIdx]

  function getTodayLabel(): string {
    if (!todayHours) return 'Horaires non renseignés'
    if (todayHours.closedDay) return 'Fermé aujourd\'hui'
    const parts: string[] = []
    if (!todayHours.closedLunch && todayHours.midi.debut && todayHours.midi.fin)
      parts.push(`Midi ${fmtTime(todayHours.midi.debut)}–${fmtTime(todayHours.midi.fin)}`)
    if (!todayHours.closedDiner && todayHours.soir.debut && todayHours.soir.fin)
      parts.push(`Soir ${fmtTime(todayHours.soir.debut)}–${fmtTime(todayHours.soir.fin)}`)
    return parts.length ? parts.join(' · ') : 'Fermé aujourd\'hui'
  }

  return (
    <>
      {/* ── HERO ── */}
      <section style={{
        background: 'var(--pine)',
        padding: 'clamp(72px, 12vw, 120px) 24px clamp(56px, 9vw, 96px)',
        textAlign: 'center',
      }}>
        <p className="font-secondary" style={{
          fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.14em',
          color: 'rgba(231,240,235,0.6)', marginBottom: 16, textTransform: 'uppercase',
        }}>
          Bienvenue
        </p>
        <h1 className="font-primary" style={{
          fontSize: 'clamp(2.4rem, 6vw, 4.5rem)', fontWeight: 800,
          color: 'var(--paper)', letterSpacing: '-0.03em', lineHeight: 1.1,
          marginBottom: 20,
        }}>
          {restaurant?.name}
        </h1>
        {todayHours && (
          <p className="font-secondary" style={{
            fontSize: '0.9rem', color: 'rgba(245,241,233,0.65)',
            marginBottom: 36,
          }}>
            {getTodayLabel()}
          </p>
        )}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/reservation" className="font-secondary" style={{
            background: 'var(--paper)', color: 'var(--pine)',
            padding: '13px 28px', borderRadius: 10, fontWeight: 700,
            fontSize: '0.95rem', textDecoration: 'none', letterSpacing: '-0.01em',
          }}>
            Réserver une table
          </Link>
          <Link href="/menus" className="font-secondary" style={{
            background: 'transparent', color: 'var(--paper)',
            border: '1.5px solid rgba(245,241,233,0.35)',
            padding: '12px 28px', borderRadius: 10, fontWeight: 600,
            fontSize: '0.95rem', textDecoration: 'none',
          }}>
            Voir les menus
          </Link>
        </div>
      </section>

      {/* ── INFOS RAPIDES ── */}
      {(restaurant?.address || restaurant?.phone) && (
        <section style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '20px 24px',
        }}>
          <div style={{
            maxWidth: 1100, margin: '0 auto',
            display: 'flex', gap: 32, flexWrap: 'wrap',
            alignItems: 'center', justifyContent: 'center',
          }}>
            {restaurant.address && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1rem', marginTop: 1 }}>📍</span>
                <p className="font-secondary" style={{ fontSize: '0.875rem', color: 'var(--slate)' }}>
                  {restaurant.address.replace('\n', ', ')}
                </p>
              </div>
            )}
            {restaurant.phone && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: '1rem' }}>📞</span>
                <a href={`tel:${restaurant.phone.replace(/\s/g, '')}`} className="font-secondary" style={{
                  fontSize: '0.875rem', color: 'var(--slate)', textDecoration: 'none',
                }}>
                  {restaurant.phone}
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(48px, 7vw, 80px) 24px' }}>

        {/* ── FORMULES ── */}
        {formules && formules.length > 0 && (
          <section style={{ marginBottom: 'clamp(48px, 7vw, 80px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
              <h2 className="font-primary" style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
                Nos formules
              </h2>
              <Link href="/formules" className="font-secondary" style={{ fontSize: '0.875rem', color: 'var(--pine)', textDecoration: 'none', fontWeight: 600 }}>
                Voir tout →
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
              {formules.map(f => (
                <div key={f.id} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 14, padding: '20px 22px',
                }}>
                  <p className="font-secondary" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>{f.nom}</p>
                  <p className="font-primary" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--amber)', letterSpacing: '-0.02em' }}>
                    {f.prix}€
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── ÉVÉNEMENTS ── */}
        {events && events.length > 0 && (
          <section style={{ marginBottom: 'clamp(48px, 7vw, 80px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
              <h2 className="font-primary" style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
                Prochains événements
              </h2>
              <Link href="/evenements" className="font-secondary" style={{ fontSize: '0.875rem', color: 'var(--pine)', textDecoration: 'none', fontWeight: 600 }}>
                Voir tout →
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {events.map(evt => {
                const d = new Date(evt.event_date + 'T00:00:00')
                const label = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                return (
                  <Link key={evt.id} href={`/evenements#${evt.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 12, padding: '16px 20px',
                      display: 'flex', alignItems: 'center', gap: 16,
                    }}>
                      <span style={{ fontSize: '1.4rem' }}>🗓</span>
                      <p className="font-secondary capitalize" style={{ fontSize: '0.95rem', color: 'var(--ink)', fontWeight: 500 }}>{label}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ── HORAIRES ── */}
        {hours && (
          <section>
            <h2 className="font-primary" style={{
              fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800,
              color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: 24,
            }}>
              Horaires d&apos;ouverture
            </h2>
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 16, overflow: 'hidden',
              maxWidth: 560,
            }}>
              {DAYS.map((day, i) => {
                const h = hours[i]
                const isToday = i === todayIdx
                const parts: string[] = []
                if (!h.closedDay) {
                  if (!h.closedLunch && h.midi.debut && h.midi.fin)
                    parts.push(`${fmtTime(h.midi.debut)}–${fmtTime(h.midi.fin)}`)
                  if (!h.closedDiner && h.soir.debut && h.soir.fin)
                    parts.push(`${fmtTime(h.soir.debut)}–${fmtTime(h.soir.fin)}`)
                }
                return (
                  <div key={day} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '13px 20px',
                    borderBottom: i < 6 ? '1px solid var(--border-soft)' : 'none',
                    background: isToday ? 'var(--pine-light)' : 'transparent',
                  }}>
                    <span className="font-secondary" style={{
                      fontSize: '0.875rem', fontWeight: isToday ? 600 : 400,
                      color: isToday ? 'var(--pine)' : 'var(--ink)',
                    }}>
                      {day}{isToday && <span style={{ marginLeft: 8, fontSize: '0.72rem', color: 'var(--pine)', fontWeight: 600 }}>Aujourd&apos;hui</span>}
                    </span>
                    <span className="font-secondary" style={{
                      fontSize: '0.875rem',
                      color: h.closedDay || parts.length === 0 ? 'var(--muted)' : 'var(--slate)',
                    }}>
                      {h.closedDay ? 'Fermé' : parts.length ? parts.join(' · ') : '–'}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        )}

      </div>
    </>
  )
}
