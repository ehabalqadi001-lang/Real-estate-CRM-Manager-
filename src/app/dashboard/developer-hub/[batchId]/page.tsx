import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Clock, AlertCircle, Server } from 'lucide-react'
import { getI18n } from '@/lib/i18n'

export const metadata = {
  title: 'تفاصيل الدفعة | Developer Hub',
}

export default async function BatchDetailsPage({ params }: { params: { batchId: string } }) {
  const [{ t }, cookieStore] = await Promise.all([getI18n(), cookies()])
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/login')
  }

  const { data: batch, error: batchError } = await supabase
    .from('inventory_ingestion_batches')
    .select('*')
    .eq('id', params.batchId)
    .single()

  if (batchError || !batch) {
    return (
      <div className="p-6 max-w-7xl mx-auto" dir="rtl">
        <div className="bg-red-50 text-red-700 p-4 rounded-xl font-bold">{t('لم يتم العثور على هذه الدفعة أو لا تملك صلاحية الوصول إليها.', 'Batch not found or you do not have access to it.')}</div>
      </div>
    )
  }

  const { data: rows } = await supabase
    .from('inventory_ingestion_rows')
    .select('*')
    .eq('batch_id', params.batchId)
    .order('row_number', { ascending: true })
    .limit(100)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
      {/* Header & Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/developer-hub" className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
              <ArrowRight className="size-5 text-gray-700" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{t('تفاصيل المعالجة', 'Processing Details')}</h1>
          </div>
          <p className="text-gray-500 font-mono text-sm mr-12">{batch.id}</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
          <Server className="size-5 text-indigo-500" />
          <span className="text-sm font-bold text-gray-700">{batch.source_name || batch.source_type}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 font-semibold mb-1">{t('إجمالي الصفوف', 'Total Rows')}</p>
          <p className="text-2xl font-black text-gray-900">{batch.total_rows}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-green-200 shadow-sm">
          <p className="text-sm text-green-600 font-semibold mb-1">{t('تمت المعالجة بنجاح', 'Processed Successfully')}</p>
          <p className="text-2xl font-black text-green-700">{batch.processed_rows}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm">
          <p className="text-sm text-red-600 font-semibold mb-1">{t('فشل المعالجة', 'Failed')}</p>
          <p className="text-2xl font-black text-red-700">{batch.failed_rows}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-yellow-200 shadow-sm">
          <p className="text-sm text-yellow-600 font-semibold mb-1">{t('الحالة الحالية', 'Current Status')}</p>
          <p className="text-lg font-black text-yellow-700 mt-1 uppercase tracking-wide">{batch.status}</p>
        </div>
      </div>

      {/* Rows Details Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="font-bold text-gray-800">{t('سجل الوحدات الواردة (Rows)', 'Incoming Units Log (Rows)')}</h2>
          {batch.total_rows > 100 && (
            <span className="text-xs font-bold text-gray-500 bg-gray-200 px-2 py-1 rounded-md shadow-sm">{t('يعرض أول 100 صف', 'Showing first 100 rows')}</span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-white border-b border-gray-200">
              <tr>
                <th className="p-4 font-semibold text-gray-600 w-16">#</th>
                <th className="p-4 font-semibold text-gray-600">{t('الحالة', 'Status')}</th>
                <th className="p-4 font-semibold text-gray-600">{t('البيانات الواردة (Preview)', 'Incoming Data (Preview)')}</th>
                <th className="p-4 font-semibold text-gray-600">{t('رسالة الخطأ / الملاحظات', 'Error Message / Notes')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows?.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 font-mono text-gray-500">{row.row_number}</td>
                  <td className="p-4">
                    {row.status === 'processed'
                      ? <span className="flex items-center gap-1.5 text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded-md w-fit text-xs font-bold shadow-sm"><CheckCircle2 className="size-4" /> {t('معالج', 'Processed')}</span>
                      : row.status === 'failed'
                      ? <span className="flex items-center gap-1.5 text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-md w-fit text-xs font-bold shadow-sm"><AlertCircle className="size-4" /> {t('فشل', 'Failed')}</span>
                      : <span className="flex items-center gap-1.5 text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-1 rounded-md w-fit text-xs font-bold shadow-sm"><Clock className="size-4 animate-pulse" /> {t('قيد الانتظار', 'Pending')}</span>}
                  </td>
                  <td className="p-4 font-mono text-xs text-gray-600 max-w-xs truncate" dir="ltr">
                    {JSON.stringify(row.raw_payload).substring(0, 60)}...
                  </td>
                  <td className="p-4 text-xs font-semibold text-red-600 max-w-sm break-words">
                    {row.error_message || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
