import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  const cookieStore = await cookies()
  const current = cookieStore.get('locale')?.value ?? 'ar'
  const next = current === 'ar' ? 'en' : 'ar'

  const response = NextResponse.json({ locale: next })
  response.cookies.set('locale', next, { path: '/', maxAge: 60 * 60 * 24 * 365 })
  return response
}
