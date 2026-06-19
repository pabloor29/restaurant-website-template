import { createClient } from '@/lib/supabase/server'
import { RESTAURANT_ID } from '@/lib/restaurant'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Formules' }

export default async function FormulesPage() {
  const supabase = await createClient()

  const { data: formules } = await supabase
    .from('formules')
    .select('id, nom, prix, description, elements, active')
    .eq('restaurant_id', RESTAURANT_ID)
    .eq('active', true)
    .order('created_at', { ascending: true })

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(40px, 6vw, 72px) 24px' }}>
      <h1 className="font-primary" style={{
        fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800,
        color: 'var(--ink)', letterSpacing: '-0.03em', marginBottom: 8,
      }}>
        Formules de groupe
      </h1>
      <p className="font-accent" style={{ fontSize: '1.1rem', color: 'var(--muted)', marginBottom: 'clamp(32px, 5vw, 56px)', fontStyle: 'italic' }}>
        Pour vos repas en groupe, séminaires et événements privés
      </p>

      {!formules || formules.length === 0 ? (
        <p className="font-secondary" style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
          Nos formules seront bientôt disponibles.
        </p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 20,
        }}>
          {formules.map((f) => (
            <div key={f.id} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 16, padding: '24px 26px',
              display: 'flex', flexDirection: 'column', gap: 14,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <h2 className="font-primary" style={{
                  fontSize: '1.2rem', fontWeight: 700,
                  color: 'var(--ink)', letterSpacing: '-0.02em',
                }}>
                  {f.nom}
                </h2>
                <p className="font-primary" style={{
                  fontSize: '1.6rem', fontWeight: 800,
                  color: 'var(--amber)', letterSpacing: '-0.02em',
                  flexShrink: 0,
                }}>
                  {f.prix}€
                </p>
              </div>

              {f.description && (
                <p className="font-accent" style={{ fontSize: '0.95rem', color: 'var(--slate)', fontStyle: 'italic', lineHeight: 1.6 }}>
                  {f.description}
                </p>
              )}

              {f.elements && f.elements.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {f.elements.map((el: string) => (
                    <span key={el} className="font-secondary" style={{
                      fontSize: '0.8rem', padding: '4px 12px', borderRadius: 99,
                      background: 'var(--pine-light)', color: 'var(--pine)', fontWeight: 500,
                    }}>
                      {el}
                    </span>
                  ))}
                </div>
              )}

              <a href="/reservation" style={{ textDecoration: 'none', marginTop: 'auto' }}>
                <button className="font-secondary" style={{
                  width: '100%', padding: '11px', borderRadius: 10,
                  background: 'var(--pine)', color: 'var(--paper)',
                  border: 'none', fontWeight: 600, fontSize: '0.875rem',
                  cursor: 'pointer',
                }}>
                  Réserver avec cette formule
                </button>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
