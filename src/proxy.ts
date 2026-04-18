import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PREFIXES = ['/dashboard', '/company', '/admin', '/portal']
const PUBLIC_PREFIXES = ['/login', '/register', '/pending-approval', '/mfa', '/survey']
const ADMIN_PREFIXES = ['/admin', '/company']
const ROLE_ALIASES: Record<string, string> = {
  'Super Admin': 'super_admin',
  Super_Admin: 'super_admin',
  SuperAdmin: 'super_admin',
  super_admin: 'super_admin',
  platform_admin: 'platform_admin',
  'Platform Admin': 'platform_admin',
  company_owner: 'company_owner',
  company_admin: 'company_admin',
  'Company Admin': 'company_admin',
  company: 'company_owner',
  admin: 'company_admin',
  Admin: 'company_admin',
  CLIENT: 'viewer',
  client: 'viewer',
  viewer: 'viewer',
}
const ADMIN_ROLES = new Set(['super_admin', 'platform_admin', 'company_owner', 'company_admin'])

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

function isPublic(pathname: string) {
  return pathname === '/' || PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

function normalizeRole(role: unknown) {
  const value = String(role ?? '').trim()
  if (!value) return 'agent'
  return ROLE_ALIASES[value] ?? value
}

function getAuthenticatedLanding(profile: { role?: unknown; account_type?: unknown } | null) {
  const rawRole = String(profile?.role ?? '').trim()
  const accountType = String(profile?.account_type ?? '').trim()
  const role = normalizeRole(rawRole)

  if ((rawRole === 'CLIENT' || rawRole === 'client' || role === 'viewer') && accountType === 'client') {
    return '/marketplace/profile'
  }

  return '/dashboard'
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (pathname === '/' && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, account_type')
      .eq('id', user.id)
      .maybeSingle()

    return NextResponse.redirect(new URL(getAuthenticatedLanding(profile), request.url))
  }

  if (isProtected(pathname) && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (user && isPublic(pathname) && pathname !== '/') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, account_type')
      .eq('id', user.id)
      .maybeSingle()

    return NextResponse.redirect(new URL(getAuthenticatedLanding(profile), request.url))
  }

  if (user && ADMIN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = normalizeRole(profile?.role)

    if (!ADMIN_ROLES.has(role)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
