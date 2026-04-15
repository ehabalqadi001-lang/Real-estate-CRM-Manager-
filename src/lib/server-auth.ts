import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// دالة مركزية لحماية أي API Endpoint أو Server Action
export async function requireAuth(allowedRoles?: string[]) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() { /* يتم تجاهلها في مسارات الـ API */ },
      },
    }
  );

  // 1. التحقق من وجود جلسة صالحة (مُصادقة)
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { authorized: false, error: 'Unauthorized: No active session', status: 401 };
  }

  // 2. التحقق من الصلاحيات (Authorization) إذا تم تمرير مصفوفة أدوار
  if (allowedRoles && allowedRoles.length > 0) {
    const { data: agent } = await supabase
      .from('agents')
      .select('user_roles(role_name)')
      .eq('id', user.id)
      .single();

    const userRole = agent?.user_roles?.[0]?.role_name;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return { authorized: false, error: 'Forbidden: Insufficient privileges', status: 403 };
    }
    
    return { authorized: true, user, role: userRole, supabase };
  }

  return { authorized: true, user, role: 'agent', supabase };
}