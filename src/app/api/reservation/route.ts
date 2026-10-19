import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { RESTAURANT_ID } from '@/lib/restaurant'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'

const FONTS = `<link href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@700;800&family=Hanken+Grotesk:wght@400;500;600&display=swap" rel="stylesheet">`
const MONOGRAM = (initial: string) =>
  `<div style="display:inline-block;width:34px;height:34px;border-radius:10px;background:#13503B;text-align:center;line-height:34px;vertical-align:middle;"><span style="color:#F5F1E9;font-family:'Schibsted Grotesk',Arial,sans-serif;font-weight:800;font-size:17px;">${initial}</span></div>`
const WORDMARK = (name: string) =>
  `<span style="font-family:'Schibsted Grotesk',Arial,sans-serif;font-weight:800;font-size:18px;letter-spacing:-0.03em;color:#16201B;vertical-align:middle;margin-left:9px;">${name}</span>`

// Guest confirmation email strings, per language.
const EMAIL_T = {
  fr: { dateLocale: 'fr-FR', subject: 'Confirmation de votre demande de réservation', heading: 'Demande reçue · En attente de confirmation', sub: "Votre réservation sera confirmée dès que le restaurant l'aura validée.", recap: 'Récapitulatif', name: 'Nom', email: 'Email', phone: 'Téléphone', date: 'Date', time: 'Heure', covers: 'Couverts', notes: 'Notes', peopleSingular: 'personne', peoplePlural: 'personnes' },
  en: { dateLocale: 'en-GB', subject: 'Confirmation of your reservation request', heading: 'Request received · Awaiting confirmation', sub: 'Your reservation will be confirmed as soon as the restaurant has validated it.', recap: 'Summary', name: 'Name', email: 'Email', phone: 'Phone', date: 'Date', time: 'Time', covers: 'Guests', notes: 'Notes', peopleSingular: 'person', peoplePlural: 'people' },
  es: { dateLocale: 'es-ES', subject: 'Confirmación de su solicitud de reserva', heading: 'Solicitud recibida · Pendiente de confirmación', sub: 'Su reserva se confirmará en cuanto el restaurante la haya validado.', recap: 'Resumen', name: 'Nombre', email: 'Correo', phone: 'Teléfono', date: 'Fecha', time: 'Hora', covers: 'Comensales', notes: 'Notas', peopleSingular: 'persona', peoplePlural: 'personas' },
  it: { dateLocale: 'it-IT', subject: 'Conferma della tua richiesta di prenotazione', heading: 'Richiesta ricevuta · In attesa di conferma', sub: "La tua prenotazione sarà confermata non appena il ristorante l'avrà convalidata.", recap: 'Riepilogo', name: 'Nome', email: 'Email', phone: 'Telefono', date: 'Data', time: 'Ora', covers: 'Coperti', notes: 'Note', peopleSingular: 'persona', peoplePlural: 'persone' },
} as const

function fmtDate(iso: string, loc = 'fr-FR'): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function detailsTable(rows: [string, string][]): string {
  const last = rows.length - 1
  return `<table style="width:100%;border-collapse:collapse;">${rows
    .map(([label, value], i) => `<tr>
      <td style="padding:9px 0;${i < last ? 'border-bottom:1px solid #F0EADD;' : ''}color:#9A9587;font-size:13px;width:38%;font-family:'Hanken Grotesk',Arial,sans-serif;">${label}</td>
      <td style="padding:9px 0;${i < last ? 'border-bottom:1px solid #F0EADD;' : ''}color:#16201B;font-size:14px;font-weight:500;font-family:'Hanken Grotesk',Arial,sans-serif;">${value}</td>
    </tr>`)
    .join('')}</table>`
}

const footerHtml = `<p style="margin:0;text-align:center;font-size:12px;color:#9A9587;font-family:'Hanken Grotesk',Arial,sans-serif;">Propulsé par <a href="https://resa-service.com" style="color:#9A9587;text-decoration:none;">RESA</a> · resa-service.com</p>`

