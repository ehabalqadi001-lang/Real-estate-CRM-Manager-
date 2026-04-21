import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = sanitizeNextPath(requestUrl.searchParams.get('next'))
  const redirectUrl = new URL(next, requestUrl.origin)

  if (!code) {
    redirectUrl.searchParams.set('error', 'missing_code')
    return NextResponse.redirect(redirectUrl)
  }

  let response = NextResponse.redirect(redirectUrl)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.redirect(redirectUrl)
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    redirectUrl.searchParams.set('error', 'invalid_or_expired')
    response = NextResponse.redirect(redirectUrl)
  }

  return response
}

function sanitizeNextPath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/reset-password'
  return value
}
