import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// اللغات المدعومة في النظام
const locales = ['ar', 'en', 'fr'];

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as any)) notFound();

  return {
    locale: locale as string,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});