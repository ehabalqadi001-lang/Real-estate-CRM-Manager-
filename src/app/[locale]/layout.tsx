import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import LiveNotifications from '@/components/LiveNotifications';
import '../globals.css';

export default async function RootLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();
  
  // 🧭 تحديد الاتجاه بناءً على اللغة
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <LiveNotifications />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}