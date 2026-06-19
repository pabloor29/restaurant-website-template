import type { Metadata } from 'next'
import { Schibsted_Grotesk, Hanken_Grotesk, Newsreader } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { createClient } from '@/lib/supabase/server'
import { RESTAURANT_ID } from '@/lib/restaurant'

const schibsted = Schibsted_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-primary-loaded',
  display: 'swap',
})

const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-secondary-loaded',
  display: 'swap',
})

const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['italic'],
  weight: ['400', '500'],
  variable: '--font-accent-loaded',
  display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('restaurants')
    .select('name')
    .eq('id', RESTAURANT_ID)
    .single()

  const name = data?.name ?? 'Restaurant'

  return {
    title: { default: name, template: `%s — ${name}` },
    description: `Bienvenue au ${name}. Réservez votre table en ligne.`,
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const [{ data: restaurant }, { data: hoursData }] = await Promise.all([
    supabase.from('restaurants').select('id, name, phone, address, reservation_mode').eq('id', RESTAURANT_ID).single(),
    supabase.from('opening_hours').select('hours').eq('restaurant_id', RESTAURANT_ID).single(),
  ])

  return (
    <html lang="fr" className={`${schibsted.variable} ${hanken.variable} ${newsreader.variable}`}>
      <head>
        <style>{`
          :root {
            --font-primary: var(--font-primary-loaded, 'Schibsted Grotesk', sans-serif);
            --font-secondary: var(--font-secondary-loaded, 'Hanken Grotesk', sans-serif);
            --font-accent: var(--font-accent-loaded, 'Newsreader', serif);
          }
        `}</style>
      </head>
      <body>
        <Navbar restaurantName={restaurant?.name ?? ''} />
        <main>{children}</main>
        <Footer restaurant={restaurant} hours={hoursData?.hours} />
      </body>
    </html>
  )
}
