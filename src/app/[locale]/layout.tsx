import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import LiveNotifications from '@/components/LiveNotifications';
import '@/app/globals.css';

// تحديث هيكل البيانات ليتوافق مع Next.js 15 (params أصبحت Promise)
type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function RootLayout({ children, params }: Props) {
  // 1. يجب انتظار الـ params أولاً قبل استخراج اللغة
  const { locale } = await params;

  // 2. جلب ملفات الترجمة
  const messages = await getMessages();
  
  // 3. تحديد الاتجاه بناءً على اللغة
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