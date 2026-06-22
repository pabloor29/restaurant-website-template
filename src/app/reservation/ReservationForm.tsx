'use client'

import { useState, useMemo } from 'react'
import DatePicker, { registerLocale } from 'react-datepicker'
import { fr } from 'date-fns/locale'
import type { ReservationSchedule, OpeningHourDay, HolidayPeriod } from '@/lib/restaurant'

registerLocale('fr', fr)

type Props = {
  restaurantId: string
  schedule: ReservationSchedule | null
  closedDays: string[]
  openingHours: OpeningHourDay[] | null
  holidayPeriods: HolidayPeriod[]
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

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

type SlotGroups = { midi: string[]; soir: string[] }

function generateSlots(
  schedule: ReservationSchedule | null,
  dayOfWeek: number,
  openingHours: OpeningHourDay[] | null,
): SlotGroups {
  const empty: SlotGroups = { midi: [], soir: [] }
  if (!schedule) return empty
  const interval = schedule.interval_minutes ?? 30
  const idx = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const dayHours = openingHours?.[idx]

  function buildSlots(active: boolean, debut: string | null, fin: string | null, dayActive?: boolean): string[] {
    if (!active || dayActive === false) return []
    if (!debut || !fin) return []
    const [sh, sm] = debut.split(':').map(Number)
    const [eh, em] = fin.split(':').map(Number)
    let cur = sh * 60 + sm
    const end = eh * 60 + em
    const out: string[] = []
    while (cur <= end) {
      const hh = String(Math.floor(cur / 60)).padStart(2, '0')
      const mm = String(cur % 60).padStart(2, '0')
      out.push(`${hh}:${mm}`)
      cur += interval
    }
    return out
  }

  return {
    midi: buildSlots(schedule.midi_active ?? false, schedule.midi_debut, schedule.midi_fin, !dayHours?.closedLunch),
    soir: buildSlots(schedule.soir_active ?? false, schedule.soir_debut, schedule.soir_fin, !dayHours?.closedDiner),
  }
}

function SlotGroup({
  title,
  icon,
  accent,
  slots,
  selected,
  onSelect,
}: {
  title: string
  icon: string
  accent: string
  slots: string[]
  selected: string
  onSelect: (s: string) => void
}) {
  return (
    <div
      style={{
        border: `1.5px solid ${accent}33`,
        borderRadius: 12,
        padding: '12px 14px',
        backgroundColor: `${accent}0d`,
      }}
    >
      <div
        className="font-secondary"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: '0.78rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: accent,
          marginBottom: 10,
          textTransform: 'uppercase',
        }}
      >
        <span aria-hidden style={{ fontSize: '1rem' }}>{icon}</span>
        {title}
        <span style={{ color: 'var(--muted)', fontWeight: 500, fontSize: '0.7rem', letterSpacing: '0.04em', textTransform: 'none' }}>
          {slots.length} créneau{slots.length > 1 ? 'x' : ''}
        </span>
      </div>
      <div className="res-slot-grid">
        {slots.map(s => {
          const active = selected === s
          return (
            <button
              key={s}
              type="button"
              onClick={() => onSelect(s)}
              className="font-secondary"
              style={{
                padding: '8px 4px',
                borderRadius: 8,
                border: `1.5px solid ${active ? accent : 'var(--border)'}`,
                backgroundColor: active ? accent : 'var(--surface)',
                color: active ? '#fff' : 'var(--ink)',
                fontSize: '0.85rem',
                fontWeight: active ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {s}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function ReservationForm({ restaurantId, schedule, closedDays, openingHours, holidayPeriods }: Props) {
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])
  const todayISO = toISO(today)

  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [timeSlot, setTimeSlot] = useState('')
  const [covers, setCovers] = useState('2')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const isDateClosed = (date: Date): boolean => {
    const iso = toISO(date)
    if (closedDays.includes(iso)) return true
    const idx = date.getDay() === 0 ? 6 : date.getDay() - 1
    if (openingHours?.[idx]?.closedDay) return true
    for (const period of holidayPeriods) {
      if (iso >= period.debut && iso <= period.fin) return true
    }
    return false
  }

  const getDayClassName = (date: Date): string => {
    const iso = toISO(date)
    if (iso < todayISO) return 'res-day-past'
    if (isDateClosed(date)) return 'res-day-closed'
    return ''
  }

  const slots = useMemo<SlotGroups>(() => {
    if (!selectedDate || isDateClosed(selectedDate)) return { midi: [], soir: [] }
    return generateSlots(schedule, selectedDate.getDay(), openingHours)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, schedule, openingHours, closedDays])
  const hasSlots = slots.midi.length > 0 || slots.soir.length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setStatus('idle')
    setErrorMsg('')

    if (!selectedDate || isDateClosed(selectedDate)) {
      setErrorMsg('Ce jour n\'est pas disponible pour les réservations.')
      setLoading(false)
      setStatus('error')
      return
    }

    if (!timeSlot) {
      setErrorMsg('Veuillez sélectionner un créneau horaire.')
      setLoading(false)
      setStatus('error')
      return
    }

    try {
      const res = await fetch('/api/reservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          covers: Number(covers),
          date: toISO(selectedDate),
          time_slot: timeSlot,
          notes: notes.trim() || null,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setErrorMsg(body.error ?? 'Une erreur est survenue.')
        setStatus('error')
      } else {
        setStatus('success')
        setSelectedDate(null); setTimeSlot(''); setCovers('2'); setName('')
        setEmail(''); setPhone(''); setNotes('')
      }
    } catch {
      setErrorMsg('Erreur réseau. Veuillez réessayer.')
      setStatus('error')
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

        <div className="res-date-time-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label className="font-secondary" style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.08em' }}>
              DATE *
            </label>
            <DatePicker
              selected={selectedDate}
              onChange={(date: Date | null) => { setSelectedDate(date); setTimeSlot('') }}
              filterDate={(date) => !isDateClosed(date)}
              dayClassName={getDayClassName}
              dateFormat="dd/MM/yyyy"
              locale="fr"
              minDate={today}
              placeholderText="Sélectionner une date"
              className="res-datepicker-input font-secondary"
              wrapperClassName="res-datepicker-wrapper"
              autoComplete="off"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label className="font-secondary" style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.08em' }}>
              HEURE *
            </label>
            {hasSlots ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {slots.midi.length > 0 && (
                  <SlotGroup
                    title="Midi"
                    icon="☀"
                    accent="#f59e0b"
                    slots={slots.midi}
                    selected={timeSlot}
                    onSelect={setTimeSlot}
                  />
                )}
                {slots.soir.length > 0 && (
                  <SlotGroup
                    title="Soir"
                    icon="☾"
                    accent="#4f46e5"
                    slots={slots.soir}
                    selected={timeSlot}
                    onSelect={setTimeSlot}
                  />
                )}
              </div>
            ) : (
              <div
                className="font-secondary"
                style={{ ...inputStyle, backgroundColor: 'var(--surface-alt)', color: 'var(--muted)', cursor: 'not-allowed', padding: '14px' }}
              >
                {selectedDate
                  ? (isDateClosed(selectedDate) ? 'Non disponible' : 'Aucun créneau')
                  : 'Choisir une date'}
              </div>
            )}
          </div>
        </div>

        {/* Légende */}
        <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
          <span className="font-secondary" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: 'var(--muted)' }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, backgroundColor: '#fee2e2', border: '1px solid #dc2626' }} />
            Fermé
          </span>
          <span className="font-secondary" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: 'var(--muted)' }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, backgroundColor: 'var(--pine)' }} />
            Sélectionné
          </span>
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

        <div className="res-date-time-grid">
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
