import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAST INVESTMENT CRM',
  description: 'Enterprise Real Estate CRM',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      {/* جسم الموقع الأساسي خالي من أي قوائم لضمان عدم التكرار */}
      <body className="bg-slate-50 text-slate-900 font-sans">
        {children}
      </body>
    </html>
  )
}