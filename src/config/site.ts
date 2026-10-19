/**
 * Central site configuration — the single place to edit when cloning this
 * template for a new restaurant (together with the env vars and the
 * `messages/*.json` text files).
 *
 * Dynamic data (name, phone, email, address, opening hours, menus, formules,
 * events) comes from Supabase. Everything that CARBO used to hard-code lives
 * here instead so a clone only needs: env vars + this file + messages + style.
 *
 * Anything a Client Component needs must be read from a `NEXT_PUBLIC_*` env var
 * (or a literal), never from a server-only secret.
 */

const bool = (v: string | undefined, fallback: boolean) =>
  v === undefined ? fallback : v === 'true' || v === '1'

export const siteConfig = {
  // Absolute site URL — used for canonical/hreflang/OpenGraph/sitemap.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com',

  // Hide the phone number everywhere it is shown on the public site (footer,
  // contact, legal, JSON-LD, call buttons). Transactional emails keep it.
  showPhone: bool(process.env.NEXT_PUBLIC_SHOW_PHONE, false),

  // Default social-share / OpenGraph image (served from /public).
  ogImage: '/og.jpg',
  // Favicon / icons (served from /public).
  icon: '/favicon.ico',

  instagram: {
    handle: process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE ?? '@restaurant',
    url: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? 'https://instagram.com',
  },

  maps: {
    // Paste a Google Maps "embed" iframe `src` here. If empty, the contact page
    // builds a basic embed from the restaurant address stored in Supabase.
    embedSrc: process.env.NEXT_PUBLIC_MAPS_EMBED_SRC ?? '',
    // Link opened when the user clicks the address. Falls back to a search by
    // address when empty.
    placeUrl: process.env.NEXT_PUBLIC_MAPS_PLACE_URL ?? '',
    lat: Number(process.env.NEXT_PUBLIC_GEO_LAT ?? '') || null,
    lng: Number(process.env.NEXT_PUBLIC_GEO_LNG ?? '') || null,
  },

  // Restaurant descriptors for SEO / schema.org.
  cuisine: ['Restaurant'],
  priceRange: '€€',

  // Amenities surfaced on the contact page + schema.org. Toggle per client.
  amenities: {
    wifi: true,
    petsAllowed: true,
    creditCard: true,
    cash: true,
    // Spoken languages advertised on the contact page (message keys in the
    // `contact` namespace: langEnglish / langSpanish / langItalian).
    languages: ['en', 'es', 'it'] as const,
  },

  reservation: {
    // Parties larger than this are asked to contact the restaurant directly.
    maxGuests: 10,
    // Same-day online booking is blocked once the local hour reaches this value
    // (guests are told to phone instead). Set to 24 to disable the block.
    sameDayCutoffHour: 20,
  },

  menu: {
    // Menu category (name in `menu_categories`) shown in the "formula of the
    // day" popup on the home + menu pages. Leave '' to disable the popup.
    formulaCategoryName: 'Formule du midi',
  },

  // Real customer reviews (e.g. copied from Google). Restaurant-specific quotes,
  // left untranslated. Empty array hides the reviews section.
  reviews: [
    {
      name: 'Marie D.',
      rating: 5,
      date: '',
      text: 'Une adresse incontournable — cuisine soignée, produits frais et un accueil chaleureux. À recommander les yeux fermés !',
    },
    {
      name: 'Thomas L.',
      rating: 5,
      date: '',
      text: 'Excellent repas du début à la fin. Le cadre est agréable et le service aux petits soins. On reviendra !',
    },
    {
      name: 'Sophie B.',
      rating: 5,
      date: '',
      text: 'Tout était parfait : les plats, l’ambiance et la gentillesse de l’équipe. Une très belle découverte.',
    },
  ] as { name: string; rating: number; date: string; text: string }[],
  // Aggregate rating shown in schema.org (set to match your real figures).
  rating: { value: 5, count: 3 },

  // Legal / "mentions légales" entity details. The restaurant name, address,
  // phone and email are read from Supabase; only the formal bits live here.
  legal: {
    legalForm: '[à compléter]',
    siret: '[à compléter]',
    tva: '[à compléter]',
    publicationDirector: '[à compléter]',
    hosting: {
      name: 'Vercel Inc.',
      address: '340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis',
      url: 'https://vercel.com',
    },
    developer: { name: 'resa-service.com', url: 'https://resa-service.com' },
  },
} as const

export type SiteConfig = typeof siteConfig
