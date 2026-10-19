'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { siteConfig } from '@/config/site'

const reviews = siteConfig.reviews

export function GoogleReviews() {
  const t = useTranslations('reviews')
  const [index, setIndex] = useState(0)

  if (reviews.length === 0) return null
  const review = reviews[index]
  const paginate = (dir: number) => setIndex((i) => (i + dir + reviews.length) % reviews.length)

  return (
    <section style={{ background: 'var(--surface-alt)', padding: 'clamp(48px, 7vw, 80px) 24px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <h2 className="font-primary" style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
            {t('title')}
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 32 }}>
          {[...Array(5)].map((_, i) => (
            <span key={i} style={{ color: '#f5b301', fontSize: '1rem' }}>★</span>
          ))}
          <span className="font-secondary" style={{ marginLeft: 8, color: 'var(--slate)', fontSize: '0.9rem' }}>
            {siteConfig.rating.value} {t('ratingSuffix')}
          </span>
        </div>

        <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button onClick={() => paginate(-1)} aria-label={t('previous')} style={{ position: 'absolute', left: -4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pine)', fontSize: '1.6rem', padding: 8 }}>‹</button>

          <div style={{ width: '100%', padding: '0 36px' }}>
            <article key={index} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px 30px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', animation: 'fadeIn 0.3s ease' }}>
              <div style={{ display: 'flex', gap: 3, marginBottom: 14 }}>
                {[...Array(review.rating)].map((_, i) => (
                  <span key={i} style={{ color: '#f5b301', fontSize: '0.9rem' }}>★</span>
                ))}
              </div>
              <p className="font-accent" style={{ fontSize: '1.05rem', color: 'var(--ink)', lineHeight: 1.7, fontStyle: 'italic', textAlign: 'justify' }}>
                &ldquo;{review.text}&rdquo;
              </p>
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 36, height: 36, borderRadius: 99, background: 'var(--pine)', color: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.9rem' }}>
                  {review.name.charAt(0)}
                </span>
                <div>
                  <p className="font-secondary" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink)' }}>{review.name}</p>
                  {review.date && <p className="font-secondary" style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{review.date}</p>}
                </div>
              </div>
            </article>
          </div>

          <button onClick={() => paginate(1)} aria-label={t('next')} style={{ position: 'absolute', right: -4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pine)', fontSize: '1.6rem', padding: 8 }}>›</button>
        </div>

        {reviews.length > 1 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
            {reviews.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={t('goToReview', { number: i + 1 })}
                style={{ width: i === index ? 20 : 8, height: 8, borderRadius: 99, border: 'none', cursor: 'pointer', background: i === index ? 'var(--pine)' : 'rgba(19,80,59,0.25)', transition: 'all 0.3s' }}
              />
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }`}</style>
    </section>
  )
}
