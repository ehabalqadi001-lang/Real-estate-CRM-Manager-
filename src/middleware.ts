import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { redis } from '@/lib/redis'

// 1. إعداد الدرع: 10 طلبات كحد أقصى كل 10 ثوانٍ
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
})

export async function middleware(request: NextRequest) {
  // حماية مسارات الدخول والـ API فقط لعدم إبطاء باقي المنصة
  if (request.nextUrl.pathname.startsWith('/auth') || request.nextUrl.pathname.startsWith('/api')) {
    
    // التقاط الـ IP بأمان (بنية Next.js 15 القياسية)
    // نعتمد هنا على الهيدر مباشرة بعد إزالة request.ip من النظام
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    
    // الفحص عبر رادار Upstash
    const { success, limit, reset, remaining } = await ratelimit.limit(ip)

    if (!success) {
      // رسالة السجل بالإنجليزية لمنع أعطال محرر الأكواد
      console.warn('[Security Radar] Rate limit exceeded. Blocked IP:', ip)
      
      // الضربة المرتدة للمخترق
      return new NextResponse(
        JSON.stringify({ error: 'تم تجاوز الحد الأقصى للطلبات. حقل القوة مفعل، يرجى الانتظار.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          },
        }
      )
    }
  }

  return NextResponse.next()
}

// 2. تفعيل الدرع على هذه المسارات
export const config = {
  matcher: [
    '/auth/:path*',
    '/api/:path*',
  ],
}