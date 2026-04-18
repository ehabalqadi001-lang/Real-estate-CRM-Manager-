import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PREFIXES = ['/dashboard', '/company', '/admin', '/portal']
const PUBLIC_PREFIXES = ['/login', '/register', '/pending-approval', '/mfa', '/survey']
const ADMIN_PREFIXES = ['/admin', '/company']
const TENANT_ROUTE_PREFIX = '/app'
const RESERVED_SUBDOMAINS = new Set(['www', 'app', 'admin', 'api', 'fastinvestment', 'ehab-eslam-crm'])
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

function isBypassPath(pathname: string) {
  return (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/manifest.json') ||
    pathname.startsWith('/sw.js') ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|json)$/.test(pathname)
  )
}

function getTenantSubdomain(request: NextRequest) {
  const explicit = request.headers.get('x-tenant-subdomain')?.trim().toLowerCase()
  if (explicit && /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(explicit)) {
    return explicit
  }

  const host = request.headers.get('host')?.split(':')[0].toLowerCase()
  if (!host) return null

  if (host.endsWith('.localhost')) {
    return host.split('.')[0]
  }

  const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'fastinvestment.com').toLowerCase()
  if (host === rootDomain || host === `www.${rootDomain}`) return null

  if (host.endsWith(`.${rootDomain}`)) {
    const subdomain = host.slice(0, -(rootDomain.length + 1)).split('.')[0]
    return RESERVED_SUBDOMAINS.has(subdomain) ? null : subdomain
  }

  return null
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

  const tenantSubdomain = getTenantSubdomain(request)
  if (
    tenantSubdomain &&
    !isBypassPath(pathname) &&
    pathname !== TENANT_ROUTE_PREFIX &&
    !pathname.startsWith(`${TENANT_ROUTE_PREFIX}/`)
  ) {
    const url = request.nextUrl.clone()
    url.pathname = `${TENANT_ROUTE_PREFIX}/${tenantSubdomain}${pathname === '/' ? '' : pathname}`
    url.searchParams.set('__tenant', tenantSubdomain)
    return NextResponse.rewrite(url)
  }

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
