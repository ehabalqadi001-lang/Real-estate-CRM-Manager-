import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import createMiddleware from 'next-intl/middleware';

// 1. إعداد موجه اللغات (i18n)
const intlMiddleware = createMiddleware({
  locales: ['ar', 'en', 'fr'],
  defaultLocale: 'ar', // اللغة الافتراضية للسوق المصري
  localePrefix: 'as-needed'
});

// 2. النطاقات المسموح لها بالتخاطب مع النظام (CORS Whitelist)
const allowedOrigins = [
  'https://real-estate-crm-manager.vercel.app', // الدومين الحي
  'https://fast-investment.vercel.app',
  'http://localhost:3000'
];

export async function proxy(request: NextRequest) {
  // --- أ) معالجة الحماية من النطاقات الغريبة (CORS Preflight) ---
  const origin = request.headers.get('origin') ?? '';
  if (request.method === 'OPTIONS') {
    const preflightHeaders = {
      'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    return NextResponse.json({}, { headers: preflightHeaders });
  }

  // --- ب) معالجة توجيه اللغات ---
  // نحصل على الاستجابة المبدئية التي تحتوي على توجيه اللغة الصحيح
  let response = intlMiddleware(request);

  // --- ج) معالجة الأمان والصلاحيات (Supabase Auth) ---
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.headers.append('Set-Cookie', `${name}=${value}; Path=${options.path}`)
          )
        },
      },
    }
  );

  // جلب بيانات المستخدم الحالي
  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  // استخراج المسار الفعلي (بدون /ar أو /en) للتحقق الأمني
  const pathWithoutLocale = pathname.replace(/^\/(ar|en|fr)/, '') || '/';
  // الحصول على لغة الرابط الحالي للتوجيه، أو استخدام العربية كافتراضي
  const currentLocale = pathname.split('/')[1] || 'ar'; 
  const safeLocale = ['ar', 'en', 'fr'].includes(currentLocale) ? currentLocale : 'ar';

  // 🛡️ تطبيق نظام حماية المسارات (RBAC)
  if (user) {
    // منع دخول المندوبين العاديين لصفحة الإدارة
    if (pathWithoutLocale.startsWith('/admin')) {
      const { data: agent } = await supabase.from('agents').select('user_roles(role_name)').eq('id', user.id).single();
      
      // معالجة نوع الاستجابة لتجنب أخطاء TypeScript
      const roleData = agent?.user_roles as any;
      const roleName = roleData?.role_name || (Array.isArray(roleData) ? roleData[0]?.role_name : null);

      if (roleName !== 'super_admin') {
         return NextResponse.redirect(new URL(`/${safeLocale}/dashboard`, request.url));
      }
    }
  } else {
    // إذا لم يكن مسجلاً للدخول وحاول فتح صفحات محمية، أرسله لتسجيل الدخول
    const protectedRoutes = ['/dashboard', '/admin', '/sales', '/commissions'];
    const isProtectedRoute = protectedRoutes.some(route => pathWithoutLocale.startsWith(route));
    
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL(`/${safeLocale}/login`, request.url));
    }
  }

  // --- د) إضافة ترويسات الـ CORS للاستجابات العادية ---
  if (allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }

  return response;
}

// تحديد الملفات التي سيمر عليها حارس البوابة (تجاهل ملفات النظام والصور)
export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};