import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import createMiddleware from 'next-intl/middleware';

// 1. إعداد موجه اللغات
const intlMiddleware = createMiddleware({
  locales: ['ar', 'en', 'fr'],
  defaultLocale: 'ar', // اللغة الافتراضية للسوق المصري
  localePrefix: 'as-needed' // لا يضيف /ar إذا كانت هي الافتراضية
});

const allowedOrigins = [
  'https://fast-investment.vercel.app',
  'http://localhost:3000'
];

export async function middleware(request: NextRequest) {
  // --- أ) معالجة الـ CORS ---
  const origin = request.headers.get('origin') ?? '';
  if (request.method === 'OPTIONS') {
    const preflightHeaders = {
      'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    return NextResponse.json({}, { headers: preflightHeaders });
  }

  // --- ب) معالجة اللغات (next-intl) ---
  // نحصل على الـ Response المبدئي الذي يحتوي على توجيه اللغة الصحيح
  let response = intlMiddleware(request);

  // --- ج) معالجة الأمان والصلاحيات (Supabase) ---
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

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  // استخراج المسار الفعلي (بدون /ar أو /en) للتحقق الأمني
  const pathWithoutLocale = pathname.replace(/^\/(ar|en|fr)/, '') || '/';

  // 🛡️ تطبيق الحماية بناءً على المسار المُنظف
  if (user) {
    // ... كود التحقق من الـ AAL2 والـ RBAC الذي كتبناه يوضع هنا مستخدماً pathWithoutLocale ...
    
    // مثال بسيط لمنع دخول /admin
    if (pathWithoutLocale.startsWith('/admin')) {
      const { data: agent } = await supabase.from('agents').select('user_roles(role_name)').eq('id', user.id).single();
      if (agent?.user_roles?.[0]?.role_name !== 'super_admin') {
         return NextResponse.redirect(new URL(`/${request.nextUrl.locale || 'ar'}/dashboard`, request.url));
      }
    }
  } else if (pathWithoutLocale.startsWith('/dashboard') || pathWithoutLocale.startsWith('/admin')) {
    return NextResponse.redirect(new URL(`/${request.nextUrl.locale || 'ar'}/login`, request.url));
  }

  return response;
}

export const config = {
  // تجاوز ملفات النظام والصور، وتطبيق الـ Middleware على كل شيء آخر
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};