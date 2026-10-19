// Presentational inner-page header (no hooks → usable in server components).
export function HeroHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <section style={{ background: 'var(--pine)', padding: 'clamp(56px, 9vw, 96px) 24px clamp(40px, 6vw, 64px)', textAlign: 'center' }}>
      <h1 className="font-primary" style={{ fontSize: 'clamp(2rem, 5vw, 3.4rem)', fontWeight: 800, color: 'var(--paper)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
        {title}
      </h1>
      {subtitle && (
        <p className="font-accent" style={{ marginTop: 14, fontSize: '1.1rem', color: 'rgba(245,241,233,0.7)', fontStyle: 'italic' }}>
          {subtitle}
        </p>
      )}
    </section>
  )
}
