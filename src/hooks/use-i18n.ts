'use client'

import { useLocale } from 'next-intl'

export function useI18n() {
  const locale = useLocale()
  const isAr = locale.startsWith('ar')
  const dir = (isAr ? 'rtl' : 'ltr') as 'rtl' | 'ltr'
  const numLocale = isAr ? 'ar-EG' : 'en-US'
  const t = (ar: string, en: string): string => (isAr ? ar : en)
  return { locale, isAr, dir, numLocale, t }
}
