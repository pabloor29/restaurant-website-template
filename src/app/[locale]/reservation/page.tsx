export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getReservationConfig } from '@/lib/reservation'
import { getRestaurantInfo } from '@/lib/restaurant-contact'
import { HeroHeader } from '@/components/HeroHeader'
import { ReservationForm } from './ReservationForm'
import { alternatesFor } from '@/lib/i18n-meta'
import { siteConfig } from '@/config/site'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const [tMeta, tHero, info] = await Promise.all([
    getTranslations({ locale, namespace: 'meta' }),
    getTranslations({ locale, namespace: 'hero' }),
    getRestaurantInfo(),
  ])
  return { title: tHero('reservation'), description: tMeta('reservationDescription', { name: info.name }), alternates: alternatesFor(locale, '/reservation') }
}

export default async function ReservationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const [config, info, t, tHero] = await Promise.all([
    getReservationConfig(),
    getRestaurantInfo(),
    getTranslations('reservation'),
    getTranslations('hero'),
  ])

  return (
    <>
      <HeroHeader title={tHero('reservation')} subtitle={t('subtitle')} />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(32px, 5vw, 56px) 24px clamp(48px, 7vw, 80px)' }}>
        <ReservationForm
          closedWeekdays={config.closedWeekdays}
          closedDates={config.closedDates}
          holidayPeriods={config.holidayPeriods}
          lunchSlots={config.lunchSlots}
          dinnerSlots={config.dinnerSlots}
          dayServices={config.dayServices}
          disabledSlotsByDate={config.disabledSlotsByDate}
          phone={info.phone}
          email={info.email}
          maxGuests={siteConfig.reservation.maxGuests}
          sameDayCutoffHour={siteConfig.reservation.sameDayCutoffHour}
        />
      </div>
    </>
  )
}
