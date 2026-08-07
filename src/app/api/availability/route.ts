import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { RESTAURANT_ID } from '@/lib/restaurant'

// Availability for the booking form: which seating times can still take a party
// of `covers` on `date`. Capacity = total seats of the active (non-disabled)
// tables — tables are modular, so any party up to the free seats can be seated
// by combining tables. A table stays busy for the per-service turn duration.
//   GET /api/availability?date=YYYY-MM-DD&covers=N  ->  { date, covers, slots: [] }

const ACTIVE_STATUSES = ['pending', 'accepted', 'arrived']

const pad = (n: number) => String(n).padStart(2, '0')
const hmToMin = (t: string) => { const [h, m] = t.split(':').map(Number); return (h || 0) * 60 + (m || 0) }
const minToHm = (x: number) => `${pad(Math.floor(x / 60))}:${pad(x % 60)}`
const hm = (t: string | null) => (t ?? '').slice(0, 5)

function genSlots(debut: string | null, fin: string | null, interval: number): string[] {
  if (!debut || !fin || interval <= 0) return []
  const end = hmToMin(fin); const out: string[] = []
  for (let t = hmToMin(debut); t <= end; t += interval) out.push(minToHm(t))
  return out
}

type Tbl = { seats: number; disabled: boolean; room_id: string }

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const covers = Math.max(1, Number(searchParams.get('covers')) || 2)
  if (!date) return NextResponse.json({ error: 'date requise (YYYY-MM-DD)' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const [
    { data: restaurant },
    { data: sched },
    { data: override },
    { data: rooms },
    { data: tableRows },
    { data: resaRows },
  ] = await Promise.all([
    supabase.from('restaurants').select('table_turn_midi, table_turn_soir').eq('id', RESTAURANT_ID).single(),
    supabase.from('reservation_schedule').select('*').eq('restaurant_id', RESTAURANT_ID).single(),
    supabase.from('reservation_slot_overrides').select('disabled_slots').eq('restaurant_id', RESTAURANT_ID).eq('date', date).single(),
    supabase.from('floor_rooms').select('id, disabled').eq('restaurant_id', RESTAURANT_ID),
    supabase.from('floor_tables').select('seats, disabled, room_id').eq('restaurant_id', RESTAURANT_ID),
    supabase.from('reservations').select('time_slot, covers, status').eq('restaurant_id', RESTAURANT_ID).eq('date', date).in('status', ACTIVE_STATUSES),
  ])

  const turnMidi = restaurant?.table_turn_midi ?? 120
  const turnSoir = restaurant?.table_turn_soir ?? 120
  const soirDebut = hm(sched?.soir_debut) || '19:00'

  const disabled = new Set<string>((override?.disabled_slots as string[] | undefined) ?? [])
  const candidates = [
    ...(sched?.midi_active !== false ? genSlots(hm(sched?.midi_debut) || '12:00', hm(sched?.midi_fin) || '14:00', sched?.interval_minutes ?? 30) : []),
    ...(sched?.soir_active !== false ? genSlots(hm(sched?.soir_debut) || '19:00', hm(sched?.soir_fin) || '22:30', sched?.interval_minutes ?? 30) : []),
  ].filter(s => !disabled.has(s))

  const disabledRooms = new Set((rooms ?? []).filter(r => r.disabled).map(r => r.id))
  const totalSeats = ((tableRows ?? []) as Tbl[])
    .filter(t => !t.disabled && !disabledRooms.has(t.room_id))
    .reduce((s, t) => s + t.seats, 0)
  const hasPlan = totalSeats > 0
  const resas = (resaRows ?? []) as { time_slot: string; covers: number }[]

  const slots = candidates.filter(slot => {
    if (!hasPlan) return true
    if (covers > totalSeats) return false
    const start = hmToMin(slot)
    const service = slot >= soirDebut ? 'soir' : 'midi'
    const turnMin = service === 'soir' ? turnSoir : turnMidi
    const booked = resas.reduce((s, r) => Math.abs(hmToMin(hm(r.time_slot)) - start) < turnMin ? s + r.covers : s, 0)
    return booked + covers <= totalSeats
  })

  return NextResponse.json({ date, covers, slots })
}
