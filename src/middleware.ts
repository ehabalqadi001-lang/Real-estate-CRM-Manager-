import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // 1. API Gateway Security (Developer Feed) - تطبيقا للقسم 9 من الهيكل
  if (path.startsWith('/api/integrations/developer-feed') && request.method === 'POST') {
    const clientKey = request.headers.get('x-fi-client-key')
    const signature = request.headers.get('x-fi-signature')
    const timestamp = request.headers.get('x-fi-timestamp')

    if (!clientKey || !signature || !timestamp) {
      return NextResponse.json(
        { success: false, error: 'Missing Required API Security Headers (X-FI-Client-Key, X-FI-Signature, X-FI-Timestamp)' },
        { status: 401 }
      )
    }
  }

  // 2. Protect Authenticated Routes (Dashboard, Admin, Marketplace)
  const isProtectedRoute = path.startsWith('/dashboard') || path.startsWith('/admin') || path.startsWith('/marketplace/profile')
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectedFrom', path)
    const redirectResponse = NextResponse.redirect(redirectUrl)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value)
    })
    return redirectResponse
  }

  // 3. Prevent logged-in users from accessing Auth pages
  const isAuthRoute = path.startsWith('/login') || path.startsWith('/register') || path.startsWith('/forgot-password')
  if (isAuthRoute && user) {
    const redirectResponse = NextResponse.redirect(new URL('/dashboard', request.url))
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value)
    })
    return redirectResponse
  }

  // 4. Basic Admin RBAC check
  if (path.startsWith('/admin')) {
    const userRole = request.cookies.get('user_role')?.value
    if (userRole !== 'super_admin' && userRole !== 'platform_admin') {
      const redirectResponse = NextResponse.redirect(new URL('/dashboard', request.url))
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value)
      })
      return redirectResponse
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}