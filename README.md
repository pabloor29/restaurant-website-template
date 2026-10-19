# Restaurant website template

Reusable Next.js template for restaurant websites, backed by the shared
Supabase restaurant-admin and Resend. Feature-equivalent to the CARBO site:
multilingual pages, online reservations with live availability, menus, set
menus, events, contact, about, legal pages and SEO.

Clone it, point it at a restaurant, update content + style — ship.

## Stack

- **Next.js 15** (App Router) + **React 19**, TypeScript
- **next-intl** — 4 locales (`fr`, `en`, `es`, `it`), `/` = French, `/en` … for the rest
- **Supabase** — dynamic data (restaurant info, hours, menus, set menus, events, reservations)
- **Resend** — reservation + autoreply emails
- **Vercel Analytics** (cookieless)

## Features (parity with CARBO)

- **Home** — hero, intro, set-menu & event previews, reviews carousel, opening hours, "formula of the day" popup
- **Menus** `/menus` — menu images grouped by category (Supabase Storage) + formula popup
- **Set menus** `/formules` — group/seminar formules from the DB
- **Events** `/evenements` — upcoming & past, with posters
- **Reservation** `/reservation` — date picker (closed days / holidays / past days greyed out), per-service lunch/dinner slots, **live capacity-based availability**, same-day cut-off, max-party notice, duplicate detection, multilingual confirmation email
- **Contact** `/contact` — map, address, amenities (payment / Wi-Fi / pets / languages), hours
- **About** `/apropos` — editable team / story sections
- **Legal** — `/mentions-legales`, `/politique-confidentialite`, `/cgu`
- **Autoreply** `/reservation-autoreply` — internal confirm/refuse page (opened from the owner email), `noindex`
- **SEO** — per-locale sitemap with hreflang, canonical/hreflang tags, OpenGraph/Twitter, `robots.txt`, JSON-LD `Restaurant`

## Quick start (new restaurant)

```bash
git clone <this-repo> my-restaurant && cd my-restaurant
npm install            # if npm errors with "edgesOut", use: npm install --legacy-peer-deps
cp .env.example .env.local   # then fill it in
npm run dev
```

Then, to make it *this* restaurant:

1. **Env vars** — fill `.env.local` (Supabase keys, `RESTAURANT_ID`, Resend, `NEXT_PUBLIC_SITE_URL`, …). See `.env.example`.
2. **Config** — edit `src/config/site.ts`: Instagram, Google Maps, geo, cuisine, amenities, reviews, reservation limits, legal entity (SIRET/TVA/…), `showPhone`.
3. **Content / translations** — edit `messages/{fr,en,es,it}.json` (about sections, labels, meta descriptions). Dynamic data (name, phone, email, address, hours, menus, set menus, events) is managed in the Supabase admin — no code change.
4. **Assets** — drop `public/og.jpg` (social share, 1200×630) and `public/favicon.ico`.
5. **Style** — theme tokens (colours, fonts) live at the top of `src/app/globals.css` (`:root` CSS variables). Change them to re-skin without touching components.

## Supabase schema (read from the admin project)

Tables used: `restaurants` (name, email, phone, address, `table_turn_midi/soir`),
`opening_hours`, `closed_days`, `holidays`, `reservation_schedule`,
`reservation_slot_overrides`, `floor_rooms`, `floor_tables`,
`menu_categories`, `menu_files`, `formules`, `restaurant_events`,
`event_files`, and `reservations` (incl. a `locale` column so the admin can
reply in the guest's language). Storage buckets: `menus`, `events`.

## Scripts

```bash
npm run dev     # local dev (Turbopack)
npm run build   # production build
npm run start   # run the production build
npm run lint
```

Deploy on Vercel: set the same environment variables in the project settings.
