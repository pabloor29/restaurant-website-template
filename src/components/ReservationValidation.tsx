'use client'

import { useEffect, useState } from 'react'

interface ReservationInfo {
  date?: string
  heure?: string
  invites?: string
  nom?: string
  commentaire?: string
  email?: string
  phone?: string
}

const CONFIRM_COMMENT =
  "Merci beaucoup pour votre réservation ! Nous sommes heureux de vous informer que votre demande a été confirmée. Nous avons hâte de vous accueillir pour passer un agréable moment ensemble. À très bientôt !"
const REFUSE_COMMENT =
  "Nous vous remercions pour votre réservation. Malheureusement, nous ne pouvons pas l'accepter pour le moment. Nous sommes désolés pour ce contretemps et espérons avoir l'occasion de vous accueillir une prochaine fois. N'hésitez pas à reprogrammer votre réservation à une autre date. À bientôt !"

// Restaurant-facing page opened from the notification email: lists the request
// (passed as query params) and lets the owner confirm or refuse it, which fires
// the guest autoreply email.
export function ReservationValidation({ phone, name, address }: { phone: string; name: string; address: string }) {
  const confirmComment2 = `Nous vous attendons${address ? ` au ${address.split('\n').join(', ')}` : ''}.${phone ? ` Pour toutes demandes supplémentaires, veuillez nous contacter au ${phone}.` : ''}`
  const [info, setInfo] = useState<ReservationInfo | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [sent, setSent] = useState<'confirmed' | 'refused' | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setInfo({
      date: params.get('date') || '',
      heure: params.get('heure') || '',
      invites: params.get('invites') || '',
      nom: params.get('nom') || '',
      commentaire: params.get('commentaire') || '',
      email: params.get('email') || '',
      phone: params.get('phone') || '',
    })
  }, [])

  const send = async (type: 'CONFIRMÉE' | 'REFUSÉE') => {
    if (!info?.email) return
    setIsSending(true)
    const isConfirmed = type === 'CONFIRMÉE'
    try {
      const res = await fetch('/api/autoreply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: info.email,
          fullName: info.nom,
          eventDate: info.date,
          eventTime: info.heure,
          numberOfGuests: info.invites,
          reservationType: type,
          reservationComment: isConfirmed ? CONFIRM_COMMENT : REFUSE_COMMENT,
          reservationComment2: isConfirmed ? confirmComment2 : '',
        }),
      })
      if (!res.ok) throw new Error('server error')
      setSent(isConfirmed ? 'confirmed' : 'refused')
    } catch (err) {
      console.error('autoreply error:', err)
      alert("Échec de l'envoi. Veuillez réessayer.")
    } finally {
      setIsSending(false)
    }
  }

  const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, maxWidth: 420, width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }
  const outer: React.CSSProperties = { minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }

  if (!info) return <p style={{ textAlign: 'center', marginTop: 40 }}>Chargement…</p>

  if (sent) {
    return (
      <div style={outer}>
        <div style={{ ...card, textAlign: 'center' }}>
          <p className="font-primary" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)' }}>
            {sent === 'confirmed' ? '✅ Réservation confirmée' : '❌ Réservation refusée'}
          </p>
          <p className="font-secondary" style={{ color: 'var(--slate)', marginTop: 8, fontSize: '0.9rem' }}>Le mail a bien été envoyé à {info.email}.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={outer}>
      <div style={card} className="font-secondary">
        <h1 className="font-primary" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--ink)', marginBottom: 14 }}>Demande de réservation — {name}</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.9rem', color: 'var(--slate)' }}>
          <p><strong>📅 Date :</strong> {info.date || 'Non précisé'} à {info.heure || 'Non précisé'}</p>
          <p><strong>👥 Invités :</strong> {info.invites || 'Non précisé'}</p>
          <p><strong>👤 Nom :</strong> {info.nom || 'Non précisé'}</p>
          <p><strong>💬 Commentaire :</strong> {info.commentaire || 'Aucun'}</p>
          <p><strong>✉️ Email :</strong> {info.email || 'Non précisé'}</p>
          {info.phone && <p><strong>📞 Téléphone :</strong> {info.phone}</p>}
        </div>
        <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button disabled={isSending} onClick={() => send('REFUSÉE')} style={{ background: 'var(--status-err-text)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 600, cursor: isSending ? 'not-allowed' : 'pointer', opacity: isSending ? 0.5 : 1 }}>REFUSER</button>
          <button disabled={isSending} onClick={() => send('CONFIRMÉE')} style={{ background: 'var(--status-ok-text)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 600, cursor: isSending ? 'not-allowed' : 'pointer', opacity: isSending ? 0.5 : 1 }}>VALIDER</button>
        </div>
        {isSending && <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 12, textAlign: 'center' }}>Envoi en cours…</p>}
      </div>
    </div>
  )
}
