import { createClient } from '@supabase/supabase-js'
import { RESTAURANT_ID, type OpeningHourDay } from './restaurant'

export type DayHours = OpeningHourDay

// Days in the order stored in `opening_hours.hours` (Monday first).
export const DAYS_FR = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
  'Dimanche',
]

// schema.org day codes aligned to DAYS_FR order (Lundi..Dimanche).
const SCHEMA_DAY_CODES = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

// Normalise "12h", "12h30", "9:00" -> "HH:MM" for schema.org openingHours.
function normalizeTime(t: string): string {
  const [h, m = '00'] = t.replace(/[hH]/, ':').trim().split(':')
  return `${h.padStart(2, '0')}:${(m || '00').padStart(2, '0')}`
}

// Build schema.org openingHours (e.g. ["Tu 12:00-14:00", ...]) from DB hours.
export function toSchemaOpeningHours(hours: DayHours[]): string[] {
  const out: string[] = []
  hours.forEach((d, i) => {
    const code = SCHEMA_DAY_CODES[i]
    if (!code || d.closedDay) return
    if (!d.closedLunch && d.midi?.debut && d.midi?.fin) {
      out.push(`${code} ${normalizeTime(d.midi.debut)}-${normalizeTime(d.midi.fin)}`)
    }
    if (!d.closedDiner && d.soir?.debut && d.soir?.fin) {
      out.push(`${code} ${normalizeTime(d.soir.debut)}-${normalizeTime(d.soir.fin)}`)
    }
  })
  return out
}

export async function getOpeningHours(): Promise<DayHours[] | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: {
        fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }),
      },
    },
  )

  const { data, error } = await supabase
    .from('opening_hours')
    .select('hours')
    .eq('restaurant_id', RESTAURANT_ID)
    .single()

  if (error || !data) return null
  return data.hours as DayHours[]
}
