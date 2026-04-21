import { NextResponse, type NextRequest } from 'next/server'
import { hasPermission, normalizeRole } from '@/lib/permissions'
import { createClient } from '@/utils/supabase/middleware'

const PROTECTED_PREFIXES = ['/dashboard', '/admin', '/company', '/team', '/commissions']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (!PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return NextResponse.next()

  const { supabase, getResponse } = createClient(request)

  const { data: { user } } = await supabase.auth.getUser()
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
  matcher: ['/dashboard/:path*', '/admin/:path*', '/company/:path*', '/team/:path*', '/commissions/:path*'],
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
