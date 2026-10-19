import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'

// Short "our table" introduction block on the home page.
export async function IntroRestaurant() {
  const t = await getTranslations('home')

  return (
    <section style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: 'clamp(48px, 7vw, 80px) 24px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <h2 className="font-primary" style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
          {t('introTitle')}
        </h2>
        <p className="font-accent" style={{ fontSize: '1.15rem', color: 'var(--slate)', lineHeight: 1.7, fontStyle: 'italic' }}>
          {t('introBody')}
        </p>
        <Link href="/menus" className="font-secondary" style={{ background: 'var(--pine)', color: 'var(--paper)', padding: '12px 26px', borderRadius: 10, fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>
          {t('introCta')}
        </Link>
      </div>
    </section>
  )
}
