import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // --- الطبقة الأولى: منطق الـ Proxy (الموجود سابقاً) ---
  // إذا كان الطلب يتوافق مع مسارات الـ Proxy، قم بتنفيذه أولاً
  if (pathname.startsWith('/api/proxy')) {
    // ضع هنا منطق الـ Proxy الخاص بك (مثل التوجيه لـ Server خارجي)
    // return NextResponse.rewrite(new URL('...', request.url))
  }

  // --- الطبقة الثانية: منطق Supabase والـ RBAC ---
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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // جلب بيانات المستخدم وتأمين الصلاحيات
  const { data: { user } } = await supabase.auth.getUser()

  // 1. حماية مسارات الداشبورد
  if (!user && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role

    // 2. حماية مسار الـ Admin (صلاحية Super Admin فقط)
    if (pathname.startsWith('/admin') && role !== 'super_admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // 3. حماية الإعدادات وإدارة الفريق (للمديرين فقط)
    if (
      (pathname.startsWith('/dashboard/settings') || pathname.startsWith('/dashboard/team')) && 
      !['super_admin', 'company_admin', 'branch_manager'].includes(role as string)
    ) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}