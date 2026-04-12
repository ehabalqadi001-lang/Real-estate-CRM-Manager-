// src/app/dashboard/clients/page.tsx
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Suspense } from 'react'
// استخدام المسار النسبي لحل مشكلة التعرف على الملفات فوراً
import ClientsTable from '../../../components/clients/ClientsTable'
import AddClientButton from '../../../components/clients/AddClientButton'

export default async function ClientsPage() {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )

  // جلب البيانات مع معالجة الخطأ لضمان استقرار التصميم
  const { data: clients, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Supabase Error:', error)
  }

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen" dir="rtl">
      {/* Header Section */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">إدارة العملاء</h1>
          <p className="text-sm text-slate-500 mt-1">عرض وتعديل بيانات العملاء والبحث في السجلات</p>
        </div>
        <AddClientButton />
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        <Suspense fallback={<div className="p-10 text-center text-slate-500">جاري تحميل البيانات...</div>}>
          <ClientsTable initialData={clients || []} />
        </Suspense>
      </div>
    </div>
  )
}