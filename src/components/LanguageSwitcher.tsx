'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useTransition } from 'react'
import { usePathname, useRouter, routing } from '@/i18n/routing'

const FLAGS: Record<string, { flag: string; label: string }> = {
  fr: { flag: '🇫🇷', label: 'Français' },
  en: { flag: '🇬🇧', label: 'English' },
  es: { flag: '🇪🇸', label: 'Español' },
  it: { flag: '🇮🇹', label: 'Italiano' },
}

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations('nav')
  const [isPending, startTransition] = useTransition()

  const switchTo = (next: string) => {
    if (next === locale) return
    // usePathname() from i18n/routing is already locale-stripped, so this keeps
    // the current page and only swaps the language.
    startTransition(() => router.replace(pathname, { locale: next }))
  }

  return (
    <div role="group" aria-label={t('language')} className={className} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {routing.locales.map((l) => {
        const active = l === locale
        return (
          <button
            key={l}
            type="button"
            onClick={() => switchTo(l)}
            disabled={isPending}
            aria-label={FLAGS[l].label}
            aria-current={active ? 'true' : undefined}
            title={FLAGS[l].label}
            style={{
              background: 'none',
              border: 'none',
              cursor: isPending ? 'default' : 'pointer',
              fontSize: '1.05rem',
              lineHeight: 1,
              padding: '4px 5px',
              borderRadius: 6,
              opacity: active ? 1 : 0.5,
              transform: active ? 'scale(1.12)' : 'none',
              transition: 'opacity 0.15s, transform 0.15s',
            }}
          >
            {FLAGS[l].flag}
          </button>
        )
      })}
    </div>
  )
}
