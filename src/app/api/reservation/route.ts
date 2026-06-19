import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID ?? process.env.RESTAURANT_ID

const FONTS = `<link href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@700;800&family=Hanken+Grotesk:wght@400;500;600&display=swap" rel="stylesheet">`

const HEADER = `
  <div style="display:inline-block;width:34px;height:34px;border-radius:10px;background:#13503B;text-align:center;line-height:34px;vertical-align:middle;">
    <span style="color:#F5F1E9;font-family:'Schibsted Grotesk',Arial,sans-serif;font-weight:800;font-size:17px;letter-spacing:-0.03em;">R</span>
  </div>
  <span style="font-family:'Schibsted Grotesk',Arial,sans-serif;font-weight:800;font-size:18px;letter-spacing:-0.03em;color:#16201B;vertical-align:middle;margin-left:9px;">RESA<span style="color:#C77E3A;">.</span></span>`

function fmtDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function detailsTable(rows: [string, string][]): string {
  return `<table style="width:100%;border-collapse:collapse;">${rows.map(([label, value], i) => `
    <tr>
      <td style="padding:9px 0;${i < rows.length - 1 ? 'border-bottom:1px solid #F0EADD;' : ''}color:#9A9587;font-size:13px;width:38%;font-family:'Hanken Grotesk',Arial,sans-serif;">${label}</td>
      <td style="padding:9px 0;${i < rows.length - 1 ? 'border-bottom:1px solid #F0EADD;' : ''}color:#16201B;font-size:14px;font-weight:500;font-family:'Hanken Grotesk',Arial,sans-serif;">${value}</td>
    </tr>`).join('')}</table>`
}

