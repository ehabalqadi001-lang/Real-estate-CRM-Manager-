import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';

type LeadInsert = {
  client_name: string;
  phone: string;
  status: 'new' | 'follow_up' | 'closed';
  project_interest: string;
  lead_type?: 'B2B' | 'B2C';
};

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
  }

  if (!anonKey) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return { url, anonKey };
}

async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // In some server contexts, cookie writes may not be available.
        }
      },
    },
  });
}

function validateLeadPayload(body: unknown): {
  success: boolean;
  data?: LeadInsert;
  error?: string;
} {
  if (!body || typeof body !== 'object') {
    return { success: false, error: 'بيانات الطلب غير صالحة.' };
  }

  const raw = body as Record<string, unknown>;

  const client_name =
    typeof raw.client_name === 'string' ? raw.client_name.trim() : '';
  const phone = typeof raw.phone === 'string' ? raw.phone.trim() : '';
  const status = typeof raw.status === 'string' ? raw.status.trim() : '';
  const project_interest =
    typeof raw.project_interest === 'string' ? raw.project_interest.trim() : '';
  const lead_type =
    typeof raw.lead_type === 'string' ? raw.lead_type.trim() : 'B2C';

  const allowedStatuses = ['new', 'follow_up', 'closed'];
  const allowedTypes = ['B2B', 'B2C'];

  if (!client_name) {
    return { success: false, error: 'حقل اسم العميل مطلوب.' };
  }

  if (!phone) {
    return { success: false, error: 'حقل الهاتف مطلوب.' };
  }

  if (!allowedStatuses.includes(status)) {
    return { success: false, error: 'قيمة الحالة غير صحيحة.' };
  }

  if (!project_interest) {
    return { success: false, error: 'حقل الاهتمام بالمشروع مطلوب.' };
  }

  if (!allowedTypes.includes(lead_type)) {
    return { success: false, error: 'نوع العميل غير صحيح.' };
  }

  return {
    success: true,
    data: {
      client_name,
      phone,
      status: status as LeadInsert['status'],
      project_interest,
      lead_type: lead_type as LeadInsert['lead_type'],
    },
  };
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase GET /api/leads error:', error);

      return NextResponse.json(
        {
          error: 'تعذر جلب بيانات العملاء.',
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: data ?? [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected GET /api/leads error:', error);

    return NextResponse.json(
      {
        error: 'حدث خطأ غير متوقع أثناء جلب العملاء.',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = validateLeadPayload(body);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: validation.error ?? 'بيانات الإدخال غير صحيحة.' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from('leads')
      .insert(validation.data)
      .select()
      .single();

    if (error) {
      console.error('Supabase POST /api/leads error:', error);

      return NextResponse.json(
        {
          error: 'تعذر إضافة العميل الجديد.',
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'تمت إضافة العميل بنجاح.',
        data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected POST /api/leads error:', error);

    return NextResponse.json(
      {
        error: 'حدث خطأ غير متوقع أثناء إضافة العميل.',
      },
      { status: 500 }
    );
  }
}