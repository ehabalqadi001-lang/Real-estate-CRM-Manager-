import { cookies } from 'next/headers'
import { DEFAULT_COUNTRY, isCountryCode, localeForCountry, type CountryCode } from '@/config/countries'

export async function getCountryCode(): Promise<CountryCode> {
  const cookieStore = await cookies()
  const value = cookieStore.get('country')?.value
  return isCountryCode(value) ? value : DEFAULT_COUNTRY
}

export async function getLocaleFromCookies() {
  const cookieStore = await cookies()
  const locale = cookieStore.get('locale')?.value
  if (locale === 'ar-EG' || locale === 'ar-SA' || locale === 'ar-AE' || locale === 'en-US' || locale === 'ar' || locale === 'en') {
    return locale
  }
  return localeForCountry(await getCountryCode())
}
