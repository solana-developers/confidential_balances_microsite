import { FC, PropsWithChildren } from 'react'
import { Geist_Mono, Inter, Rubik } from 'next/font/google'

const interFont = Inter({
  display: 'swap',
  preload: true,
  subsets: ['latin'],
  variable: '--font-family-inter',
  weight: ['400'],
})

const rubikFont = Rubik({
  display: 'swap',
  preload: true,
  subsets: ['latin'],
  variable: '--default-font-family',
  weight: ['300', '400', '500', '700'],
})

const geistMonoFont = Geist_Mono({
  display: 'swap',
  preload: true,
  subsets: ['latin'],
  variable: '--font-family-geist-mono',
  weight: ['400', '700'],
})

export const metadata = {
  title: 'Solana Confidential Balances',
  description: '',
}

const RootLayout: FC<PropsWithChildren> = ({ children }) => (
  <html
    lang="en"
    className={`${rubikFont.className} ${interFont.variable} ${geistMonoFont.variable}`}
  >
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body className="dark min-w-[320px] overflow-y-hidden">{children}</body>
  </html>
)

export default RootLayout
