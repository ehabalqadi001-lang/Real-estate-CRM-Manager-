import { getLocaleFromCookies } from '@/lib/country'

export async function getI18n() {
  const locale = await getLocaleFromCookies()
  const isAr = locale.startsWith('ar')
  const dir = (isAr ? 'rtl' : 'ltr') as 'rtl' | 'ltr'
  const numLocale = isAr ? 'ar-EG' : 'en-US'
  const t = (ar: string, en: string): string => (isAr ? ar : en)
  return { locale, isAr, dir, numLocale, t }
}
