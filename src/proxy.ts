import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';

const intlMiddleware = createMiddleware({
  locales: ['en', 'ar'],
  defaultLocale: 'ar',
  localeDetection: true
});

export default function middleware(request: NextRequest) {
  // 1. تشغيل نظام اللغات
  const response = intlMiddleware(request);
  
  // 2. إذا حاول الدخول على الرابط الرئيسي مباشرة، وجهه للـ dashboard بالعربي
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/ar/dashboard', request.url));
  }

  return response;
}

export const config = {
  // هذا السطر يخبر Next.js بتشغيل الميدل وير على كل الصفحات ما عدا ملفات النظام
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
};