import { createClient } from '@supabase/supabase-js'
import { RESTAURANT_ID } from './restaurant'

export type RestaurantInfo = {
  name: string
  // Display form as stored in the DB, e.g. "+33 6 29 10 42 17".
  phone: string
  email: string
  // Multi-line address string as stored in the DB.
  address: string
}

// Used only if the DB is unreachable; keeps the UI from breaking.
export const FALLBACK_INFO: RestaurantInfo = {
  name: 'Restaurant',
  phone: '',
  email: '',
  address: '',
}

// Name / phone / public email / address come from the `restaurants` row so the
// owner changes them in one place and every display (pages, footer, emails,
// JSON-LD) follows.
export async function getRestaurantInfo(): Promise<RestaurantInfo> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) } },
  )

  const { data, error } = await supabase
    .from('restaurants')
    .select('name, phone, email, address')
    .eq('id', RESTAURANT_ID)
    .single()

  if (error || !data) return FALLBACK_INFO
  return {
    name: data.name?.trim() || FALLBACK_INFO.name,
    phone: data.phone?.trim() || FALLBACK_INFO.phone,
    email: data.email?.trim() || FALLBACK_INFO.email,
    address: data.address?.trim() || FALLBACK_INFO.address,
  }
}
