import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // --- 1. طبقة الـ Proxy (الأولوية القصوى) ---
  // إذا كان الطلب موجهاً لـ Proxy أو API خارجي، يتم تمريره فوراً دون فحص الصلاحيات
  if (pathname.startsWith('/api/proxy')) {
    // يمكنك هنا إضافة أي منطق خاص بـ rewrite إذا كنت تستخدم خادماً خارجياً
    return NextResponse.next()
  }

  // --- 2. تهيئة استجابة Supabase وتحديث الجلسة ---
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

  // تجديد الجلسة (Session Refresh)
  const { data: { user } } = await supabase.auth.getUser()

  // --- 3. حماية مسارات الداشبورد (Authentication) ---
  // إذا لم يسجل الدخول وحاول دخول أي صفحة إدارية، يتم طرده لصفحة الدخول
  if (!user && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    // جلب بيانات الحساب (الحالة والدور) من جدول Profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', user.id)
      .single()

    const status = profile?.status
    const role = profile?.role

    // --- 4. حماية "منطقة الانتظار" (Approval System) ---
    // إذا كان الحساب "قيد الانتظار" (Pending)، يمنع من دخول الداشبورد ويُوجه لصفحة التنبيه
    if (status === 'pending' && pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/pending-approval', request.url))
    }

    // إذا كان الحساب "مرفوض" (Rejected)، يتم توجيهه لصفحة الدخول مع رسالة خطأ
    if (status === 'rejected' && pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/login?error=account_rejected', request.url))
    }

    // --- 5. نظام الصلاحيات (RBAC Layer) ---
    // حماية لوحة تحكم المنصة العليا (Super Admin فقط)
    if (pathname.startsWith('/admin') && role !== 'super_admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // حماية الصفحات الإدارية للشركات (الإعدادات وإدارة الفريق)
    // لا يدخلها إلا (Super Admin, Company Admin, Branch Manager)
    const adminRoles = ['super_admin', 'company_admin', 'branch_manager']
    if (
      (pathname.startsWith('/dashboard/settings') || pathname.startsWith('/dashboard/team')) && 
      !adminRoles.includes(role as string)
    ) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

// تحديد المسارات التي يراقبها الـ Middleware
export const config = {
  matcher: [
    /*
     * مراقبة كافة المسارات ماعدا:
     * 1. الملفات الثابتة (static files, images, favicon)
     * 2. صفحات الـ Auth العامة (login, register)
     */
    '/((?!_next/static|_next/image|favicon.ico|login|register|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}