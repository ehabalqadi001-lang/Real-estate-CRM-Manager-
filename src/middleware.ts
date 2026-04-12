import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname;

  if (user) {
    // جلب دور المستخدم من قاعدة البيانات
    const { data: agent } = await supabase
      .from('agents')
      .select('user_roles(role_name)')
      .eq('id', user.id)
      .single()

    const userRole = agent?.user_roles?.[0]?.role_name;

    // 🔥 الحماية الصارمة لمسارات الإدارة العليا
    if (pathname.startsWith('/admin')) {
      if (userRole !== 'super_admin' && userRole !== 'company_admin') {
        // إذا كان مندوباً أو مديراً فرعياً، يتم طرده للوحة تحكم المندوبين
        return NextResponse.redirect(new URL('/dashboard?error=unauthorized', request.url))
      }
    }

    // الحماية من دخول Viewer (مراقب) لصفحات التعديل
    if (userRole === 'viewer' && (pathname.includes('/new') || pathname.includes('/edit') || pathname.includes('/settings'))) {
      return NextResponse.redirect(new URL('/dashboard?error=read_only', request.url))
    }
  } else if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) {
    // غير مسجل الدخول
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
}