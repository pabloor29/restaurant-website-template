'use client'

import { useState, useRef, useEffect } from 'react'
import DatePicker, { registerLocale, setDefaultLocale } from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { fr, enGB, es, it } from 'date-fns/locale'
import { useLocale, useTranslations } from 'next-intl'
import { SHOW_PHONE, telHref } from '@/lib/phone'
import { INTL_LOCALE } from '@/lib/i18n-meta'

registerLocale('fr', fr)
registerLocale('en', enGB)
registerLocale('es', es)
registerLocale('it', it)
setDefaultLocale('fr')

type DayServices = { lunchOpen: boolean; dinnerOpen: boolean }

type Props = {
  closedWeekdays: number[]
  closedDates: string[]
  holidayPeriods: { debut: string; fin: string }[]
  lunchSlots: string[]
  dinnerSlots: string[]
  dayServices: DayServices[]
  disabledSlotsByDate: Record<string, string[]>
  phone: string
  email: string
  maxGuests: number
  sameDayCutoffHour: number
}

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const d = date.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${d}`
}

const inputStyle: React.CSSProperties = {
  border: '1.5px solid var(--border)', borderRadius: 10, padding: '11px 14px',
  fontSize: '0.9rem', color: 'var(--ink)', backgroundColor: 'var(--surface)',
  outline: 'none', width: '100%', fontFamily: 'var(--font-secondary)', transition: 'border-color 0.15s',
}
const fieldLabel: React.CSSProperties = { fontSize: '0.72rem', fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.08em', marginBottom: 6, display: 'block' }

export function ReservationForm({
  closedWeekdays, closedDates, holidayPeriods, lunchSlots, dinnerSlots,
  dayServices, disabledSlotsByDate, phone, email, maxGuests, sameDayCutoffHour,
}: Props) {
  const t = useTranslations('reservation')
  const rawLocale = useLocale()
  const locale = (['fr', 'en', 'es', 'it'].includes(rawLocale) ? rawLocale : 'fr') as 'fr' | 'en' | 'es' | 'it'
  const intlLocale = INTL_LOCALE[locale] ?? 'fr-FR'

  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', numberOfGuests: '', specialRequests: '' })
  const [succeeded, setSucceeded] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedValue, setSelectedValue] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  // Times still bookable for the chosen date + party size (null = not yet fetched → show all).
  const [availSet, setAvailSet] = useState<Set<string> | null>(null)
  const [duplicateInfo, setDuplicateInfo] = useState<{
    name: string; email: string; date: string; time_slot: string; covers: number; service: 'midi' | 'soir'
  } | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const isTodayBlocked = (): boolean => new Date().getHours() >= sameDayCutoffHour

  const isDateClosed = (date: Date): boolean => {
    const isToday = toLocalDateStr(date) === toLocalDateStr(new Date())
    if (isToday && isTodayBlocked()) return true
    if (closedWeekdays.includes(date.getDay())) return true
    const dateStr = toLocalDateStr(date)
    if (closedDates.includes(dateStr)) return true
    for (const period of holidayPeriods) {
      if (dateStr >= period.debut && dateStr <= period.fin) return true
    }
    return false
  }

  // On the current day, a slot whose start time already passed can't be booked.
  const isPastSlot = (slot: string): boolean => {
    if (!selectedDate) return false
    if (toLocalDateStr(selectedDate) !== toLocalDateStr(new Date())) return false
    const [h, m] = slot.split(':').map(Number)
    const now = new Date()
    return h * 60 + (m || 0) <= now.getHours() * 60 + now.getMinutes()
  }

  // A slot the restaurant punctually disabled for the selected date.
  const isOverriddenSlot = (slot: string): boolean => {
    if (!selectedDate) return false
    return disabledSlotsByDate[toLocalDateStr(selectedDate)]?.includes(slot) ?? false
  }

  // A slot where the restaurant is full for this party size (capacity + turn).
  const isFull = (slot: string): boolean => availSet !== null && !availSet.has(slot)

  // Ask the API which times are still free for this date + party size.
  useEffect(() => {
    if (!selectedDate || isDateClosed(selectedDate)) { setAvailSet(null); return }
    const covers = Math.max(1, Number(formData.numberOfGuests) || 2)
    const ac = new AbortController()
    fetch(`/api/availability?date=${toLocalDateStr(selectedDate)}&covers=${covers}`, { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setAvailSet(d ? new Set<string>(d.slots) : null))
      .catch(() => { /* network/abort → fall back to schedule-only slots */ })
    return () => ac.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, formData.numberOfGuests])

  const successRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (succeeded) successRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [succeeded])

  const currentServices: DayServices = selectedDate
    ? dayServices[selectedDate.getDay()] ?? { lunchOpen: true, dinnerOpen: true }
    : { lunchOpen: true, dinnerOpen: true }
  const lunchEnabled = !!selectedDate && currentServices.lunchOpen
  const dinnerEnabled = !!selectedDate && currentServices.dinnerOpen

  // Clear a chosen slot that becomes invalid after date/covers change.
  useEffect(() => {
    if (!selectedValue) return
    const inLunch = lunchSlots.includes(selectedValue)
    const inDinner = dinnerSlots.includes(selectedValue)
    if ((inLunch && !lunchEnabled) || (inDinner && !dinnerEnabled) || isPastSlot(selectedValue) || isOverriddenSlot(selectedValue) || isFull(selectedValue)) {
      setSelectedValue('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, lunchEnabled, dinnerEnabled, selectedValue, availSet])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMessage('')
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.numberOfGuests.trim() || !selectedDate || !selectedValue.trim()) {
      setErrorMessage(t('fillRequiredFields'))
      return
    }
    setIsSubmitting(true)

    const eventDateFormatted = selectedDate.toLocaleDateString(intlLocale, { day: '2-digit', month: '2-digit', year: 'numeric' })
    const eventDateISO = toLocalDateStr(selectedDate)

    try {
      const res = await fetch('/api/reservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          numberOfGuests: formData.numberOfGuests,
          eventDate: eventDateFormatted,
          eventDateISO,
          eventTime: selectedValue,
          specialRequests: formData.specialRequests,
          locale,
        }),
      })

      if (res.status === 409) {
        const data = await res.json()
        if (data?.existing) { setDuplicateInfo(data.existing); return }
        if (data?.slotUnavailable) { setSelectedValue(''); setErrorMessage(t('slotUnavailable')); return }
      }
      if (!res.ok) throw new Error('server error')
      setSucceeded(true)
    } catch (err) {
      console.error('Reservation submit failed:', err)
      setErrorMessage(t('fillRequiredFields'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const getDayClassName = (date: Date): string => {
    const iso = toLocalDateStr(date)
    if (iso < toLocalDateStr(new Date(new Date().setHours(0, 0, 0, 0)))) return 'res-day-past'
    if (isDateClosed(date)) return 'res-day-closed'
    return ''
  }

  const renderSlotGroup = (slots: string[], enabled: boolean, open: boolean, icon: string, label: string, accent: string, keyPrefix: string) => {
    if (slots.length === 0) return null
    return (
      <div style={{ opacity: enabled ? 1 : 0.5 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid var(--border-soft)' }}>
          <span className="font-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', color: accent, textTransform: 'uppercase' }}>
            <span aria-hidden>{icon}</span>{label}
          </span>
          {selectedDate && !open && (
            <span className="font-secondary" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--status-err-text)', fontWeight: 600 }}>{t('closedLabel')}</span>
          )}
        </div>
        <div className="res-slot-grid">
          {slots.map((option) => {
            const disabled = !enabled || isPastSlot(option) || isOverriddenSlot(option) || isFull(option)
            const active = selectedValue === option
            return (
              <button
                type="button"
                key={`${keyPrefix}-${option}`}
                onClick={() => !disabled && (setSelectedValue(option), setErrorMessage(''))}
                disabled={disabled}
                aria-disabled={disabled}
                className="font-secondary"
                style={{
                  padding: '8px 4px', borderRadius: 8, fontSize: '0.85rem', cursor: disabled ? 'not-allowed' : 'pointer',
                  border: `1.5px solid ${active ? accent : disabled ? 'var(--border-soft)' : 'var(--border)'}`,
                  background: active ? accent : disabled ? 'var(--surface-alt)' : 'var(--surface)',
                  color: active ? '#fff' : disabled ? 'var(--muted)' : 'var(--ink)',
                  textDecoration: disabled ? 'line-through' : 'none',
                  fontWeight: active ? 700 : 500, transition: 'all 0.15s',
                }}
              >
                {option}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (succeeded) {
    return (
      <div ref={successRef} style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center' }}>
        <div style={{ background: 'var(--status-ok-bg)', border: '1.5px solid rgba(30,122,82,0.25)', borderRadius: 16, padding: '28px 24px' }}>
          <p style={{ fontSize: '1.8rem', marginBottom: 10 }}>✓</p>
          <p className="font-accent" style={{ fontSize: '1.05rem', color: 'var(--status-ok-text)', fontStyle: 'italic', lineHeight: 1.6 }}>{t('afterSentMessage')}</p>
        </div>
        <div role="alert" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'var(--status-warn-bg)', border: '1.5px solid rgba(185,125,43,0.3)', borderRadius: 12, padding: '14px 16px', textAlign: 'left' }}>
          <span style={{ flexShrink: 0 }}>⚠️</span>
          <p className="font-secondary" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--status-warn-text)' }}>{t('spamWarning')}</p>
        </div>
        <button onClick={() => { setSucceeded(false); setSelectedDate(null); setSelectedValue(''); setFormData({ fullName: '', email: '', phone: '', numberOfGuests: '', specialRequests: '' }) }} className="font-secondary" style={{ alignSelf: 'center', marginTop: 4, padding: '10px 24px', borderRadius: 10, background: 'var(--pine)', color: 'var(--paper)', border: 'none', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
          {t('newReservation')}
        </button>
      </div>
    )
  }

  return (
    <>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Coordinates */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label htmlFor="fullName" className="font-secondary" style={fieldLabel}>{t('fullNameLabel')} *</label>
            <input id="fullName" name="fullName" type="text" required value={formData.fullName} onChange={handleChange} className="font-secondary" style={inputStyle} />
          </div>
          <div className="res-date-time-grid">
            <div>
              <label htmlFor="email" className="font-secondary" style={fieldLabel}>{t('emailLabel')} *</label>
              <input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} className="font-secondary" style={inputStyle} />
            </div>
            <div>
              <label htmlFor="phone" className="font-secondary" style={fieldLabel}>{t('phoneLabel')}</label>
              <input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} className="font-secondary" style={inputStyle} />
            </div>
          </div>
          <p className="font-secondary" style={{ fontSize: '0.82rem', color: 'var(--status-info-text)', background: 'var(--status-info-bg)', borderRadius: 8, padding: '10px 12px' }}>
            {t('alertMaxNbGuests', { max: maxGuests })}
            <a href={`mailto:${email}`} style={{ color: 'var(--pine)', fontWeight: 600 }}>{email}</a>
          </p>
        </div>

        {/* Date + party size + slots */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="res-date-time-grid">
            <div>
              <label htmlFor="numberOfGuests" className="font-secondary" style={fieldLabel}>{t('numberOfGuestsLabel')} *</label>
              <input id="numberOfGuests" name="numberOfGuests" type="number" min={1} max={maxGuests} required value={formData.numberOfGuests} onChange={handleChange} className="font-secondary" style={inputStyle} />
            </div>
            <div>
              <label className="font-secondary" style={fieldLabel}>{t('eventDateLabel')} *</label>
              <DatePicker
                selected={selectedDate}
                onChange={(date: Date | null) => { setSelectedDate(date); setSelectedValue('') }}
                filterDate={(date: Date) => !isDateClosed(date)}
                dayClassName={getDayClassName}
                dateFormat="dd/MM/yyyy"
                locale={locale}
                minDate={isTodayBlocked() ? (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d })() : new Date()}
                placeholderText={t('datePlaceholder')}
                className="res-datepicker-input font-secondary"
                wrapperClassName="res-datepicker-wrapper"
                autoComplete="off"
              />
            </div>
          </div>

          {isTodayBlocked() && (
            <div style={{ background: 'var(--status-warn-bg)', border: '1px solid rgba(185,125,43,0.3)', borderRadius: 8, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p className="font-secondary" style={{ fontSize: '0.82rem', color: 'var(--status-warn-text)', fontWeight: 500 }}>{t('todaySameDayMessage')}</p>
              {SHOW_PHONE && phone && (
                <a href={telHref(phone)} className="font-secondary" style={{ alignSelf: 'flex-start', background: 'var(--pine)', color: 'var(--paper)', fontSize: '0.8rem', fontWeight: 600, padding: '8px 14px', borderRadius: 8, textDecoration: 'none' }}>📞 {t('callButton')}</a>
              )}
            </div>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
              <label className="font-secondary" style={{ ...fieldLabel, marginBottom: 0 }}>{t('eventTimeLabel')} *</label>
              {selectedValue && (
                <span className="font-secondary" style={{ background: 'var(--pine)', color: 'var(--paper)', fontSize: '0.75rem', fontWeight: 600, padding: '3px 10px', borderRadius: 99 }}>{t('selectedLabel')} : {selectedValue}</span>
              )}
            </div>
            <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '14px', background: 'var(--surface-alt)' }}>
              {!selectedDate && (
                <p className="font-secondary" style={{ fontSize: '0.82rem', fontStyle: 'italic', color: 'var(--muted)', textAlign: 'center', paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid var(--border-soft)' }}>{t('pickDateFirst')}</p>
              )}
              {lunchSlots.length === 0 && dinnerSlots.length === 0 ? (
                <p className="font-secondary" style={{ fontSize: '0.82rem', fontStyle: 'italic', color: 'var(--muted)', textAlign: 'center', padding: '12px 0' }}>{t('noSlots')}</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                  {renderSlotGroup(lunchSlots, lunchEnabled, currentServices.lunchOpen, '☀', t('serviceMidi'), '#d97706', 'lunch')}
                  {renderSlotGroup(dinnerSlots, dinnerEnabled, currentServices.dinnerOpen, '☾', t('serviceSoir'), '#4f46e5', 'dinner')}
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="specialRequests" className="font-secondary" style={fieldLabel}>{t('specialRequestsLabel')}</label>
            <textarea id="specialRequests" name="specialRequests" rows={3} value={formData.specialRequests} onChange={handleChange} className="font-secondary" style={{ ...inputStyle, resize: 'none' }} />
          </div>
        </div>

        {errorMessage && (
          <p className="font-secondary" role="alert" style={{ fontSize: '0.875rem', color: 'var(--status-err-text)', background: 'var(--status-err-bg)', borderRadius: 10, padding: '10px 14px' }}>{errorMessage}</p>
        )}

        <button type="submit" disabled={isSubmitting} className="font-secondary" style={{ background: 'var(--pine)', color: 'var(--paper)', padding: '14px', borderRadius: 12, fontSize: '0.95rem', fontWeight: 700, border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.6 : 1 }}>
          {isSubmitting ? t('submitting') : t('submitButton')}
        </button>
      </form>

      {duplicateInfo && (
        <div role="dialog" aria-modal="true" onClick={() => setDuplicateInfo(null)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, background: 'var(--surface)', borderRadius: 16, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 className="font-primary" style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--ink)' }}>{t('duplicateTitle')}</h3>
            <p className="font-secondary" style={{ marginTop: 12, fontSize: '0.9rem', color: 'var(--slate)' }}>
              {t('duplicateIntro', { service: duplicateInfo.service === 'midi' ? t('serviceMidi') : t('serviceSoir') })}
            </p>
            <div className="font-secondary" style={{ marginTop: 16, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-alt)', padding: 14, fontSize: '0.85rem', color: 'var(--slate)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <p><strong>{t('fullNameLabel')} :</strong> {duplicateInfo.name}</p>
              <p><strong>{t('emailLabel')} :</strong> {duplicateInfo.email}</p>
              <p><strong>{t('eventDateLabel')} :</strong> {new Date(duplicateInfo.date + 'T00:00:00').toLocaleDateString(intlLocale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {duplicateInfo.time_slot}</p>
              <p><strong>{t('serviceLabel')} :</strong> {duplicateInfo.service === 'midi' ? t('serviceMidi') : t('serviceSoir')}</p>
              <p><strong>{t('numberOfGuestsLabel')} :</strong> {duplicateInfo.covers}</p>
            </div>
            <p className="font-secondary" style={{ marginTop: 14, fontSize: '0.875rem', color: 'var(--slate)' }}>{t('duplicateCheckMail')}</p>
            <p className="font-secondary" style={{ marginTop: 10, fontSize: '0.875rem', color: 'var(--slate)' }}>{t('duplicateNoMail')}</p>
            {SHOW_PHONE && phone && (
              <a href={telHref(phone)} className="font-secondary" style={{ marginTop: 12, display: 'inline-flex', gap: 8, background: 'var(--pine)', color: 'var(--paper)', padding: '9px 16px', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none' }}>📞 {t('duplicateCall')} — {phone}</a>
            )}
            <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setDuplicateInfo(null)} className="font-secondary" style={{ border: '1px solid var(--pine)', background: 'transparent', color: 'var(--pine)', padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>{t('duplicateClose')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
