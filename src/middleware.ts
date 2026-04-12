import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. تجهيز الاستجابة المبدئية
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. إنشاء عميل Supabase الآمن (لفحص الهوية)
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
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 3. التحقق من هوية المستخدم (هل هو مسجل دخول؟)
  const { data: { user } } = await supabase.auth.getUser()

  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard')
  const isLoginRoute = request.nextUrl.pathname.startsWith('/login')

  // 🔴 القاعدة الأولى: غير مسجل دخول + يحاول دخول لوحة التحكم = طرد إلى صفحة الدخول
  if (!user && isDashboardRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 🟢 القاعدة الثانية: مسجل دخول + يحاول فتح صفحة الدخول = تحويل تلقائي للوحة التحكم
  if (user && isLoginRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 🛡️ القاعدة الثالثة: نظام الصلاحيات (RBAC - Role Based Access Control)
  if (user && isDashboardRoute) {
    // جلب دور الموظف (Role) من قاعدة البيانات
    const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single()

    // الصفحات المحرمة على المندوبين العاديين (للإدارة فقط)
    const adminOnlyRoutes = [
      '/dashboard/settings', 
      '/dashboard/developers', 
      '/dashboard/reports'
    ]
    
    const isTryingToAccessAdminRoute = adminOnlyRoutes.some(route => request.nextUrl.pathname.startsWith(route))

    // إذا كان الموظف "مندوب مبيعات" (agent) ويحاول دخول صفحة إدارة -> أعده للرئيسية
    if (profile?.role === 'agent' && isTryingToAccessAdminRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

// 4. تحديد المسارات التي سيعمل عليها حارس الأمن (لتسريع الموقع)
export const config = {
  matcher: [
    '/dashboard/:path*', // مراقبة كل صفحات لوحة التحكم
    '/login'             // مراقبة صفحة الدخول
  ],
}