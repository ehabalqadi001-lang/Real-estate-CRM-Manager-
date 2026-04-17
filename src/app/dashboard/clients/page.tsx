import { getClientList } from '@/domains/clients/queries'
import AddClientButton from '../../../components/clients/AddClientButton'
import ClientsTable from '../../../components/clients/ClientsTable'

export default async function ClientsPage() {
  const { clients, error: fetchError } = await getClientList()

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen" dir="rtl">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-arabic">إدارة العملاء</h1>
          <p className="text-sm text-slate-500 mt-1">قاعدة بيانات المستثمرين والعملاء الحاليين</p>
        </div>
        <AddClientButton />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {fetchError ? (
          <div className="p-20 text-center">
            <div className="bg-red-50 text-red-600 p-4 rounded-xl inline-block mb-4">
              <p className="font-bold">تنبيه بالنظام:</p>
              <p className="text-sm">{fetchError}</p>
            </div>
            <p className="text-slate-500 text-xs">تأكد من وجود جدول العملاء وتفعيل سياسات RLS المناسبة في Supabase</p>
          </div>
        ) : (
          <ClientsTable initialData={clients} />
        )}
      </div>
    </div>
  )
}
