import { createServerClient } from '@supabase/ssr'
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
  const pathname = request.nextUrl.pathname

  // 1. حماية الداشبورد: منع غير المسجلين
  if (!user && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    // جلب الحالة الفعلية من جدول Profiles (لأن Metadata السيرفر قد لا تحدث فوراً)
    const { data: profile } = await supabase
      .from('profiles')
      .select('status, role')
      .eq('id', user.id)
      .single()

    // 2. صمام الأمان: إذا كان الحساب "قيد الانتظار" يحظر دخوله للداشبورد تماماً
    if (profile?.status === 'pending' && pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/pending-approval', request.url))
    }

    // 3. منع الدخول للأدمن لغير الصلاحيات المخصصة
    if (pathname.startsWith('/admin') && profile?.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login|register|pending-approval|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}