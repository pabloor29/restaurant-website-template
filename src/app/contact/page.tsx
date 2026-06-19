import { createClient } from '@/lib/supabase/server'
import { RESTAURANT_ID } from '@/lib/restaurant'
import type { OpeningHourDay } from '@/lib/restaurant'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Contact' }

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

export default async function ContactPage() {
  const supabase = await createClient()

  const [{ data: restaurant }, { data: hoursData }] = await Promise.all([
    supabase.from('restaurants').select('name, phone, address').eq('id', RESTAURANT_ID).single(),
    supabase.from('opening_hours').select('hours').eq('restaurant_id', RESTAURANT_ID).single(),
  ])

  const hours: OpeningHourDay[] | null = hoursData?.hours ?? null
  const todayIdx = getTodayIndex()

  const mapSrc = restaurant?.address
    ? `https://maps.google.com/maps?q=${encodeURIComponent(restaurant.address.replace(/\n/g, ', '))}&output=embed&z=15`
    : null

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(40px, 6vw, 72px) 24px' }}>
      <h1 className="font-primary" style={{
        fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800,
        color: 'var(--ink)', letterSpacing: '-0.03em', marginBottom: 8,
      }}>
        Nous trouver
      </h1>
      <p className="font-accent" style={{
        fontSize: '1.1rem', color: 'var(--muted)',
        marginBottom: 'clamp(32px, 5vw, 52px)', fontStyle: 'italic',
      }}>
        {restaurant?.address?.split('\n')[0] ?? 'Venez nous rendre visite'}
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 'clamp(24px, 4vw, 48px)',
        alignItems: 'start',
      }}>

        {/* Colonne gauche — Carte + coordonnées */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Carte Google Maps */}
          {mapSrc && (
            <div style={{
              borderRadius: 16, overflow: 'hidden',
              border: '1px solid var(--border)',
              aspectRatio: '4 / 3',
              background: 'var(--surface-alt)',
            }}>
              <iframe
                src={mapSrc}
                width="100%"
                height="100%"
                style={{ border: 0, display: 'block' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Carte — ${restaurant?.name ?? 'Restaurant'}`}
              />
            </div>
          )}

          {/* Coordonnées */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '22px 24px',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            {restaurant?.address && (
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.1rem', lineHeight: 1, paddingTop: 2 }}>📍</span>
                <div>
                  <p className="font-secondary" style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 4 }}>
                    ADRESSE
                  </p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address.replace(/\n/g, ', '))}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-secondary"
                    style={{ fontSize: '0.925rem', color: 'var(--ink)', textDecoration: 'none', lineHeight: 1.6 }}
                  >
                    {restaurant.address.split('\n').map((line: string, i: number) => (
                      <span key={i}>{line}<br /></span>
                    ))}
                  </a>
                </div>
              </div>
            )}

            {restaurant?.phone && (
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>📞</span>
                <div>
                  <p className="font-secondary" style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 4 }}>
                    TÉLÉPHONE
                  </p>
                  <a
                    href={`tel:${restaurant.phone.replace(/\s/g, '')}`}
                    className="font-secondary"
                    style={{ fontSize: '0.925rem', color: 'var(--ink)', textDecoration: 'none', fontWeight: 500 }}
                  >
                    {restaurant.phone}
                  </a>
                </div>
              </div>
            )}

            <div style={{ paddingTop: 4 }}>
              <a href="/reservation" style={{ textDecoration: 'none' }}>
                <button className="font-secondary" style={{
                  width: '100%', padding: '12px',
                  background: 'var(--pine)', color: 'var(--paper)',
                  border: 'none', borderRadius: 10, fontWeight: 600,
                  fontSize: '0.9rem', cursor: 'pointer',
                }}>
                  Réserver une table
                </button>
              </a>
            </div>
          </div>
        </div>

        {/* Colonne droite — Horaires */}
        {hours && hours.length === 7 && (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 14, overflow: 'hidden',
          }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-soft)' }}>
              <p className="font-secondary" style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--muted)' }}>
                HORAIRES D&apos;OUVERTURE
              </p>
            </div>

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
                  padding: '13px 22px',
                  borderBottom: i < 6 ? '1px solid var(--border-soft)' : 'none',
                  background: isToday ? 'var(--pine-light)' : 'transparent',
                }}>
                  <span className="font-secondary" style={{
                    fontSize: '0.875rem',
                    fontWeight: isToday ? 600 : 400,
                    color: isToday ? 'var(--pine)' : 'var(--ink)',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    {day}
                    {isToday && (
                      <span style={{
                        fontSize: '0.68rem', fontWeight: 600,
                        color: 'var(--pine)', background: 'var(--pine-light)',
                        border: '1px solid rgba(19,80,59,0.2)',
                        padding: '1px 7px', borderRadius: 99,
                      }}>
                        Aujourd&apos;hui
                      </span>
                    )}
                  </span>
                  <span className="font-secondary" style={{
                    fontSize: '0.875rem', textAlign: 'right',
                    color: h.closedDay || parts.length === 0 ? 'var(--muted)' : 'var(--slate)',
                  }}>
                    {h.closedDay
                      ? 'Fermé'
                      : parts.length
                        ? parts.join(' · ')
                        : '–'}
                  </span>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
