import './globals.css'

import { FC, PropsWithChildren } from 'react'
import { Inter, Rubik } from 'next/font/google'
import { App, Layout as BaseLayout } from '@/app'
import { navigation } from '@/shared/navigation'

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

export const metadata = {
  title: 'Solana Confidential Balances',
  description: '',
}

const RootLayout: FC<PropsWithChildren> = ({ children }) => (
  <html lang="en" className={`${rubikFont.className} ${interFont.variable}`}>
    <body className="dark">
      <App>
        <BaseLayout links={navigation}>{children}</BaseLayout>
      </App>
    </body>
  </html>
)

export default RootLayout
