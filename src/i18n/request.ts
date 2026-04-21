import { getRequestConfig } from 'next-intl/server'
import { getLocaleFromCookies } from '@/lib/country'

export default getRequestConfig(async () => {
  const locale = await getLocaleFromCookies()

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
