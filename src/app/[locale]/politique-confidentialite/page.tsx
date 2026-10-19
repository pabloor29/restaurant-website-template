export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getRestaurantInfo } from '@/lib/restaurant-contact'
import { HeroHeader } from '@/components/HeroHeader'
import { alternatesFor } from '@/lib/i18n-meta'
import { siteConfig } from '@/config/site'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'footer' })
  return { title: t('privacy'), alternates: alternatesFor(locale, '/politique-confidentialite'), robots: { index: true, follow: true } }
}

const wrap: React.CSSProperties = { maxWidth: 760, margin: '0 auto', padding: 'clamp(32px, 5vw, 56px) 24px clamp(48px, 7vw, 80px)', color: 'var(--ink)' }
const h2: React.CSSProperties = { fontSize: '1.3rem', fontWeight: 700, color: 'var(--ink)', marginTop: 32, marginBottom: 10, letterSpacing: '-0.01em' }
const p: React.CSSProperties = { fontSize: '1rem', lineHeight: 1.75, color: 'var(--slate)' }
const ul: React.CSSProperties = { ...p, paddingLeft: 22, marginTop: 8 }

export default async function PolitiqueConfidentialitePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const [info, t] = await Promise.all([getRestaurantInfo(), getTranslations('footer')])
  const host = siteConfig.url.replace(/^https?:\/\//, '')
  const email = info.email

  return (
    <>
      <HeroHeader title={t('privacy')} />
      <div style={wrap} className="font-secondary">
        <p style={p}>
          La présente politique de confidentialité décrit comment {info.name} collecte, utilise et protège les données
          personnelles des utilisateurs du site {host}, conformément au Règlement Général sur la Protection des Données
          (RGPD) et à la loi Informatique et Libertés.
        </p>

        <section>
          <h2 className="font-primary" style={h2}>Responsable du traitement</h2>
          <p style={p}>
            {info.name}{info.address ? ` — ${info.address.split('\n').join(', ')}` : ''}
            {email && (<> — <a href={`mailto:${email}`} style={{ color: 'var(--pine)' }}>{email}</a></>)}.
          </p>
        </section>

        <section>
          <h2 className="font-primary" style={h2}>Données collectées</h2>
          <p style={p}>Nous collectons uniquement les données strictement nécessaires aux finalités décrites ci-dessous :</p>
          <ul style={ul}>
            <li><strong>Formulaire de réservation</strong> : nom, email, numéro de téléphone, date et heure de réservation, nombre de personnes, commentaire.</li>
            <li><strong>Données de navigation</strong> : statistiques de fréquentation anonymisées (via Vercel Analytics, sans cookies).</li>
          </ul>
        </section>

        <section>
          <h2 className="font-primary" style={h2}>Finalités du traitement</h2>
          <ul style={ul}>
            <li>Gestion des réservations en ligne et confirmation par email.</li>
            <li>Mesure d&apos;audience anonyme et amélioration du site.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-primary" style={h2}>Base légale</h2>
          <p style={p}>Les traitements sont fondés sur votre consentement (formulaires) et sur l&apos;intérêt légitime du restaurant (statistiques anonymes de fréquentation).</p>
        </section>

        <section>
          <h2 className="font-primary" style={h2}>Durée de conservation</h2>
          <ul style={ul}>
            <li>Réservations : jusqu&apos;à 12 mois après la date de la réservation.</li>
            <li>Statistiques anonymes : jusqu&apos;à 25 mois.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-primary" style={h2}>Destinataires</h2>
          <p style={p}>Vos données sont destinées à {info.name} uniquement. Elles ne sont jamais vendues ni cédées à des tiers à des fins commerciales. Certains sous-traitants techniques peuvent les héberger ou les transmettre :</p>
          <ul style={ul}>
            <li><strong>{siteConfig.legal.hosting.name}</strong> — hébergement du site.</li>
            <li><strong>Resend</strong> — envoi des emails de confirmation de réservation.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-primary" style={h2}>Cookies</h2>
          <p style={p}>
            Le site utilise Vercel Analytics, un outil de mesure d&apos;audience <strong>sans cookies</strong> et respectueux de
            la vie privée. Aucun cookie tiers de tracking n&apos;est déposé sur votre appareil.
          </p>
        </section>

        <section>
          <h2 className="font-primary" style={h2}>Vos droits</h2>
          <p style={p}>
            Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de limitation,
            d&apos;opposition et de portabilité concernant vos données. Pour exercer ces droits, contactez-nous
            {email ? (<> à <a href={`mailto:${email}`} style={{ color: 'var(--pine)' }}>{email}</a></>) : ''}.
            Vous pouvez également introduire une réclamation auprès de la CNIL (<a href="https://www.cnil.fr" style={{ color: 'var(--pine)' }}>www.cnil.fr</a>).
          </p>
        </section>

        <section>
          <h2 className="font-primary" style={h2}>Sécurité</h2>
          <p style={p}>Nous mettons en œuvre les mesures techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, perte ou divulgation.</p>
        </section>
      </div>
    </>
  )
}
