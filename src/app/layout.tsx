import type { Metadata } from 'next'
import { Cairo, Inter } from 'next/font/google'
import './globals.css'

// تحميل الخطوط وتحسينها (Optimized Loading)
const cairo = Cairo({ 
  subsets: ['arabic', 'latin'], 
  variable: '--font-cairo',
  weight: ['400', '500', '600', '700', '800', '900'] // أوزان الخطوط للتحكم الدقيق
})

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  weight: ['400', '500', '600', '700']
})

export const metadata: Metadata = {
  title: 'FAST INVESTMENT | Enterprise CRM',
  description: 'النظام الإداري المتقدم لشركة فاست إنفستمنت - إدارة EHAB & ESLAM TEAM',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // ضبط الاتجاه الافتراضي للواجهة ليكون من اليمين لليسار
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${inter.variable}`}>
      <body className={`font-cairo bg-slate-50 text-navy-dark antialiased`}>
        {children}
      </body>
    </html>
  )
}