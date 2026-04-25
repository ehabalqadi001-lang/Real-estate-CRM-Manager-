import { NextResponse, type NextRequest } from 'next/server'
import { hasPermission, normalizeRole } from '@/lib/permissions'
import { createClient } from '@/utils/supabase/middleware'

const PROTECTED_PREFIXES = ['/dashboard', '/admin', '/company', '/team', '/commissions', '/broker-portal']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Developer Feed API Gateway — HMAC header check (Section 9 of PropTech Service Mesh)
  if (pathname.startsWith('/api/integrations/developer-feed') && request.method === 'POST') {
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

  // Always refresh session cookies on every non-static request
  const { supabase, getResponse } = createClient(request)
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect logged-in users away from auth pages
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/forgot-password')
  if (isAuthRoute && user) {
    return redirect(request, '/dashboard')
  }

  if (!PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return getResponse()

  if (!user) return redirect(request, '/login')

  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('role, account_type, company_id, status, onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()

  const { data: legacyProfile } = userProfile ? { data: null } : await supabase
    .from('profiles')
    .select('role, account_type, company_id, status')
    .eq('id', user.id)
    .maybeSingle()

  const profile = (userProfile ?? legacyProfile) as {
    role?: string | null
    account_type?: string | null
    company_id?: string | null
    status?: string | null
    onboarding_completed?: boolean | null
  } | null
  const role = normalizeRole(profile?.role ?? (isConfiguredPlatformOwner(user.email ?? null) ? 'super_admin' : 'viewer'))
  const accountType = profile?.account_type ?? 'individual'
  const onboardingCompleted = profile?.onboarding_completed ?? Boolean(profile && profile.status !== 'pending')

  if (!profile && role !== 'super_admin') return redirect(request, '/onboarding/individual')
  if (profile?.status === 'suspended' || profile?.status === 'rejected') return redirect(request, '/login')

  if (!onboardingCompleted && pathname.startsWith('/dashboard')) {
    return redirect(request, accountType === 'company' ? '/onboarding/company' : '/onboarding/individual')
  }

  if (pathname.startsWith('/admin') && role !== 'super_admin') return redirect(request, '/dashboard')
  if (pathname.startsWith('/company') && !hasPermission(role, 'company:access')) return redirect(request, '/dashboard')
  if ((pathname.startsWith('/team') || pathname.startsWith('/dashboard/team')) && (!hasCompanyScope(profile?.company_id, role) || !hasPermission(role, 'team:read'))) return redirect(request, '/dashboard')
  if ((pathname.startsWith('/commissions') || pathname.startsWith('/dashboard/commissions')) && !hasPermission(role, 'commissions:read')) return redirect(request, '/dashboard')

  return getResponse()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}

function redirect(request: NextRequest, path: string) {
  const url = request.nextUrl.clone()
  url.pathname = path
  return NextResponse.redirect(url)
}

function isConfiguredPlatformOwner(email: string | null) {
  if (!email) return false
  const configured = [
    process.env.FAST_INVESTMENT_SUPER_ADMIN_EMAILS,
    process.env.SUPER_ADMIN_EMAILS,
    'admin@fastinvestment.com',
  ]
    .filter(Boolean)
    .flatMap((value) => String(value).split(','))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)

  return configured.includes(email.toLowerCase())
}

function hasCompanyScope(companyId: string | null | undefined, role: ReturnType<typeof normalizeRole>) {
  return Boolean(companyId) || role === 'super_admin' || role === 'company_admin'
}
