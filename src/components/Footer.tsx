import Link from 'next/link'
import type { Restaurant } from '@/lib/restaurant'

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

type HourDay = {
  midi: { debut: string; fin: string }
  soir: { debut: string; fin: string }
  closedLunch: boolean
  closedDiner: boolean
  closedDay: boolean
}

function fmtTime(t: string) {
  if (!t) return null
  const [h, m] = t.split(':')
  return m === '00' ? `${h}h` : `${h}h${m}`
}

export function Footer({
  restaurant,
  hours,
}: {
  restaurant: Restaurant | null
  hours?: HourDay[]
}) {
  return (
    <footer style={{
      background: 'var(--ink)', color: 'var(--paper)',
      marginTop: 'auto',
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto',
        padding: 'clamp(40px, 6vw, 72px) 24px clamp(24px, 4vw, 40px)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 40,
      }}>
        {/* Brand */}
        <div>
          <p className="font-primary" style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 12, letterSpacing: '-0.02em' }}>
            {restaurant?.name}
          </p>
          {restaurant?.address && (
            <p className="font-secondary" style={{ fontSize: '0.875rem', color: 'rgba(245,241,233,0.6)', lineHeight: 1.7 }}>
              {restaurant.address.split('\n').map((line, i) => (
                <span key={i}>{line}<br /></span>
              ))}
            </p>
          )}
          {restaurant?.phone && (
            <a href={`tel:${restaurant.phone.replace(/\s/g, '')}`} className="font-secondary" style={{
              display: 'block', marginTop: 10, fontSize: '0.875rem',
              color: 'rgba(245,241,233,0.7)', textDecoration: 'none',
            }}>
              {restaurant.phone}
            </a>
          )}
        </div>

        {/* Navigation */}
        <div>
          <p className="font-secondary" style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.12em', color: 'rgba(245,241,233,0.4)', marginBottom: 14 }}>
            NAVIGATION
          </p>
          {[
            ['/', 'Accueil'],
            ['/menus', 'Menus'],
            ['/formules', 'Formules'],
            ['/evenements', 'Événements'],
            ['/reservation', 'Réserver une table'],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="font-secondary" style={{
              display: 'block', marginBottom: 8, fontSize: '0.875rem',
              color: 'rgba(245,241,233,0.65)', textDecoration: 'none',
            }}>
              {label}
            </Link>
          ))}
        </div>

        {/* Horaires */}
        {hours && hours.length === 7 && (
          <div>
            <p className="font-secondary" style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.12em', color: 'rgba(245,241,233,0.4)', marginBottom: 14 }}>
              HORAIRES
            </p>
            {DAYS.map((day, i) => {
              const h = hours[i]
              if (h.closedDay) {
                return (
                  <div key={day} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span className="font-secondary" style={{ fontSize: '0.8rem', color: 'rgba(245,241,233,0.5)' }}>{day}</span>
                    <span className="font-secondary" style={{ fontSize: '0.8rem', color: 'rgba(245,241,233,0.3)' }}>Fermé</span>
                  </div>
                )
              }
              const parts = []
              if (!h.closedLunch && h.midi.debut && h.midi.fin)
                parts.push(`${fmtTime(h.midi.debut)}–${fmtTime(h.midi.fin)}`)
              if (!h.closedDiner && h.soir.debut && h.soir.fin)
                parts.push(`${fmtTime(h.soir.debut)}–${fmtTime(h.soir.fin)}`)
              return (
                <div key={day} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 5 }}>
                  <span className="font-secondary" style={{ fontSize: '0.8rem', color: 'rgba(245,241,233,0.65)' }}>{day}</span>
                  <span className="font-secondary" style={{ fontSize: '0.8rem', color: 'rgba(245,241,233,0.45)', textAlign: 'right' }}>
                    {parts.length ? parts.join(' · ') : '–'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid rgba(245,241,233,0.1)', padding: '16px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <p className="font-secondary" style={{ fontSize: '0.75rem', color: 'rgba(245,241,233,0.3)', textAlign: 'center' }}>
          © {new Date().getFullYear()} {restaurant?.name}
        </p>
      </div>
    </footer>
  )
}
