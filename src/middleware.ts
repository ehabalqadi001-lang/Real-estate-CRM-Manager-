import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // 1. تهيئة عميل Supabase للسيرفر
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
  const path = request.nextUrl.pathname;

  // 2. حماية المسارات الأساسية (إذا لم يكن مسجلاً، يُطرد للوحة الدخول)
  if (path.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 3. التحقق من الصلاحيات والأدوار (RBAC)
  if (user && path.startsWith('/dashboard')) {
    
    // جلب دور المستخدم وشركته
    const { data: agent } = await supabase
      .from('agents')
      .select('company_id, user_roles(role_name)')
      .eq('id', user.id)
      .single()

    const userRole = agent?.user_roles?.[0]?.role_name;

    // 🔥 قواعد الصلاحيات (ACL - Access Control List)
    
    // منع الـ Agent والـ Viewer من دخول صفحة الإعدادات أو الفريق
    const restrictedForAgents = ['/dashboard/settings', '/dashboard/team'];
    if ((userRole === 'agent' || userRole === 'viewer') && restrictedForAgents.some(route => path.startsWith(route))) {
      // توجيه لصفحة "غير مصرح لك" أو الصفحة الرئيسية
      return NextResponse.redirect(new URL('/dashboard?error=unauthorized', request.url))
    }

    // منع הـ Viewer من دخول صفحات الإضافة أو التعديل
    if (userRole === 'viewer' && (path.includes('/new') || path.includes('/edit'))) {
      return NextResponse.redirect(new URL('/dashboard?error=read_only', request.url))
    }
  }

  return supabaseResponse
}

// تحديد المسارات التي يعمل عليها الـ Middleware لتسريع الأداء
export const config = {
  matcher: [
    '/dashboard/:path*', // مراقبة كل ما هو داخل لوحة التحكم
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}