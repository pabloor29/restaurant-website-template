import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { RESTAURANT_ID } from '@/lib/restaurant'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Menus' }

export default async function MenusPage() {
  const supabase = await createClient()

  const [{ data: categories }, { data: files }] = await Promise.all([
    supabase.from('menu_categories').select('id, name, position').eq('restaurant_id', RESTAURANT_ID).order('position'),
    supabase.from('menu_files').select('id, file_path, category_id, position').eq('restaurant_id', RESTAURANT_ID).order('position'),
  ])

  const grouped: Record<string, { id: string; file_path: string; position: number }[]> = {}
  files?.forEach(f => {
    if (!grouped[f.category_id]) grouped[f.category_id] = []
    grouped[f.category_id].push(f)
  })

  function getPublicUrl(path: string) {
    const { data } = supabase.storage.from('menus').getPublicUrl(path)
    return data.publicUrl
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(40px, 6vw, 72px) 24px' }}>
      <h1 className="font-primary" style={{
        fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800,
        color: 'var(--ink)', letterSpacing: '-0.03em', marginBottom: 8,
      }}>
        Nos menus
      </h1>
      <p className="font-accent" style={{ fontSize: '1.1rem', color: 'var(--muted)', marginBottom: 'clamp(32px, 5vw, 56px)', fontStyle: 'italic' }}>
        Découvrez notre carte
      </p>

      {!categories || categories.length === 0 ? (
        <p className="font-secondary" style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
          Les menus seront bientôt disponibles.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(48px, 7vw, 72px)' }}>
          {categories.map(cat => {
            const catFiles = grouped[cat.id] ?? []
            return (
              <section key={cat.id}>
                <h2 className="font-primary" style={{
                  fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)', fontWeight: 700,
                  color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: 24,
                  paddingBottom: 12, borderBottom: '1.5px solid var(--border)',
                }}>
                  {cat.name}
                </h2>

                {catFiles.length === 0 ? (
                  <p className="font-secondary" style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
                    Aucun fichier.
                  </p>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: 20,
                  }}>
                    {catFiles.map((f, i) => {
                      const url = getPublicUrl(f.file_path)
                      return (
                        <div key={f.id} style={{
                          borderRadius: 14, overflow: 'hidden',
                          border: '1px solid var(--border)',
                          position: 'relative',
                          aspectRatio: '800 / 1130',
                          background: 'var(--surface-alt)',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
                        }}>
                          <Image
                            src={url}
                            alt={`${cat.name} — page ${i + 1}`}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            style={{ objectFit: 'cover' }}
                            priority={i === 0}
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
