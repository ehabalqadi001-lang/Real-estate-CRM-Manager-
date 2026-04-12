import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. إنشاء استجابة أولية
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. إعداد عميل Supabase مع معالجة الكوكيز بطريقة آمنة
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // هذه هي الطريقة الصحيحة لتجنب خطأ "Cookies can only be modified..."
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 3. التحقق من المستخدم (Refresh session)
  const { data: { user } } = await supabase.auth.getUser()

  // 4. حماية المسارات: إذا لم يكن هناك مستخدم، وجهه لصفحة الـ login
  const isAuthPage = request.nextUrl.pathname === '/login'
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') || 
                           request.nextUrl.pathname.startsWith('/admin')

  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // إذا كان المستخدم مسجلاً بالفعل ويحاول دخول صفحة الـ login، وجهه للداشبورد
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}