import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import ClientsTable from '../../../components/clients/ClientsTable'
import AddClientButton from '../../../components/clients/AddClientButton'

export default async function ClientsPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
      },
    }
  )

  // جلب البيانات مع معالجة الخطأ داخلياً لمنع انهيار الصفحة
  let clients: any[] = []
  let fetchError = null

  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      fetchError = error.message
    } else {
      clients = data || []
    }
  } catch (e) {
    fetchError = "تعذر الاتصال بخادم قاعدة البيانات"
  }

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen" dir="rtl">
      {/* Header Section */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-arabic">إدارة العملاء</h1>
          <p className="text-sm text-slate-500 mt-1">قاعدة بيانات المستثمرين والعملاء الحاليين</p>
        </div>
        <AddClientButton />
      </div>

      {/* Main Content Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {fetchError ? (
          <div className="p-20 text-center">
            <div className="bg-red-50 text-red-600 p-4 rounded-xl inline-block mb-4">
              <p className="font-bold">تنبيه بالنظام:</p>
              <p className="text-sm">{fetchError}</p>
            </div>
            <p className="text-slate-500 text-xs">تأكد من وجود جدول 'clients' في Supabase وتعطيل الـ RLS</p>
          </div>
        ) : (
          <ClientsTable initialData={clients} />
        )}
      </div>
    </div>
  )
}