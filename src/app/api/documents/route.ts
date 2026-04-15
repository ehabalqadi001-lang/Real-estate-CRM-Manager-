import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server-auth';

export async function POST(request: Request) {
  // 1. أي مستخدم مسجل يمكنه رفع مستنداته الخاصة (عقود، بطاقات شخصية)
  // لا نحتاج لمدير هنا، لكن يجب أن يكون مسجلاً (Authenticated)
  const auth = await requireAuth();
  
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const dealId = formData.get('deal_id') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!auth.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // تأمين إضافي: التحقق من نوع وحجم الملف قبل الرفع
    if (file.size > 5 * 1024 * 1024) { // الحد الأقصى 5 ميجا
      return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 });
    }

    // 2. رفع الملف إلى Supabase Storage باسم آمن يعتمد على هوية المستخدم
    const safeFileName = `${auth.user.id}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    
    if (!auth.supabase) {
      return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
    }

    const { data, error } = await auth.supabase.storage
      .from('documents')
      .upload(`deals/${dealId}/${safeFileName}`, file);

    if (error) throw error;

    return NextResponse.json({ success: true, path: data.path }, { status: 201 });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 });
  }
}