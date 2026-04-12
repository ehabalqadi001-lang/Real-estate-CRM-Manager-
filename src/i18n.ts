import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// اللغات المدعومة في النظام
const locales = ['ar', 'en', 'fr'];

export default getRequestConfig(async ({ requestLocale }) => {
  // 1. في الإصدارات الحديثة نستخدم requestLocale كـ Promise
  const locale = await requestLocale;

  // 2. التحقق من صحة اللغة
  if (!locale || !locales.includes(locale)) notFound();

  return {
    locale,
    // 3. المسار الصحيح المصلّح (بنقطة واحدة)
    messages: (await import(`./messages/${locale}.json`)).default
  };
});