'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'

const STORAGE_KEY = 'cookie-banner-dismissed'

export function CookieBanner() {
  const t = useTranslations('cookie')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {}
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t('text')}
      style={{
        position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 200,
        maxWidth: 420, marginLeft: 'auto',
        background: 'var(--ink)', color: 'var(--paper)',
        borderRadius: 14, boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        padding: '18px 20px',
      }}
    >
      <button
        onClick={dismiss}
        aria-label={t('close')}
        style={{ position: 'absolute', top: 8, right: 10, background: 'none', border: 'none', color: 'var(--paper)', cursor: 'pointer', fontSize: '1.1rem', opacity: 0.7 }}
      >
        ×
      </button>
      <p className="font-secondary" style={{ fontSize: '0.85rem', lineHeight: 1.5, paddingRight: 16, color: 'rgba(245,241,233,0.9)' }}>
        {t('text')}
      </p>
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <Link href="/politique-confidentialite" className="font-secondary" style={{ fontSize: '0.8rem', color: 'rgba(245,241,233,0.75)', textDecoration: 'underline' }}>
          {t('learnMore')}
        </Link>
        <button
          onClick={dismiss}
          className="font-secondary"
          style={{ marginLeft: 'auto', background: 'var(--paper)', color: 'var(--ink)', border: 'none', borderRadius: 8, padding: '7px 16px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
        >
          {t('gotIt')}
        </button>
      </div>
    </div>
  )
}
