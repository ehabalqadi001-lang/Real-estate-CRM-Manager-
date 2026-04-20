import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { normalizeRole, type Role } from '@/lib/permissions'

const PROTECTED_PREFIXES = ['/dashboard', '/admin', '/company', '/team', '/commissions']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (!PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return NextResponse.next()

  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect(request, '/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, account_type, company_id, status')
    .eq('id', user.id)
    .maybeSingle()

  const role = normalizeRole(profile?.role ?? 'viewer')
  const accountType = profile?.account_type ?? 'individual'
  const onboardingCompleted = profile?.status !== 'pending'

  if (!onboardingCompleted && pathname.startsWith('/dashboard')) {
    return redirect(request, accountType === 'company' ? '/onboarding/company' : '/onboarding/individual')
  }

  if (pathname.startsWith('/admin') && role !== 'super_admin') return redirect(request, '/dashboard')
  if (pathname.startsWith('/company') && !allowed(role, ['super_admin', 'company_admin', 'branch_manager'])) return redirect(request, '/dashboard')
  if (pathname.startsWith('/team') && !profile?.company_id) return redirect(request, '/dashboard')
  if ((pathname.startsWith('/commissions') || pathname.startsWith('/dashboard/commissions')) && role === 'viewer') return redirect(request, '/dashboard')

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/company/:path*', '/team/:path*', '/commissions/:path*'],
}

function redirect(request: NextRequest, path: string) {
  const url = request.nextUrl.clone()
  url.pathname = path
  return NextResponse.redirect(url)
}

function allowed(role: Role, roles: Role[]) {
  return roles.includes(role)
}
