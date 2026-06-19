import { createClient } from '@/lib/supabase/server'
import { RESTAURANT_ID } from '@/lib/restaurant'
import { ReservationForm } from './ReservationForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Réserver' }

export default async function ReservationPage() {
  const supabase = await createClient()

  const [{ data: schedule }, { data: closedDays }, { data: hours }, { data: holidays }] = await Promise.all([
    supabase.from('reservation_schedule').select('*').eq('restaurant_id', RESTAURANT_ID).single(),
    supabase.from('closed_days').select('days').eq('restaurant_id', RESTAURANT_ID).single(),
    supabase.from('opening_hours').select('hours').eq('restaurant_id', RESTAURANT_ID).single(),
    supabase.from('holidays').select('periods').eq('restaurant_id', RESTAURANT_ID).single(),
  ])

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(40px, 6vw, 72px) 24px' }}>
      <h1 className="font-primary" style={{
        fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800,
        color: 'var(--ink)', letterSpacing: '-0.03em', marginBottom: 8,
      }}>
        Réserver une table
      </h1>
      <p className="font-accent" style={{ fontSize: '1.1rem', color: 'var(--muted)', marginBottom: 'clamp(28px, 4vw, 44px)', fontStyle: 'italic' }}>
        Votre demande sera confirmée par notre équipe
      </p>

      <ReservationForm
        restaurantId={RESTAURANT_ID}
        schedule={schedule}
        closedDays={closedDays?.days ?? []}
        openingHours={hours?.hours ?? null}
        holidayPeriods={holidays?.periods ?? []}
      />
    </div>
  )
}
