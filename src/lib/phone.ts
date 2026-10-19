// Phone-number formatting helpers shared by server and client components.
import { siteConfig } from '@/config/site'

// Toggle (via NEXT_PUBLIC_SHOW_PHONE) whether the phone number is shown anywhere
// on the public site — footer, contact, legal, JSON-LD, call buttons.
// Transactional emails (confirmation / autoreply) always keep the number.
export const SHOW_PHONE = siteConfig.showPhone

/** Strip a display phone number down to dialable characters ("+33 6 29" -> "+33629"). */
export const normalizePhone = (phone: string): string => phone.replace(/[^\d+]/g, '')

/** Build a tel: href from a display phone number. */
export const telHref = (phone: string): string => `tel:${normalizePhone(phone)}`
