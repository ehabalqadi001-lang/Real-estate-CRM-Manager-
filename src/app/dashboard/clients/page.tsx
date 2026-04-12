import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import ClientsTable from '../../../components/clients/ClientsTable'
import AddClientButton from '../../../components/clients/AddClientButton'

export default async function ClientsPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  try {
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error;

    return (
      <div className="p-6 space-y-6 bg-slate-50 min-h-screen" dir="rtl">
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">إدارة العملاء</h1>
            <p className="text-sm text-slate-500 mt-1">عرض وتعديل بيانات العملاء والبحث في السجلات</p>
          </div>
          <AddClientButton />
        </div>

        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <ClientsTable initialData={clients || []} />
        </div>
      </div>
    )
  } catch (e) {
    console.error("Critical Error:", e);
    return (
      <div className="p-10 text-center">
        <h2 className="text-red-600 font-bold">عذراً، تعذر الاتصال بقاعدة البيانات</h2>
        <p className="text-slate-500 text-sm mt-2">يرجى التأكد من وجود جدول "clients" في Supabase</p>
      </div>
    )
  }
}