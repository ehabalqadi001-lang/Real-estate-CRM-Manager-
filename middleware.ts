import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ── Route → required role/permission matrix ──────────────────────────
// A route matches if the user's role satisfies ANY of the listed roles.
// More granular permission checks happen inside page Server Components.

const ROUTE_ROLE_MAP: Array<{ pattern: RegExp; roles: string[] }> = [
  // Super Admin exclusive
  { pattern: /^\/admin\/super-dashboard(\/.*)?$/, roles: ['super_admin', 'platform_admin'] },
  // Finance Vault — finance roles + super admin
  { pattern: /^\/admin\/finance-vault(\/.*)?$/, roles: ['super_admin', 'platform_admin', 'finance_manager', 'finance_officer'] },
  // Data Entry Hub
  { pattern: /^\/admin\/data-entry(\/.*)?$/, roles: ['super_admin', 'platform_admin', 'data_manager', 'inventory_rep', 'admin', 'company_admin', 'company_owner'] },
  // Account Management
  { pattern: /^\/admin\/account-management(\/.*)?$/, roles: ['super_admin', 'platform_admin', 'am_supervisor', 'users_am', 'ads_am', 'admin', 'company_admin', 'company_owner'] },
  // Ad Approvals
  { pattern: /^\/admin\/ad-approvals(\/.*)?$/, roles: ['super_admin', 'platform_admin', 'ad_manager', 'ad_reviewer', 'admin', 'company_admin', 'company_owner'] },
  // CS & Marketing
  { pattern: /^\/admin\/cs-marketing(\/.*)?$/, roles: ['super_admin', 'platform_admin', 'cs_supervisor', 'cs_agent', 'marketing_manager', 'campaign_specialist', 'admin', 'company_admin', 'company_owner'] },
  // Finance marketplace (legacy)
  { pattern: /^\/admin\/finance-marketplace(\/.*)?$/, roles: ['super_admin', 'platform_admin', 'finance_manager', 'finance_officer', 'admin', 'company_admin', 'company_owner'] },
  // Users management
  { pattern: /^\/admin\/users(\/.*)?$/, roles: ['super_admin', 'platform_admin', 'admin', 'company_admin', 'company_owner', 'am_supervisor'] },
  // General /admin — any authenticated admin-tier role
  {
    pattern: /^\/admin(\/.*)?$/,
    roles: [
      'super_admin', 'platform_admin', 'company_owner', 'company_admin',
      'sales_director', 'admin', 'company',
      'ad_reviewer', 'ad_manager',
      'users_am', 'ads_am', 'am_supervisor',
      'collection_rep', 'finance_manager', 'finance_officer',
      'inventory_rep', 'data_manager',
      'campaign_specialist', 'marketing_manager',
      'cs_agent', 'cs_supervisor',
    ],
  },
]

const ROLE_ALIASES: Record<string, string> = {
  'Super Admin': 'super_admin',
  Super_Admin: 'super_admin',
  SuperAdmin: 'super_admin',
  Admin: 'company_admin',
  admin: 'company_admin',
  company: 'company_owner',
  agent: 'agent',
  Agent: 'agent',
  CLIENT: 'viewer',
  client: 'viewer',
}

function normalizeRole(role: string | null | undefined): string {
  if (!role) return 'viewer'
  return ROLE_ALIASES[role] ?? role
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Refresh Supabase auth session ──────────────────────────
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // IMPORTANT: getUser() re-validates the JWT — never use getSession() in middleware
  const { data: { user } } = await supabase.auth.getUser()

  // ── Auth-required routes ────────────────────────────────────
  const isAdminRoute = pathname.startsWith('/admin')
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register')

  if (!user && isAdminRoute) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (!user || !isAdminRoute) {
    return response
  }

  // ── Role-based route protection ─────────────────────────────
  // Fetch role from profiles table (lightweight single-column query)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = normalizeRole(profile?.role as string | null | undefined)

  for (const route of ROUTE_ROLE_MAP) {
    if (route.pattern.test(pathname)) {
      if (!route.roles.includes(role)) {
        // Redirect to the most appropriate fallback based on their actual role
        const forbidden = new URL('/dashboard', request.url)
        forbidden.searchParams.set('error', 'insufficient_permissions')
        return NextResponse.redirect(forbidden)
      }
      break
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static / _next/image (Next.js internals)
     * - favicon.ico, public assets
     * - API routes that handle their own auth
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
