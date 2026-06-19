import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const restaurantId = process.env.NEXT_PUBLIC_RESTAURANT_ID
  if (!restaurantId) return NextResponse.json({ error: 'RESTAURANT_ID manquant' }, { status: 500 })

  const body = await req.json()
  const { date, time_slot, covers, name, email, phone, notes } = body

  if (!date || !time_slot || !covers || !name) {
    return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { error } = await supabase.from('reservations').insert({
    restaurant_id: restaurantId,
    date,
    time_slot,
    covers: Number(covers),
    name,
    email: email || null,
    phone: phone || null,
    notes: notes || null,
    status: 'pending',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
