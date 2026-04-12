import './globals.css'
import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#0f1c2e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // لمنع زووم المتصفح المزعج على الموبايل
};

export const metadata: Metadata = {
  title: "Fast Investment CRM",
  description: "Enterprise Real Estate CRM System",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Fast CRM",
  },
  formatDetection: {
    telephone: false, // لمنع المتصفح من تحويل الأرقام العادية لروابط اتصال بالخطأ
  },
};

// ... باقي كود الـ RootLayout كما هو ...
import NotificationListener from "@/components/NotificationListener";

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