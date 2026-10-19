import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import { getOpeningHours, DAYS_FR } from '@/lib/opening-hours'
import { getRestaurantInfo } from '@/lib/restaurant-contact'
import { SHOW_PHONE, telHref } from '@/lib/phone'
import { siteConfig } from '@/config/site'
import { CookieBanner } from './CookieBanner'

const labelStyle: React.CSSProperties = {
  fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.12em',
  color: 'rgba(245,241,233,0.4)', marginBottom: 14, textTransform: 'uppercase',
}
const linkStyle: React.CSSProperties = {
  display: 'block', marginBottom: 8, fontSize: '0.875rem',
  color: 'rgba(245,241,233,0.65)', textDecoration: 'none',
}

export async function Footer() {
  const [t, tRoot, info, hours] = await Promise.all([
    getTranslations('footer'),
    getTranslations(),
    getRestaurantInfo(),
    getOpeningHours(),
  ])
  const week = tRoot.raw('week') as string[]

  return (
    <footer style={{ background: 'var(--ink)', color: 'var(--paper)', marginTop: 'auto' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(40px, 6vw, 72px) 24px clamp(24px, 4vw, 40px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40 }}>
        {/* Brand + address */}
        <div>
          <p className="font-primary" style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 12, letterSpacing: '-0.02em' }}>
            {info.name}
          </p>
          {info.address && (
            <p className="font-secondary" style={{ fontSize: '0.875rem', color: 'rgba(245,241,233,0.6)', lineHeight: 1.7 }}>
              {info.address.split('\n').map((line, i) => (
                <span key={i}>{line}<br /></span>
              ))}
            </p>
          )}
        </div>

        {/* Contact */}
        <div>
          <p className="font-secondary" style={labelStyle}>{t('contactTitle')}</p>
          <a href={`mailto:${info.email}`} className="font-secondary" style={linkStyle}>{info.email}</a>
          {SHOW_PHONE && info.phone && (
            <a href={telHref(info.phone)} className="font-secondary" style={linkStyle}>{info.phone}</a>
          )}
          <a href={siteConfig.instagram.url} target="_blank" rel="noreferrer" className="font-secondary" style={linkStyle}>
            {siteConfig.instagram.handle}
          </a>
        </div>

        {/* Hours */}
        {hours && hours.length === 7 && (
          <div>
            <p className="font-secondary" style={labelStyle}>{t('hoursTitle')}</p>
            {DAYS_FR.map((day, i) => {
              const h = hours[i]
              const parts: string[] = []
              if (!h.closedDay) {
                if (!h.closedLunch && h.midi?.debut && h.midi?.fin) parts.push(`${h.midi.debut} - ${h.midi.fin}`)
                if (!h.closedDiner && h.soir?.debut && h.soir?.fin) parts.push(`${h.soir.debut} - ${h.soir.fin}`)
              }
              return (
                <div key={day} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 5 }}>
                  <span className="font-secondary" style={{ fontSize: '0.8rem', color: 'rgba(245,241,233,0.65)' }}>{week[i] ?? day}</span>
                  <span className="font-secondary" style={{ fontSize: '0.8rem', color: 'rgba(245,241,233,0.45)', textAlign: 'right' }}>
                    {h.closedDay ? t('closed') : parts.length ? parts.join(' · ') : '–'}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Navigation */}
        <div>
          <p className="font-secondary" style={labelStyle}>{t('navTitle')}</p>
          {([
            ['/', 'home'],
            ['/menus', 'menus'],
            ['/formules', 'formules'],
            ['/evenements', 'events'],
            ['/apropos', 'about'],
            ['/contact', 'contact'],
            ['/reservation', 'reservation'],
          ] as const).map(([href, key]) => (
            <Link key={href} href={href} className="font-secondary" style={linkStyle}>
              {tRoot(`nav.${key}`)}
            </Link>
          ))}
        </div>
      </div>

      {/* Legal bar */}
      <nav aria-label={t('legal')} style={{ borderTop: '1px solid rgba(245,241,233,0.1)', padding: '16px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, fontSize: '0.75rem', color: 'rgba(245,241,233,0.5)' }}>
          <Link href="/mentions-legales" className="font-secondary" style={{ color: 'rgba(245,241,233,0.55)', textDecoration: 'none' }}>{t('legal')}</Link>
          <span aria-hidden>·</span>
          <Link href="/politique-confidentialite" className="font-secondary" style={{ color: 'rgba(245,241,233,0.55)', textDecoration: 'none' }}>{t('privacy')}</Link>
          <span aria-hidden>·</span>
          <Link href="/cgu" className="font-secondary" style={{ color: 'rgba(245,241,233,0.55)', textDecoration: 'none' }}>{t('cgu')}</Link>
          <span className="font-secondary" style={{ marginLeft: 'auto' }}>
            © {new Date().getFullYear()} {info.name} · {t('madeBy')}{' '}
            <a href={siteConfig.legal.developer.url} target="_blank" rel="noreferrer" style={{ color: 'rgba(245,241,233,0.7)', textDecoration: 'none', fontWeight: 600 }}>
              {siteConfig.legal.developer.name}
            </a>
          </span>
        </div>
      </nav>

      <CookieBanner />
    </footer>
  )
}
