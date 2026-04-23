import type { Metadata } from 'next'
import { Cairo, Inter, Geist } from 'next/font/google'
import './globals.css'
import CommandPalette from '@/components/CommandPalette'
import { ThemeProvider } from '@/components/ThemeProvider'
import Providers from '@/components/Providers'
import PWAInstaller from '@/components/PWAInstaller'
import NotificationListener from '@/components/NotificationListener'
import { cn } from '@/lib/utils'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { getLocaleFromCookies } from '@/lib/country'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  weight: ['400', '500', '600', '700', '800', '900'],
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'FAST INVESTMENT | Enterprise CRM',
  description: 'Enterprise CRM and sales command platform for FAST INVESTMENT.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Fast CRM' },
  other: { 'mobile-web-app-capable': 'yes' },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocaleFromCookies()
  const messages = await getMessages()

  return (
    <html
      lang="en"
      dir="ltr"
      className={cn(cairo.variable, inter.variable, geist.variable, 'font-cairo')}
      suppressHydrationWarning
    >
      <body className="font-cairo bg-slate-50 text-navy-dark antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
        <ThemeProvider attribute={['class', 'data-theme']} defaultTheme="system" enableSystem>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <Providers>
              <CommandPalette />
              <PWAInstaller />
              <NotificationListener />
              {children}
            </Providers>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
