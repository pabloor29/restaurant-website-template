export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { getRestaurantInfo } from '@/lib/restaurant-contact'
import { ReservationValidation } from '@/components/ReservationValidation'

// Internal tool opened from the restaurant notification email — keep it out of
// search indexes.
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function ReservationAutoReplyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const info = await getRestaurantInfo()
  return <ReservationValidation phone={info.phone} name={info.name} address={info.address} />
}
