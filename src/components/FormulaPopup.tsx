'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

type Props = {
  images: string[]
  autoOpen?: boolean
  showFloatingButton?: boolean
}

// Popup that surfaces the "formula of the day" menu images. Auto-opens on the
// home page; a floating button re-opens it on the menu page.
export function FormulaPopup({ images, autoOpen = false, showFloatingButton = false }: Props) {
  const t = useTranslations('formula')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (autoOpen && images.length > 0) setOpen(true)
  }, [autoOpen, images.length])

  if (images.length === 0) return null

  return (
    <>
      {showFloatingButton && (
        <button
          onClick={() => setOpen(true)}
          aria-label={t('button')}
          className="font-secondary"
          style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 150, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--pine)', color: 'var(--paper)', padding: '12px 20px', borderRadius: 99, border: 'none', boxShadow: '0 6px 24px rgba(0,0,0,0.2)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
        >
          🍽 {t('button')}
        </button>
      )}

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'relative', background: 'var(--surface)', borderRadius: 16, maxWidth: 640, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 20 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 16 }}>
              <h2 className="font-primary" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
                {t('title')}
              </h2>
              <button onClick={() => setOpen(false)} aria-label={t('button')} style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: 'var(--slate)', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {images.map((src, i) => (
                <div key={i} style={{ position: 'relative', width: '100%', aspectRatio: '800 / 1130', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border-soft)', background: 'var(--surface-alt)' }}>
                  <Image src={src} alt={`${t('title')} ${i + 1}`} fill sizes="(max-width: 680px) 100vw, 640px" style={{ objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