export async function POST(req: NextRequest) {
  const { fullName, email, phone, numberOfGuests, eventDate, eventDateISO, eventTime, specialRequests, locale } = await req.json()

  if (!eventDateISO || !eventTime || !numberOfGuests || !fullName) {
    return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
  }

  const lang: keyof typeof EMAIL_T = ['fr', 'en', 'es', 'it'].includes(locale) ? locale : 'fr'
  const et = EMAIL_T[lang]

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('name, email, phone, address')
    .eq('id', RESTAURANT_ID)
    .single()
  const restaurantName = restaurant?.name ?? 'Le restaurant'

  // Service split: time_slot before 17:00 => lunch ("midi"), else dinner ("soir").
  const serviceFromTime = (t: string): 'midi' | 'soir' => {
    const [h, m] = (t ?? '').split(':').map(Number)
    return h * 60 + (m || 0) < 17 * 60 ? 'midi' : 'soir'
  }
  const incomingService = serviceFromTime(eventTime)

  // Block duplicate: same email + same day + same service (midi/soir).
  let dupQuery = supabase
    .from('reservations')
    .select('name, email, date, time_slot, covers')
    .eq('restaurant_id', RESTAURANT_ID)
    .eq('date', eventDateISO)
    .ilike('email', email)
    .not('status', 'in', '(refused,cancelled)')
    .limit(1)
  dupQuery = incomingService === 'midi' ? dupQuery.lt('time_slot', '17:00') : dupQuery.gte('time_slot', '17:00')
  const { data: match, error: dupError } = await dupQuery.maybeSingle()

  if (dupError) {
    console.error('Duplicate check error:', JSON.stringify(dupError))
  } else if (match) {
    return NextResponse.json(
      { duplicate: true, existing: { name: match.name, email: match.email, date: match.date, time_slot: match.time_slot, covers: match.covers, service: incomingService } },
      { status: 409 },
    )
  }

  // Reject slots the restaurant punctually disabled for this date (closes the
  // race between the page loading the slots and the form being submitted).
  const { data: override } = await supabase
    .from('reservation_slot_overrides')
    .select('disabled_slots')
    .eq('restaurant_id', RESTAURANT_ID)
    .eq('date', eventDateISO)
    .maybeSingle()
  if (Array.isArray(override?.disabled_slots) && override.disabled_slots.includes(eventTime)) {
    return NextResponse.json({ slotUnavailable: true }, { status: 409 })
  }

  const guestsCount = parseInt(numberOfGuests, 10)
  const { error: dbError } = await supabase.from('reservations').insert({
    restaurant_id: RESTAURANT_ID,
    date: eventDateISO,
    time_slot: eventTime,
    covers: guestsCount,
    name: fullName,
    email,
    phone: phone ?? '',
    notes: specialRequests ?? '',
    status: 'pending',
    locale: lang,
  })
  if (dbError) {
    console.error('Supabase insert error:', JSON.stringify(dbError))
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  const initial = (restaurantName.charAt(0) || 'R').toUpperCase()
  const header = `<div style="text-align:center;margin-bottom:28px;">${MONOGRAM(initial)}${WORDMARK(restaurantName)}</div>`
  const manageUrl = `https://resa-service.com/restaurant/${RESTAURANT_ID}/reservations`

  // Restaurant-facing email (French).
  const detailRows: [string, string][] = [
    ['Nom', fullName],
    ['Email', email],
    ['Téléphone', phone || '—'],
    ['Date', fmtDate(eventDateISO)],
    ['Heure', eventTime],
    ['Couverts', `${numberOfGuests} personne${guestsCount > 1 ? 's' : ''}`],
    ...(specialRequests ? [['Notes', specialRequests] as [string, string]] : []),
  ]
  const restaurantHtml = `<!DOCTYPE html><html><head>${FONTS}</head><body style="margin:0;padding:0;background:#F5F1E9;">
    <div style="font-family:'Hanken Grotesk',Arial,sans-serif;max-width:560px;margin:0 auto;background:#F5F1E9;padding:32px 24px;">
      ${header}
      <div style="background:#F6EBD6;border:1px solid rgba(185,125,43,0.25);border-radius:12px;padding:16px 20px;text-align:center;margin-bottom:24px;">
        <p style="margin:0 0 3px;font-size:15px;font-weight:700;color:#B97D2B;">Nouvelle demande de réservation</p>
        <p style="margin:0;font-size:13px;color:#5E665E;">En attente de validation</p>
      </div>
      <div style="background:#FFFFFF;border:1px solid #E5DED0;border-radius:12px;padding:24px;margin-bottom:24px;">
        <p style="margin:0 0 14px;font-size:11px;font-weight:600;letter-spacing:0.1em;color:#9A9587;text-transform:uppercase;">Détails de la réservation</p>
        ${detailsTable(detailRows)}
      </div>
      <div style="text-align:center;margin-bottom:28px;">
        <a href="${manageUrl}" target="_blank" rel="noopener" style="display:inline-block;background:#C77E3A;color:#FFFFFF;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;font-size:14px;">Gérer dans RESA</a>
      </div>
      ${footerHtml}
    </div></body></html>`

  // Guest-facing email (translated into the guest's language).
  const clientRows: [string, string][] = [
    [et.name, fullName],
    [et.email, email],
    [et.phone, phone || '—'],
    [et.date, fmtDate(eventDateISO, et.dateLocale)],
    [et.time, eventTime],
    [et.covers, `${numberOfGuests} ${guestsCount > 1 ? et.peoplePlural : et.peopleSingular}`],
    ...(specialRequests ? [[et.notes, specialRequests] as [string, string]] : []),
  ]
  const restaurantBlock = `<div style="background:#FFFFFF;border:1px solid #E5DED0;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#16201B;">${restaurantName}</p>
      ${restaurant?.address ? `<p style="margin:0 0 3px;font-size:13px;color:#5E665E;">${restaurant.address.replace(/\n/g, ', ')}</p>` : ''}
      ${restaurant?.phone ? `<p style="margin:0;font-size:13px;color:#5E665E;">${restaurant.phone}</p>` : ''}
    </div>`
  const clientHtml = `<!DOCTYPE html><html><head>${FONTS}</head><body style="margin:0;padding:0;background:#F5F1E9;">
    <div style="font-family:'Hanken Grotesk',Arial,sans-serif;max-width:560px;margin:0 auto;background:#F5F1E9;padding:32px 24px;">
      ${header}
      <div style="background:#F6EBD6;border:1px solid rgba(185,125,43,0.25);border-radius:12px;padding:20px 24px;text-align:center;margin-bottom:24px;">
        <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#B97D2B;">${et.heading}</p>
        <p style="margin:0;font-size:13px;color:#5E665E;">${et.sub}</p>
      </div>
      <div style="background:#FFFFFF;border:1px solid #E5DED0;border-radius:12px;padding:24px;margin-bottom:24px;">
        <p style="margin:0 0 14px;font-size:11px;font-weight:600;letter-spacing:0.1em;color:#9A9587;text-transform:uppercase;">${et.recap}</p>
        ${detailsTable(clientRows)}
      </div>
      ${restaurantBlock}
      ${footerHtml}
    </div></body></html>`

  const restaurantText = ['Nouvelle demande de réservation — en attente de validation', '', `Nom : ${fullName}`, `Email : ${email}`, `Téléphone : ${phone || '—'}`, `Date : ${fmtDate(eventDateISO)}`, `Heure : ${eventTime}`, `Couverts : ${numberOfGuests}`, ...(specialRequests ? [`Notes : ${specialRequests}`] : []), '', `Gérer la réservation : ${manageUrl}`, '', 'Propulsé par RESA · resa-service.com'].join('\n')
  const clientText = [et.heading, et.sub, '', et.recap, `${et.name} : ${fullName}`, `${et.email} : ${email}`, `${et.phone} : ${phone || '—'}`, `${et.date} : ${fmtDate(eventDateISO, et.dateLocale)}`, `${et.time} : ${eventTime}`, `${et.covers} : ${numberOfGuests}`, ...(specialRequests ? [`${et.notes} : ${specialRequests}`] : []), '', restaurantName, '', 'Propulsé par RESA · resa-service.com'].join('\n')

  // Sent in the background: the reservation is already saved, so respond
  // immediately instead of blocking on two Resend round trips.
  waitUntil(
    Promise.all([
      restaurant?.email
        ? resend.emails.send({ from: FROM_EMAIL, to: restaurant.email, replyTo: email, subject: `Nouvelle réservation — ${fullName} — ${eventDate} à ${eventTime}`, html: restaurantHtml, text: restaurantText })
        : Promise.resolve({ error: null }),
      resend.emails.send({ from: FROM_EMAIL, to: email, subject: `${et.subject} — ${restaurantName}`, html: clientHtml, text: clientText }),
    ])
      .then(([r, c]) => {
        if ((r as { error?: unknown })?.error) console.error('Resend error (restaurant):', JSON.stringify((r as { error: unknown }).error))
        if ((c as { error?: unknown })?.error) console.error('Resend error (client):', JSON.stringify((c as { error: unknown }).error))
      })
      .catch((err) => console.error('Resend send failed:', err)),
  )

  return NextResponse.json({ success: true })
}
