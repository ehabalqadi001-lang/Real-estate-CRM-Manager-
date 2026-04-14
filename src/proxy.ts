import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * دالة الـ Proxy (المعروفة سابقاً بالـ Middleware)
 * المهمة: حراسة المسارات، تطبيق الـ RBAC، وضمان الفصل بين الشركات (Multi-tenancy).
 * [مرجع التقرير: قسم ٥.٢ منطق التوجيه وقسم ٦.٣ نظام الموافقة]
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // 1. تهيئة اتصال Supabase آمن من السيرفر
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

  // جلب المستخدم الحالي وجلسة العمل
  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // 2. صيد الأخطاء الأول: حماية المسارات الإدارية للمستخدمين غير المسجلين
  if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    try {
      // جلب بيانات الصلاحيات والحالة من جدول Profiles [cite: 97, 115]
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, status, account_type')
        .eq('id', user.id)
        .single()

      if (error) throw error

      const { role, status, account_type } = profile

      // 3. نظام الموافقة (Approval System) 
      // إذا كان الحساب "قيد الانتظار"، يُمنع من دخول النظام ويُوجه لصفحة التنبيه
      if (status === 'pending' && !pathname.startsWith('/pending-approval')) {
        return NextResponse.redirect(new URL('/pending-approval', request.url))
      }

      // 4. حماية لوحة تحكم المنصة العليا (Super Admin فقط) [cite: 107, 110]
      if (pathname.startsWith('/admin') && role !== 'super_admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

      // 5. حماية مسارات الشركات (Company Admin / Branch Manager) [cite: 97, 105]
      const adminRoles = ['super_admin', 'company_admin', 'branch_manager']
      if (pathname.startsWith('/company') && !adminRoles.includes(role)) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

      // 6. توجيه ذكي حسب نوع الحساب عند الدخول للجذر 
      if (pathname === '/') {
        const target = account_type === 'company' ? '/company/dashboard' : '/dashboard'
        return NextResponse.redirect(new URL(target, request.url))
      }

    } catch (err: any) {
      // صائد الأخطاء الإجباري (Rule 3)
      console.error("Critical Security Guard Error:", err.message)
      // في حالة وجود خطأ فادح في البيانات، نوجه لتسجيل الدخول للأمان
      return NextResponse.redirect(new URL('/login?error=security_check_failed', request.url))
    }
  }

  return supabaseResponse
}

// تعريف المسارات التي يجب أن يراقبها الحارس الأمني 
export const config = {
  matcher: [
    /*
     * استثناء الملفات الثابتة والروابط العامة لضمان الأداء [cite: 32]
     */
    '/((?!_next/static|_next/image|favicon.ico|login|register|pending-approval|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}