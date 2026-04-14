import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // 1. تهيئة محرك قاعدة البيانات مع حقن الكوكيز في المتصفح بقوة
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

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // 2. حماية المسارات المغلقة وطرد الزوار غير المسجلين لصفحة الدخول
  if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/company'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    try {
      // جلب ملف المستخدم لمعرفة الصلاحيات
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, status, account_type')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error("Proxy DB Error:", error.message)
        return supabaseResponse
      }

      // 3. نظام الموافقات: حجز الحسابات الجديدة في صفحة الانتظار
      if (profile?.status === 'pending' && !pathname.startsWith('/pending-approval')) {
        return NextResponse.redirect(new URL('/pending-approval', request.url))
      }

      // 4. حماية المنطقة العليا (Super Admin فقط)
      if (pathname.startsWith('/admin') && profile?.role !== 'super_admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

      // 5. حماية منطقة الشركات (Company Dashboard)
      const companyRoles = ['super_admin', 'company_admin', 'branch_manager']
      if (pathname.startsWith('/company') && !companyRoles.includes(profile?.role)) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

      // 6. بوصلة التوجيه الذكي (Smart Routing Compass)
      // عندما يدخل المستخدم إلى الجذر (/) يتم توجيهه حسب منصبه
      if (pathname === '/') {
        if (profile?.role === 'super_admin') {
          return NextResponse.redirect(new URL('/admin/super-dashboard', request.url))
        }
        
        const target = profile?.account_type === 'company' ? '/company/dashboard' : '/dashboard'
        return NextResponse.redirect(new URL(target, request.url))
      }

    } catch (err: any) {
      console.error("Critical Proxy Exception:", err.message)
    }
  }

  return supabaseResponse
}

// تحديد المسارات التي يجب على الحارس مراقبتها (تجاهل الملفات الثابتة لسرعة الأداء)
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login|register|pending-approval|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}