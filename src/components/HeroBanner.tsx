import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'

// Home hero — restaurant name + tagline + primary CTAs.
export async function HeroBanner({ name, todayLabel }: { name: string; todayLabel?: string | null }) {
  const [tHome, tHero] = await Promise.all([
    getTranslations('home'),
    getTranslations('hero'),
  ])

  return (
    <section style={{ background: 'var(--pine)', padding: 'clamp(72px, 12vw, 120px) 24px clamp(56px, 9vw, 96px)', textAlign: 'center' }}>
      <p className="font-secondary" style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.14em', color: 'rgba(231,240,235,0.6)', marginBottom: 16, textTransform: 'uppercase' }}>
        {tHome('welcome')}
      </p>
      <h1 className="font-primary" style={{ fontSize: 'clamp(2.4rem, 6vw, 4.5rem)', fontWeight: 800, color: 'var(--paper)', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 14 }}>
        {name}
      </h1>
      <p className="font-accent" style={{ fontSize: '1.15rem', color: 'rgba(245,241,233,0.72)', fontStyle: 'italic', marginBottom: 12 }}>
        {tHero('subtitle')}
      </p>
      {todayLabel && (
        <p className="font-secondary" style={{ fontSize: '0.9rem', color: 'rgba(245,241,233,0.6)', marginBottom: 32 }}>
          {todayLabel}
        </p>
      )}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: todayLabel ? 0 : 20 }}>
        <Link href="/reservation" className="font-secondary" style={{ background: 'var(--paper)', color: 'var(--pine)', padding: '13px 28px', borderRadius: 10, fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none', letterSpacing: '-0.01em' }}>
          {tHome('reserveCta')}
        </Link>
        <Link href="/menus" className="font-secondary" style={{ background: 'transparent', color: 'var(--paper)', border: '1.5px solid rgba(245,241,233,0.35)', padding: '12px 28px', borderRadius: 10, fontWeight: 600, fontSize: '0.95rem', textDecoration: 'none' }}>
          {tHome('viewMenus')}
        </Link>
      </div>
    </section>
  )
}
