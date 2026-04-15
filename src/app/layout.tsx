import type { Metadata } from 'next'
import { Cairo, Inter } from 'next/font/google'
import './globals.css'
import CommandPalette from '@/components/CommandPalette'
import { ThemeProvider } from '@/components/ThemeProvider' // <-- استدعاء المفاعل

const cairo = Cairo({ 
  subsets: ['arabic', 'latin'], 
  variable: '--font-cairo',
  weight: ['400', '500', '600', '700', '800', '900']
})

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  weight: ['400', '500', '600', '700']
})

export const metadata: Metadata = {
  title: 'FAST INVESTMENT | Enterprise CRM',
  description: 'نظام إدارة علاقات العملاء للإدارة العليا',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // إضافة suppressHydrationWarning لمنع أخطاء next-themes التحذيرية
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${inter.variable}`} suppressHydrationWarning>
      {/* دعم الألوان الداكنة في خلفية النظام (Dark Mode background) */}
      <body className={`font-cairo bg-slate-50 dark:bg-slate-950 text-navy-dark dark:text-slate-100 antialiased transition-colors duration-300`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <CommandPalette />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}