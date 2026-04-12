import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// 1. أضفنا كلمة async هنا
export async function createClient() {
  // 2. أضفنا كلمة await هنا
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // 3. التحديث الجديد من Supabase (استخدام getAll بدلاً من get)
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // يتم تجاهل هذا الخطأ عمداً في الـ Server Components
          }
        },
      },
    }
  )
}