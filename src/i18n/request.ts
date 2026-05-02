import { getRequestConfig } from 'next-intl/server'
import { getLocaleFromCookies } from '@/lib/country'
import { getMessageFile } from '@/config/countries'

export default getRequestConfig(async () => {
  const locale = await getLocaleFromCookies()
  const messageFile = getMessageFile(locale)

  let messages: Record<string, unknown>
  try {
    messages = (await import(`./messages/${messageFile}.json`)).default
  } catch {
    // Fallback to ar-EG if the locale's message file is missing
    messages = (await import('./messages/ar-EG.json')).default
  }

  return {
    locale,
    messages,
    // Return key on missing translation instead of throwing in production
    onError: (error) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[next-intl]', error.message)
      }
    },
    getMessageFallback: ({ key, namespace }) =>
      namespace ? `${namespace}.${key}` : key,
  }
})
