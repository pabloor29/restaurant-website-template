import { createClient } from '@supabase/supabase-js'
import { RESTAURANT_ID } from './restaurant'
import { DAYS_FR, type DayHours } from './opening-hours'

export type DayServices = { lunchOpen: boolean; dinnerOpen: boolean }

export type ReservationConfig = {
  closedWeekdays: number[]
  closedDates: string[]
  holidayPeriods: { debut: string; fin: string }[]
  timeSlots: string[]
  lunchSlots: string[]
  dinnerSlots: string[]
  // Indexed by JS Date.getDay() (0=Sun…6=Sat).
  dayServices: DayServices[]
  // Per-date punctually disabled slots. Key: "YYYY-MM-DD", value: ["HH:MM", …].
  disabledSlotsByDate: Record<string, string[]>
}

// DAYS_FR index (0=Lundi…6=Dimanche) → JS Date.getDay() (0=Sun, 1=Mon…6=Sat).
const DAYS_FR_TO_JS: Record<number, number> = { 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 0 }

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0')
  const m = (minutes % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}

function generateSlots(debut: string, fin: string, step = 30): string[] {
  const slots: string[] = []
  const start = timeToMinutes(debut)
  const end = timeToMinutes(fin)
  const inc = step > 0 ? step : 30
  for (let t = start; t <= end; t += inc) slots.push(minutesToTime(t))
  return slots
}

// Row shape of the reservation_schedule table (single booking window + step).
type ReservationSchedule = {
  midi_active: boolean | null
  midi_debut: string | null
  midi_fin: string | null
  soir_active: boolean | null
  soir_debut: string | null
  soir_fin: string | null
  interval_minutes: number | null
}

export async function getReservationConfig(): Promise<ReservationConfig> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { fetch: (url, opts) => fetch(url, { ...opts, cache: 'no-store' }) } },
  )

  // Only fetch overrides from today onward — past dates can't be booked anyway.
  const todayStr = new Date().toISOString().slice(0, 10)

  const [hoursResult, closedDaysResult, holidaysResult, overridesResult, scheduleResult] =
    await Promise.all([
      supabase.from('opening_hours').select('hours').eq('restaurant_id', RESTAURANT_ID).single(),
      supabase.from('closed_days').select('days').eq('restaurant_id', RESTAURANT_ID).single(),
      supabase.from('holidays').select('periods').eq('restaurant_id', RESTAURANT_ID).single(),
      supabase
        .from('reservation_slot_overrides')
        .select('date, disabled_slots')
        .eq('restaurant_id', RESTAURANT_ID)
        .gte('date', todayStr),
      supabase
        .from('reservation_schedule')
        .select('midi_active, midi_debut, midi_fin, soir_active, soir_debut, soir_fin, interval_minutes')
        .eq('restaurant_id', RESTAURANT_ID)
        .single(),
    ])

  const hours: DayHours[] | null = hoursResult.data?.hours ?? null
  const closedDates: string[] = closedDaysResult.data?.days ?? []
  const holidayPeriods: { debut: string; fin: string }[] = holidaysResult.data?.periods ?? []
  const schedule: ReservationSchedule | null = scheduleResult.data ?? null

  const disabledSlotsByDate: Record<string, string[]> = {}
  for (const row of overridesResult.data ?? []) {
    const slots = Array.isArray(row.disabled_slots) ? row.disabled_slots : []
    if (slots.length > 0) disabledSlotsByDate[row.date] = slots
  }

  const closedWeekdays: number[] = []
  const lunchSet = new Set<string>()
  const dinnerSet = new Set<string>()
  // Indexed by JS getDay(); default open, overwritten per configured day below.
  const dayServices: DayServices[] = Array.from({ length: 7 }, () => ({
    lunchOpen: true,
    dinnerOpen: true,
  }))

  if (hours) {
    hours.forEach((day, index) => {
      const jsDay = DAYS_FR_TO_JS[index]
      if (day.closedDay) {
        closedWeekdays.push(jsDay)
        dayServices[jsDay] = { lunchOpen: false, dinnerOpen: false }
      } else {
        const lunchOpen = !day.closedLunch && !!day.midi?.debut && !!day.midi?.fin
        const dinnerOpen = !day.closedDiner && !!day.soir?.debut && !!day.soir?.fin
        dayServices[jsDay] = { lunchOpen, dinnerOpen }
        if (lunchOpen) generateSlots(day.midi.debut, day.midi.fin).forEach((s) => lunchSet.add(s))
        if (dinnerOpen) generateSlots(day.soir.debut, day.soir.fin).forEach((s) => dinnerSet.add(s))
      }
    })
  }

  // Slot TIMES come from reservation_schedule (single booking window + interval)
  // when configured — this is the source the admin "Créneaux" tab writes and the
  // one its punctual-disable UI generates from, so the "HH:MM" strings match.
  // opening_hours still governs WHICH days each service is offered (dayServices
  // above) plus closed days / holidays. Falls back to the per-day opening_hours
  // windows (30 min) when no schedule row exists.
  let lunchSlots: string[]
  let dinnerSlots: string[]
  if (schedule) {
    const step = schedule.interval_minutes ?? 30
    lunchSlots =
      schedule.midi_active && schedule.midi_debut && schedule.midi_fin
        ? generateSlots(schedule.midi_debut, schedule.midi_fin, step)
        : []
    dinnerSlots =
      schedule.soir_active && schedule.soir_debut && schedule.soir_fin
        ? generateSlots(schedule.soir_debut, schedule.soir_fin, step)
        : []
  } else {
    lunchSlots = Array.from(lunchSet).sort()
    dinnerSlots = Array.from(dinnerSet).sort()
  }

  const timeSlots = Array.from(new Set([...lunchSlots, ...dinnerSlots])).sort()

  return {
    closedWeekdays,
    closedDates,
    holidayPeriods,
    timeSlots,
    lunchSlots,
    dinnerSlots,
    dayServices,
    disabledSlotsByDate,
  }
}
