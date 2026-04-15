import type { Metadata } from 'next'
import { Cairo, Inter } from 'next/font/google'
import './globals.css' // <-- السطر الأهم لضخ التصميم في كل المنصة

// تجهيز خط Cairo
const cairo = Cairo({ 
  subsets: ['arabic', 'latin'], 
  variable: '--font-cairo',
  weight: ['400', '500', '600', '700', '800', '900']
})

// تجهيز خط Inter
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
    // فرض الـ RTL والخطوط على كل النظام
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${inter.variable}`}>
      <body className={`font-cairo bg-slate-50 text-navy-dark antialiased`}>
        {children}
      </body>
    </html>
  )
}