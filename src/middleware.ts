import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { redis } from '@/lib/redis'
import { createServerClient } from '@supabase/ssr'

// ─── Rate limiter ──────────────────────────────────────────────
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
})

// ─── Route permissions ────────────────────────────────────────
// Routes that require authentication (redirect to /login if not signed in)
const PROTECTED_PREFIXES = ['/dashboard', '/company', '/admin', '/portal']

// Routes only accessible to company/admin roles
const COMPANY_ONLY_PREFIXES = ['/company', '/admin']

// Public routes — always allowed
const PUBLIC_PATHS = ['/', '/login', '/signup', '/auth', '/portal', '/api/set-locale']

function isPublic(path: string) {
  return PUBLIC_PATHS.some(p => path === p || path.startsWith(p + '/') || path.startsWith('/api/'))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  // ── 1. Rate limiting on auth + api routes ─────────────────
  if (pathname.startsWith('/auth') || pathname.startsWith('/api')) {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    const { success, limit, reset, remaining } = await ratelimit.limit(ip)
    if (!success) {
      return new NextResponse(
        JSON.stringify({ error: 'تم تجاوز الحد الأقصى للطلبات. يرجى الانتظار.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          },
        }
      )
    }
  }

  // ── 2. Skip RBAC for public paths ─────────────────────────
  if (isPublic(pathname)) return response

  // ── 3. Check if route needs protection ────────────────────
  const needsAuth = PROTECTED_PREFIXES.some(p => pathname.startsWith(p))
  if (!needsAuth) return response

  // ── 4. Build Supabase client from cookies ─────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // ── 5. Not authenticated → redirect to login ──────────────
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── 6. Role-based guard for /company/* and /admin/* ───────
  const needsCompanyRole = COMPANY_ONLY_PREFIXES.some(p => pathname.startsWith(p))
  if (needsCompanyRole) {
    // DB-verify role — cookie cannot be trusted (can be spoofed)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role ?? 'agent'
    const adminRoles = ['admin', 'Admin', 'company_admin', 'company', 'super_admin', 'Super_Admin']

    if (!adminRoles.includes(role)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
