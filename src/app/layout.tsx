import './globals.css'
import type { Metadata } from 'next'
import NotificationListener from "@/components/NotificationListener";
export const metadata: Metadata = {
  title: 'FAST INVESTMENT | CRM',
  description: 'Enterprise Real Estate CRM System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
            <NotificationListener />
            {children}
          </body>
    </html>
  )
}