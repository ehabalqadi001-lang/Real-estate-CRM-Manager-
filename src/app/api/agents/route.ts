import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server-auth';
import { checkRateLimit } from '@/lib/rate-limit'; // ← 1. استدعاء الـ Rate Limiter

export async function POST(request: Request) {
  // 1. استدعاء الحارس الأمني (يسمح للمديرين فقط)
  const auth = await requireAuth(['super_admin', 'company_admin']);
  
  // 2. إذا لم يكن مصرحاً له، نرد فوراً قبل استهلاك أي موارد أو قراءة الـ Body
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    // 3. قراءة البيانات
    const body = await request.json();
    const { email, full_name, role_id, company_id } = body;

    // 4. تنفيذ العملية (نحن متأكدون الآن أن من يقوم بها هو مدير)
    if (!auth.supabase) {
      return NextResponse.json({ error: 'Supabase client not available' }, { status: 500 });
    }

    const { data, error } = await auth.supabase
      .from('agents')
      .insert([{ email, full_name, role_id, company_id }])
      .select();

    if (error) throw error;

    // 5. تسجيل حركة المدير في الصندوق الأسود (Audit Log)
    if (auth.user) {
      await auth.supabase.from('audit_logs').insert([{
        user_id: auth.user.id,
        action_type: 'CREATE_AGENT',
        entity_type: 'agents',
        details: { email_created: email }
      }]);
    }

    return NextResponse.json({ success: true, data }, { status: 201 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}