export async function POST(req: NextRequest) {
  const { name, email, phone, covers, date, time_slot, notes } = await req.json()

  if (!date || !time_slot || !covers || !name) {
    return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: restaurant }, { error: dbError }] = await Promise.all([
    supabase.from('restaurants').select('name, email, phone, address').eq('id', RESTAURANT_ID).single(),
    supabase.from('reservations').insert({
      restaurant_id: RESTAURANT_ID,
      date,
      time_slot,
      covers: Number(covers),
      name: name.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      notes: notes?.trim() || null,
      status: 'pending',
    }),
  ])

  if (dbError) {
    console.error('DB insert error:', dbError.message)
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  const restaurantName = restaurant?.name ?? 'Le restaurant'
  const dateLabel = fmtDate(date)

  const rows: [string, string][] = [
    ['Nom', name],
    ['Email', email || '—'],
    ['Téléphone', phone || '—'],
    ['Date', dateLabel],
    ['Heure', time_slot],
    ['Couverts', `${covers} personne${Number(covers) > 1 ? 's' : ''}`],
    ...(notes ? [['Notes', notes] as [string, string]] : []),
  ]

  const restaurantBlock = `
    <div style="background:#FFFFFF;border:1px solid #E5DED0;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#16201B;font-family:'Hanken Grotesk',Arial,sans-serif;">${restaurantName}</p>
      ${restaurant?.address ? `<p style="margin:0 0 3px;font-size:13px;color:#5E665E;font-family:'Hanken Grotesk',Arial,sans-serif;">${restaurant.address.replace(/\n/g, ', ')}</p>` : ''}
      ${restaurant?.phone ? `<p style="margin:0;font-size:13px;color:#5E665E;font-family:'Hanken Grotesk',Arial,sans-serif;">${restaurant.phone}</p>` : ''}
    </div>`

  const footer = `<p style="margin:0;text-align:center;font-size:12px;color:#9A9587;font-family:'Hanken Grotesk',Arial,sans-serif;">
    Propulsé par <a href="https://resa-service.com" style="color:#9A9587;text-decoration:none;">RESA</a> · resa-service.com
  </p>`

  const manageUrl = `https://resa-service.com/restaurant/${RESTAURANT_ID}/reservations`

  const restaurantHtml = `<!DOCTYPE html><html><head>${FONTS}</head>
    <body style="margin:0;padding:0;background:#F5F1E9;">
      <div style="font-family:'Hanken Grotesk',Arial,sans-serif;max-width:560px;margin:0 auto;background:#F5F1E9;padding:32px 24px;">
        <div style="text-align:center;margin-bottom:28px;">${HEADER}</div>
        <div style="background:#F6EBD6;border:1px solid rgba(185,125,43,0.25);border-radius:12px;padding:16px 20px;text-align:center;margin-bottom:24px;">
          <p style="margin:0 0 3px;font-size:15px;font-weight:700;color:#B97D2B;font-family:'Hanken Grotesk',Arial,sans-serif;">Nouvelle demande de réservation</p>
          <p style="margin:0;font-size:13px;color:#5E665E;font-family:'Hanken Grotesk',Arial,sans-serif;">En attente de validation</p>
        </div>
        <div style="background:#FFFFFF;border:1px solid #E5DED0;border-radius:12px;padding:24px;margin-bottom:24px;">
          <p style="margin:0 0 14px;font-size:11px;font-weight:600;letter-spacing:0.1em;color:#9A9587;text-transform:uppercase;font-family:'Hanken Grotesk',Arial,sans-serif;">Détails de la réservation</p>
          ${detailsTable(rows)}
        </div>
        <div style="text-align:center;margin-bottom:28px;">
          <a href="${manageUrl}" target="_blank" rel="noopener"
            style="display:inline-block;background:#C77E3A;color:#FFFFFF;text-decoration:none;padding:12px 24px;border-radius:10px;font-family:'Hanken Grotesk',Arial,sans-serif;font-weight:600;font-size:14px;">
            Gérer dans RESA
          </a>
        </div>
        ${footer}
      </div>
    </body></html>`

  const clientHtml = `<!DOCTYPE html><html><head>${FONTS}</head>
    <body style="margin:0;padding:0;background:#F5F1E9;">
      <div style="font-family:'Hanken Grotesk',Arial,sans-serif;max-width:560px;margin:0 auto;background:#F5F1E9;padding:32px 24px;">
        <div style="text-align:center;margin-bottom:28px;">${HEADER}</div>
        <div style="background:#F6EBD6;border:1px solid rgba(185,125,43,0.25);border-radius:12px;padding:20px 24px;text-align:center;margin-bottom:24px;">
          <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#B97D2B;font-family:'Hanken Grotesk',Arial,sans-serif;">Demande reçue · En attente de confirmation</p>
          <p style="margin:0;font-size:13px;color:#5E665E;font-family:'Hanken Grotesk',Arial,sans-serif;">Votre réservation sera confirmée dès que le restaurant l'aura validée.</p>
        </div>
        <div style="background:#FFFFFF;border:1px solid #E5DED0;border-radius:12px;padding:24px;margin-bottom:24px;">
          <p style="margin:0 0 14px;font-size:11px;font-weight:600;letter-spacing:0.1em;color:#9A9587;text-transform:uppercase;font-family:'Hanken Grotesk',Arial,sans-serif;">Récapitulatif</p>
          ${detailsTable(rows)}
        </div>
        ${restaurantBlock}
        ${footer}
      </div>
    </body></html>`

  const sends: Promise<{ error: { message: string } | null }>[] = []

  if (restaurant?.email) {
    sends.push(
      resend.emails.send({
        from: FROM_EMAIL,
        to: restaurant.email,
        subject: `Nouvelle réservation — ${name} — ${dateLabel} à ${time_slot}`,
        html: restaurantHtml,
      }).then(r => ({ error: r.error ? { message: r.error.message } : null }))
    )
  }

  if (email?.trim()) {
    sends.push(
      resend.emails.send({
        from: FROM_EMAIL,
        to: email.trim(),
        subject: `Votre demande de réservation chez ${restaurantName}`,
        html: clientHtml,
      }).then(r => ({ error: r.error ? { message: r.error.message } : null }))
    )
  }

  if (sends.length > 0) {
    const results = await Promise.all(sends)
    const failed = results.find(r => r.error)
    if (failed?.error) {
      console.error('Resend error:', failed.error.message)
    }
  }

  return NextResponse.json({ success: true })
}
