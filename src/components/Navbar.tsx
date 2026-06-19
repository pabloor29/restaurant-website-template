'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const NAV_LINKS = [
  { href: '/',            label: 'Accueil' },
  { href: '/menus',       label: 'Menus' },
  { href: '/formules',    label: 'Formules' },
  { href: '/evenements',  label: 'Événements' },
  { href: '/reservation', label: 'Réserver' },
]

export function Navbar({ restaurantName }: { restaurantName: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
    }}>
      <nav style={{
        maxWidth: 1100, margin: '0 auto',
        padding: '0 24px', height: 64,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        {/* Logo */}
        <Link href="/" className="font-primary" style={{
          fontWeight: 800, fontSize: '1.05rem', color: 'var(--ink)',
          textDecoration: 'none', marginRight: 'auto', letterSpacing: '-0.02em',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'var(--pine)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: 'var(--paper)', fontSize: '0.82rem', fontWeight: 800,
          }}>
            {restaurantName.charAt(0).toUpperCase()}
          </span>
          {restaurantName}
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex" style={{ gap: 4 }}>
          {NAV_LINKS.map(({ href, label }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link key={href} href={href} className="font-secondary" style={{
                fontSize: '0.875rem', fontWeight: active ? 600 : 400,
                color: active ? 'var(--pine)' : 'var(--slate)',
                textDecoration: 'none', padding: '6px 14px', borderRadius: 8,
                background: active ? 'var(--pine-light)' : 'transparent',
                transition: 'all 0.15s',
              }}>
                {label}
              </Link>
            )
          })}
        </div>

        {/* CTA desktop */}
        <Link href="/reservation" className="hidden md:block font-secondary" style={{
          marginLeft: 12, background: 'var(--pine)', color: 'var(--paper)',
          padding: '9px 20px', borderRadius: 10,
          fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none',
        }}>
          Réserver
        </Link>

        {/* Hamburger */}
        <button
          className="md:hidden"
          onClick={() => setOpen(v => !v)}
          aria-label="Menu"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                display: 'block', width: 22, height: 2,
                background: 'var(--ink)', borderRadius: 2,
                transformOrigin: 'center',
                transform: open
                  ? i === 1 ? 'scaleX(0)' : i === 0 ? 'rotate(45deg) translate(5px, 5px)' : 'rotate(-45deg) translate(5px, -5px)'
                  : 'none',
                transition: 'transform 0.2s, opacity 0.2s',
                opacity: open && i === 1 ? 0 : 1,
              }} />
            ))}
          </div>
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden" style={{
          borderTop: '1px solid var(--border)',
          background: 'var(--surface)', padding: '12px 24px 20px',
        }}>
          {NAV_LINKS.map(({ href, label }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link key={href} href={href} onClick={() => setOpen(false)} className="font-secondary" style={{
                display: 'block', padding: '11px 0',
                fontSize: '1rem', fontWeight: active ? 600 : 400,
                color: active ? 'var(--pine)' : 'var(--ink)',
                textDecoration: 'none',
                borderBottom: '1px solid var(--border-soft)',
              }}>
                {label}
              </Link>
            )
          })}
        </div>
      )}
    </header>
  )
}
