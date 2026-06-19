export const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID!

// Types miroir des tables Supabase du restaurant-admin
export type Restaurant = {
  id: string
  name: string
  phone: string | null
  address: string | null
  reservation_mode: 'simple' | 'advanced'
}

export type OpeningHourDay = {
  midi: { debut: string; fin: string }
  soir: { debut: string; fin: string }
  closedLunch: boolean
  closedDiner: boolean
  closedDay: boolean
}

export type MenuCategory = { id: string; name: string; position: number }
export type MenuFile = { id: string; file_path: string; category_id: string; position: number }

export type RestaurantEvent = { id: string; event_date: string; position: number }
export type EventFile = { id: string; file_path: string; event_id: string; position: number }

export type Formule = {
  id: string
  nom: string
  prix: number
  description: string | null
  elements: string[]
  active: boolean
}

export type ReservationSchedule = {
  midi_active: boolean
  midi_debut: string | null
  midi_fin: string | null
  soir_active: boolean
  soir_debut: string | null
  soir_fin: string | null
  interval_minutes: number
}
