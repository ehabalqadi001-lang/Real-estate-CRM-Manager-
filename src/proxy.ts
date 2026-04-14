import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // 1. تحديث الطلب الداخلي
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          
          // 2. تحديث الاستجابة
          supabaseResponse = NextResponse.next({ request })
          
          // 3. زرع الكوكيز بقوة في المتصفح (وهذا ما كان ينقصنا)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // حماية الداشبورد العامة
  if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, status, account_type')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error("Proxy DB Error:", error.message)
        return supabaseResponse
      }

      // توجيهات الأمان (الانتظار والإدارة)
      if (profile?.status === 'pending' && !pathname.startsWith('/pending-approval')) {
        return NextResponse.redirect(new URL('/pending-approval', request.url))
      }

      if (pathname.startsWith('/admin') && profile?.role !== 'super_admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

      // التوجيه الذكي من الجذر
      if (pathname === '/') {
        const target = profile?.account_type === 'company' ? '/company/dashboard' : '/dashboard'
        return NextResponse.redirect(new URL(target, request.url))
      }

    } catch (err: any) {
      console.error("Critical Proxy Exception:", err.message)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login|register|pending-approval|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}