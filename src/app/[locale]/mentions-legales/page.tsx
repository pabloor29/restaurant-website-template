export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getRestaurantInfo } from '@/lib/restaurant-contact'
import { SHOW_PHONE } from '@/lib/phone'
import { HeroHeader } from '@/components/HeroHeader'
import { alternatesFor } from '@/lib/i18n-meta'
import { siteConfig } from '@/config/site'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'footer' })
  return { title: t('legal'), alternates: alternatesFor(locale, '/mentions-legales'), robots: { index: true, follow: true } }
}

const wrap: React.CSSProperties = { maxWidth: 760, margin: '0 auto', padding: 'clamp(32px, 5vw, 56px) 24px clamp(48px, 7vw, 80px)', color: 'var(--ink)' }
const h2: React.CSSProperties = { fontSize: '1.3rem', fontWeight: 700, color: 'var(--ink)', marginTop: 32, marginBottom: 10, letterSpacing: '-0.01em' }
const p: React.CSSProperties = { fontSize: '1rem', lineHeight: 1.75, color: 'var(--slate)' }

export default async function MentionsLegalesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const [info, t] = await Promise.all([getRestaurantInfo(), getTranslations('footer')])
  const host = siteConfig.url.replace(/^https?:\/\//, '')
  const L = siteConfig.legal

  return (
    <>
      <HeroHeader title={t('legal')} />
      <div style={wrap} className="font-secondary">
        <section>
          <h2 className="font-primary" style={h2}>Éditeur du site</h2>
          <p style={p}>
            Le site <strong>{host}</strong> est édité par :<br />
            <strong>{info.name}</strong><br />
            {info.address && (<>{info.address.split('\n').join(', ')}<br /></>)}
            {SHOW_PHONE && info.phone && (<>Téléphone : {info.phone}<br /></>)}
            {info.email && (<>Email : {info.email}<br /></>)}
            Forme juridique : {L.legalForm}<br />
            SIRET : {L.siret}<br />
            N° TVA intracommunautaire : {L.tva}<br />
            Directeur de la publication : {L.publicationDirector}
          </p>
        </section>

        <section>
          <h2 className="font-primary" style={h2}>Hébergeur</h2>
          <p style={p}>
            Le site est hébergé par :<br />
            <strong>{L.hosting.name}</strong><br />
            {L.hosting.address}<br />
            Site : <a href={L.hosting.url} style={{ color: 'var(--pine)' }}>{L.hosting.url.replace(/^https?:\/\//, '')}</a>
          </p>
        </section>

        <section>
          <h2 className="font-primary" style={h2}>Propriété intellectuelle</h2>
          <p style={p}>
            L&apos;ensemble des éléments présents sur le site (textes, images, photographies, logos, vidéos, graphismes)
            est la propriété exclusive de {info.name} ou de ses partenaires. Toute reproduction, représentation, modification
            ou exploitation, totale ou partielle, sans autorisation écrite préalable, est strictement interdite et constitue
            une contrefaçon sanctionnée par les articles L.335-2 et suivants du Code de la propriété intellectuelle.
          </p>
        </section>

        <section>
          <h2 className="font-primary" style={h2}>Crédits</h2>
          <p style={p}>
            Conception et développement : <a href={L.developer.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--pine)' }}>{L.developer.name}</a>.
          </p>
        </section>

        <section>
          <h2 className="font-primary" style={h2}>Responsabilité</h2>
          <p style={p}>
            Les informations diffusées sur ce site sont données à titre indicatif. {info.name} s&apos;efforce de fournir des
            informations exactes et à jour, mais ne saurait être tenu responsable des erreurs ou omissions, ni de l&apos;utilisation
            qui pourrait en être faite par un tiers.
          </p>
        </section>

        {info.email && (
          <section>
            <h2 className="font-primary" style={h2}>Contact</h2>
            <p style={p}>
              Pour toute question relative aux présentes mentions légales, vous pouvez nous contacter à l&apos;adresse{' '}
              <a href={`mailto:${info.email}`} style={{ color: 'var(--pine)' }}>{info.email}</a>.
            </p>
          </section>
        )}
      </div>
    </>
  )
}
