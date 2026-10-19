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
  return { title: t('cgu'), alternates: alternatesFor(locale, '/cgu'), robots: { index: true, follow: true } }
}

const wrap: React.CSSProperties = { maxWidth: 760, margin: '0 auto', padding: 'clamp(32px, 5vw, 56px) 24px clamp(48px, 7vw, 80px)', color: 'var(--ink)' }
const h2: React.CSSProperties = { fontSize: '1.3rem', fontWeight: 700, color: 'var(--ink)', marginTop: 32, marginBottom: 10, letterSpacing: '-0.01em' }
const p: React.CSSProperties = { fontSize: '1rem', lineHeight: 1.75, color: 'var(--slate)' }
const ul: React.CSSProperties = { ...p, paddingLeft: 22, marginTop: 8 }

export default async function CguPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const [info, t] = await Promise.all([getRestaurantInfo(), getTranslations('footer')])
  const host = siteConfig.url.replace(/^https?:\/\//, '')

  return (
    <>
      <HeroHeader title="Conditions Générales d'Utilisation" />
      <div style={wrap} className="font-secondary">
        <section>
          <h2 className="font-primary" style={h2}>1. Objet</h2>
          <p style={p}>Les présentes Conditions Générales d&apos;Utilisation (CGU) ont pour objet de définir les modalités d&apos;accès et d&apos;utilisation du site <strong>{host}</strong>, édité par {info.name}. Toute utilisation du site implique l&apos;acceptation pleine et entière de ces CGU.</p>
        </section>
        <section>
          <h2 className="font-primary" style={h2}>2. Accès au site</h2>
          <p style={p}>L&apos;accès au site est gratuit. Les frais d&apos;accès et d&apos;utilisation du réseau de télécommunications sont à la charge de l&apos;utilisateur. {info.name} se réserve le droit de suspendre ou d&apos;interrompre l&apos;accès au site à tout moment, notamment pour des opérations de maintenance, sans préavis ni indemnité.</p>
        </section>
        <section>
          <h2 className="font-primary" style={h2}>3. Services proposés</h2>
          <p style={p}>Le site permet de :</p>
          <ul style={ul}>
            <li>Consulter la carte, les horaires et les informations du restaurant.</li>
            <li>Effectuer une demande de réservation en ligne.</li>
          </ul>
        </section>
        <section>
          <h2 className="font-primary" style={h2}>4. Réservation</h2>
          <p style={p}>Toute demande de réservation effectuée via le site est soumise à confirmation par le restaurant. Une réservation n&apos;est définitive qu&apos;après réception d&apos;un email de confirmation. En cas d&apos;empêchement, l&apos;utilisateur s&apos;engage à prévenir le restaurant dans les meilleurs délais.</p>
        </section>
        <section>
          <h2 className="font-primary" style={h2}>5. Obligations de l&apos;utilisateur</h2>
          <p style={p}>L&apos;utilisateur s&apos;engage à fournir des informations exactes lors de l&apos;utilisation des formulaires, à ne pas utiliser le site à des fins illicites, et à ne pas porter atteinte au bon fonctionnement du site (intrusion, surcharge, contenu malveillant).</p>
        </section>
        <section>
          <h2 className="font-primary" style={h2}>6. Propriété intellectuelle</h2>
          <p style={p}>L&apos;ensemble du contenu du site (textes, images, logos, vidéos, code) est protégé par le droit d&apos;auteur. Toute reproduction sans autorisation préalable écrite est interdite. Voir les <a href="/mentions-legales" style={{ color: 'var(--pine)' }}>mentions légales</a> pour plus de détails.</p>
        </section>
        <section>
          <h2 className="font-primary" style={h2}>7. Données personnelles</h2>
          <p style={p}>Le traitement des données personnelles est décrit dans notre <a href="/politique-confidentialite" style={{ color: 'var(--pine)' }}>politique de confidentialité</a>.</p>
        </section>
        <section>
          <h2 className="font-primary" style={h2}>8. Responsabilité</h2>
          <p style={p}>{info.name} ne saurait être tenu responsable des dommages directs ou indirects résultant de l&apos;utilisation du site, d&apos;une indisponibilité temporaire, d&apos;une erreur ou d&apos;une omission dans les contenus publiés.</p>
        </section>
        <section>
          <h2 className="font-primary" style={h2}>9. Modification des CGU</h2>
          <p style={p}>{info.name} se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs sont invités à les consulter régulièrement.</p>
        </section>
        <section>
          <h2 className="font-primary" style={h2}>10. Droit applicable</h2>
          <p style={p}>Les présentes CGU sont régies par le droit français. Tout litige relatif à leur interprétation ou à leur exécution relève de la compétence des tribunaux français.</p>
        </section>
      </div>
    </>
  )
}
