import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { RESTAURANT_ID } from '@/lib/restaurant'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'

const FONTS = `<link href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@700;800&family=Hanken+Grotesk:wght@400;500;600&display=swap" rel="stylesheet">`
const MONOGRAM = (initial: string) =>
  `<div style="display:inline-block;width:34px;height:34px;border-radius:10px;background:#13503B;text-align:center;line-height:34px;vertical-align:middle;"><span style="color:#F5F1E9;font-family:'Schibsted Grotesk',Arial,sans-serif;font-weight:800;font-size:17px;">${initial}</span></div>`
const WORDMARK = (name: string) =>
  `<span style="font-family:'Schibsted Grotesk',Arial,sans-serif;font-weight:800;font-size:18px;letter-spacing:-0.03em;color:#16201B;vertical-align:middle;margin-left:9px;">${name}</span>`

export async function POST(req: NextRequest) {
  const { email, fullName, eventDate, eventTime, numberOfGuests, reservationType, reservationComment, reservationComment2 } = await req.json()

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: restaurant } = await supabase.from('restaurants').select('name, phone, address').eq('id', RESTAURANT_ID).single()
  const restaurantName = restaurant?.name ?? 'Le restaurant'
  const initial = (restaurantName.charAt(0) || 'R').toUpperCase()

  const isConfirmed = reservationType === 'CONFIRMÉE'
  const badgeBg = isConfirmed ? '#E4F1EA' : '#F4E2DD'
  const badgeBorder = isConfirmed ? 'rgba(30,122,82,0.2)' : 'rgba(168,71,58,0.2)'
  const badgeText = isConfirmed ? '#1E7A52' : '#A8473A'
  const badgeLabel = isConfirmed ? '✓ Réservation confirmée' : '✕ Réservation refusée'
  const badgeSub = isConfirmed ? 'Votre table est réservée.' : 'Le restaurant ne peut pas honorer cette demande.'
  const guests = parseInt(numberOfGuests, 10)

  const html = `<!DOCTYPE html><html><head>${FONTS}</head><body style="margin:0;padding:0;background:#F5F1E9;">
    <div style="font-family:'Hanken Grotesk',Arial,sans-serif;max-width:560px;margin:0 auto;background:#F5F1E9;padding:32px 24px;">
      <div style="text-align:center;margin-bottom:28px;">${MONOGRAM(initial)}${WORDMARK(restaurantName)}</div>
      <div style="background:${badgeBg};border:1px solid ${badgeBorder};border-radius:12px;padding:20px 24px;text-align:center;margin-bottom:24px;">
        <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:${badgeText};">${badgeLabel}</p>
        <p style="margin:0;font-size:13px;color:#5E665E;">${badgeSub}</p>
      </div>
      <div style="background:#FFFFFF;border:1px solid #E5DED0;border-radius:12px;padding:24px;margin-bottom:${reservationComment2 ? '16px' : '24px'};">
        <p style="margin:0 0 14px;font-size:11px;font-weight:600;letter-spacing:0.1em;color:#9A9587;text-transform:uppercase;">Réservation concernée</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:9px 0;border-bottom:1px solid #F0EADD;color:#9A9587;font-size:13px;width:38%;">Client</td><td style="padding:9px 0;border-bottom:1px solid #F0EADD;color:#16201B;font-size:14px;font-weight:500;">${fullName}</td></tr>
          <tr><td style="padding:9px 0;border-bottom:1px solid #F0EADD;color:#9A9587;font-size:13px;">Date</td><td style="padding:9px 0;border-bottom:1px solid #F0EADD;color:#16201B;font-size:14px;font-weight:500;">${eventDate} à ${eventTime}</td></tr>
          <tr><td style="padding:9px 0;color:#9A9587;font-size:13px;">Couverts</td><td style="padding:9px 0;color:#16201B;font-size:14px;font-weight:500;">${numberOfGuests} personne${guests > 1 ? 's' : ''}</td></tr>
        </table>
      </div>
      <div style="background:#FFFFFF;border:1px solid #E5DED0;border-radius:12px;padding:20px 24px;margin-bottom:${reservationComment2 ? '16px' : '24px'};">
        <p style="margin:0;font-size:14px;color:#5E665E;line-height:1.6;font-style:italic;">${reservationComment}</p>
      </div>
      ${reservationComment2 ? `<div style="background:#FFFFFF;border:1px solid #E5DED0;border-radius:12px;padding:20px 24px;margin-bottom:24px;"><p style="margin:0;font-size:14px;color:#5E665E;line-height:1.6;">${reservationComment2}</p></div>` : ''}
      <div style="background:#FFFFFF;border:1px solid #E5DED0;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
        <p style="margin:0 0 5px;font-size:14px;font-weight:600;color:#16201B;">${restaurantName}</p>
        ${restaurant?.address ? `<p style="margin:0 0 3px;font-size:13px;color:#5E665E;">${restaurant.address.replace(/\n/g, ', ')}</p>` : ''}
        ${restaurant?.phone ? `<p style="margin:0;font-size:13px;color:#5E665E;">${restaurant.phone}</p>` : ''}
      </div>
      <p style="margin:0;text-align:center;font-size:12px;color:#9A9587;">Propulsé par <a href="https://resa-service.com" style="color:#9A9587;">RESA</a> · resa-service.com</p>
    </div></body></html>`

  const text = [badgeLabel, badgeSub, '', 'Réservation concernée', `Client : ${fullName}`, `Date : ${eventDate} à ${eventTime}`, `Couverts : ${numberOfGuests} personne${guests > 1 ? 's' : ''}`, '', reservationComment, ...(reservationComment2 ? ['', reservationComment2] : []), '', restaurantName, '', 'Propulsé par RESA · resa-service.com'].join('\n')

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Votre réservation chez ${restaurantName} est ${reservationType}`,
    html,
    text,
  })

  if (error) {
    console.error('Resend autoreply error:', JSON.stringify(error))
    return NextResponse.json({ error }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
