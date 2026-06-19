'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ReservationSchedule, OpeningHourDay } from '@/lib/restaurant'

type Props = {
  restaurantId: string
  schedule: ReservationSchedule | null
  closedDays: string[]
  openingHours: OpeningHourDay[] | null
}

const inputStyle: React.CSSProperties = {
  border: '1.5px solid var(--border)',
  borderRadius: 10,
  padding: '11px 14px',
  fontSize: '0.9rem',
  color: 'var(--ink)',
  backgroundColor: 'var(--surface)',
  outline: 'none',
  width: '100%',
  fontFamily: 'var(--font-secondary)',
  transition: 'border-color 0.15s',
}

function generateSlots(schedule: ReservationSchedule | null, dayOfWeek: number, openingHours: OpeningHourDay[] | null): string[] {
  if (!schedule) return []
  const slots: string[] = []
  const interval = schedule.interval_minutes ?? 30
  const idx = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const dayHours = openingHours?.[idx]

  function addSlots(active: boolean, debut: string | null, fin: string | null, dayActive?: boolean) {
    if (!active || dayActive === false) return
    if (!debut || !fin) return
    const [sh, sm] = debut.split(':').map(Number)
    const [eh, em] = fin.split(':').map(Number)
    let cur = sh * 60 + sm
    const end = eh * 60 + em
    while (cur <= end - interval) {
      const hh = String(Math.floor(cur / 60)).padStart(2, '0')
      const mm = String(cur % 60).padStart(2, '0')
      slots.push(`${hh}:${mm}`)
      cur += interval
    }
  }

  const lunchClosed = dayHours?.closedLunch ?? false
  const dinerClosed = dayHours?.closedDiner ?? false

  addSlots(schedule.midi_active ?? false, schedule.midi_debut, schedule.midi_fin, !lunchClosed)
  addSlots(schedule.soir_active ?? false, schedule.soir_debut, schedule.soir_fin, !dinerClosed)

  return slots
}

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function ReservationForm({ restaurantId, schedule, closedDays, openingHours }: Props) {
  const supabase = createClient()

  const today = toISO(new Date())

  const [date, setDate] = useState('')
  const [timeSlot, setTimeSlot] = useState('')
  const [covers, setCovers] = useState('2')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const isDateDisabled = (dateStr: string): boolean => {
    if (dateStr < today) return true
    if (closedDays.includes(dateStr)) return true
    const d = new Date(dateStr + 'T00:00:00')
    const dayIdx = d.getDay() === 0 ? 6 : d.getDay() - 1
    const dayHours = openingHours?.[dayIdx]
    if (dayHours?.closedDay) return true
    return false
  }

  const slots = useMemo(() => {
    if (!date) return []
    if (isDateDisabled(date)) return []
    const d = new Date(date + 'T00:00:00')
    return generateSlots(schedule, d.getDay(), openingHours)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, schedule, openingHours, closedDays])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setStatus('idle')
    setErrorMsg('')

    if (isDateDisabled(date)) {
      setErrorMsg('Ce jour n\'est pas disponible pour les réservations.')
      setLoading(false)
      setStatus('error')
      return
    }

    const { error } = await supabase.from('reservations').insert({
      restaurant_id: restaurantId,
      date,
      time_slot: timeSlot,
      covers: Number(covers),
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      notes: notes.trim() || null,
      status: 'pending',
    })

    if (error) {
      setErrorMsg(error.message)
      setStatus('error')
    } else {
      setStatus('success')
      setDate(''); setTimeSlot(''); setCovers('2'); setName('')
      setEmail(''); setPhone(''); setNotes('')
    }

    setLoading(false)
  }

  if (status === 'success') {
    return (
      <div style={{
        background: 'var(--status-ok-bg)',
        border: '1.5px solid rgba(30,122,82,0.25)',
        borderRadius: 16, padding: '28px 24px', textAlign: 'center',
      }}>
        <p style={{ fontSize: '1.8rem', marginBottom: 12 }}>✓</p>
        <h2 className="font-primary" style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--status-ok-text)', marginBottom: 8 }}>
          Demande envoyée !
        </h2>
        <p className="font-secondary" style={{ fontSize: '0.9rem', color: 'var(--status-ok-text)' }}>
          Votre demande de réservation a bien été reçue. Nous vous confirmerons par email ou téléphone.
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="font-secondary"
          style={{
            marginTop: 20, padding: '10px 24px', borderRadius: 10,
            background: 'var(--pine)', color: 'var(--paper)',
            border: 'none', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
          }}
        >
          Faire une nouvelle réservation
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Date + Heure */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 14, padding: '20px 22px',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <p className="font-secondary" style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--muted)' }}>
          DATE ET HEURE
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label className="font-secondary" style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.08em' }}>
              DATE *
            </label>
            <input
              type="date"
              value={date}
              min={today}
              required
              onChange={e => { setDate(e.target.value); setTimeSlot('') }}
              className="font-secondary"
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = 'var(--pine)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label className="font-secondary" style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.08em' }}>
              HEURE *
            </label>
            {slots.length > 0 ? (
              <select
                value={timeSlot}
                required
                onChange={e => setTimeSlot(e.target.value)}
                className="font-secondary"
                style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}
                onFocus={e => { e.target.style.borderColor = 'var(--pine)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
              >
                <option value="">Choisir un créneau</option>
                {slots.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            ) : (
              <select
                disabled
                className="font-secondary"
                style={{ ...inputStyle, backgroundColor: 'var(--surface-alt)', color: 'var(--muted)', cursor: 'not-allowed' }}
              >
                <option>{date ? (isDateDisabled(date) ? 'Non disponible' : 'Aucun créneau') : 'Choisir une date'}</option>
              </select>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label className="font-secondary" style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.08em' }}>
            NOMBRE DE COUVERTS *
          </label>
          <input
            type="number"
            value={covers}
            min={1}
            max={50}
            required
            onChange={e => setCovers(e.target.value)}
            className="font-secondary"
            style={{ ...inputStyle, maxWidth: 140 }}
            onFocus={e => { e.target.style.borderColor = 'var(--pine)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
          />
        </div>
      </div>

      {/* Coordonnées */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 14, padding: '20px 22px',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <p className="font-secondary" style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--muted)' }}>
          VOS COORDONNÉES
        </p>

        <Field label="NOM ET PRÉNOM *">
          <input
            type="text"
            value={name}
            required
            placeholder="Marie Dupont"
            onChange={e => setName(e.target.value)}
            className="font-secondary"
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = 'var(--pine)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
          />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="EMAIL">
            <input
              type="email"
              value={email}
              placeholder="marie@email.com"
              onChange={e => setEmail(e.target.value)}
              className="font-secondary"
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = 'var(--pine)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
            />
          </Field>
          <Field label="TÉLÉPHONE">
            <input
              type="tel"
              value={phone}
              placeholder="06 00 00 00 00"
              onChange={e => setPhone(e.target.value)}
              className="font-secondary"
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = 'var(--pine)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
            />
          </Field>
        </div>

        <Field label="NOTES (allergie, chaise bébé…)">
          <textarea
            value={notes}
            placeholder="Précisez ici vos besoins particuliers"
            rows={3}
            onChange={e => setNotes(e.target.value)}
            className="font-secondary"
            style={{ ...inputStyle, resize: 'none' }}
            onFocus={e => { e.target.style.borderColor = 'var(--pine)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
          />
        </Field>
      </div>

      {status === 'error' && (
        <p className="font-secondary" style={{
          fontSize: '0.875rem', color: 'var(--status-err-text)',
          background: 'var(--status-err-bg)', borderRadius: 10,
          padding: '10px 14px',
        }}>
          {errorMsg || 'Une erreur est survenue. Veuillez réessayer.'}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="font-secondary"
        style={{
          background: 'var(--pine)', color: 'var(--paper)',
          padding: '14px', borderRadius: 12,
          fontSize: '0.95rem', fontWeight: 700,
          border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1, letterSpacing: '-0.01em',
          transition: 'opacity 0.15s',
        }}
      >
        {loading ? 'Envoi en cours…' : 'Envoyer ma demande'}
      </button>

      <p className="font-secondary" style={{ fontSize: '0.78rem', color: 'var(--muted)', textAlign: 'center' }}>
        Votre réservation sera confirmée par notre équipe
      </p>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label className="font-secondary" style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.08em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}
