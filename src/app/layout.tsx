import type { Metadata } from 'next'
import { Playfair_Display, EB_Garamond, Libre_Franklin } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const garamond = EB_Garamond({
  subsets: ['latin'],
  variable: '--font-garamond',
  weight: ['400', '500', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const franklin = Libre_Franklin({
  subsets: ['latin'],
  variable: '--font-franklin',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'El Chenque - Noticias locales generadas con IA',
  description: 'Noticias locales generadas con IA',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${playfair.variable} ${garamond.variable} ${franklin.variable}`}>
        {children}
      </body>
    </html>
  )
}
