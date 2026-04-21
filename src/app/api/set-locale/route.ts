import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { isCountryCode, localeForCountry } from '@/config/countries'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const body = await request.json().catch(() => ({})) as { locale?: string; country?: string }
  const current = cookieStore.get('locale')?.value ?? 'ar'
  const next = body.locale ?? (current === 'ar' ? 'en' : 'ar')
  const country = isCountryCode(body.country) ? body.country : null
  const locale = country ? localeForCountry(country) : next

  const response = NextResponse.json({ locale, country })
  response.cookies.set('locale', locale, { path: '/', maxAge: 60 * 60 * 24 * 365 })
  if (country) response.cookies.set('country', country, { path: '/', maxAge: 60 * 60 * 24 * 365 })
  return response
}
