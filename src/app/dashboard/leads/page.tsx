import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Users, Briefcase, Plus, ArrowLeft } from 'lucide-react'
import LeadFilters from '@/components/leads/LeadFilters'

export const dynamic = 'force-dynamic'

// تعريف هيكل المتغيرات الخاص بـ Next.js 15
interface PageProps {
  searchParams: Promise<{ query?: string; status?: string }>
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // 1. استخراج فلاتر البحث من الرابط (بطريقة غير متزامنة لـ Next.js 15)
  const params = await searchParams
  const searchQuery = params?.query || ''
  const statusFilter = params?.status || ''

  // 2. بناء الاستعلام الذكي (Dynamic Query)
  let query = supabase
    .from('leads')
    .select('id, client_name, phone, status, expected_value, created_at')
    .order('created_at', { ascending: false })

  // إذا كان هناك بحث بالاسم أو الهاتف
  if (searchQuery) {
    query = query.or(`client_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
  }

  // إذا كان هناك فلتر للحالة
  if (statusFilter) {
    query = query.eq('status', statusFilter)
  }

  // 3. جلب البيانات النهائية بعد تطبيق الفلاتر
  const { data: leads, error } = await query

  return (
    <div className="p-8 space-y-8 min-h-screen bg-slate-50/50" dir="rtl">
      
      {/* الهيدر العلوي */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-[#0A1128] text-white flex items-center justify-center shadow-lg">
            <Users size={28} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">مسار المبيعات وإدارة العملاء</h1>
            <p className="text-sm font-bold text-slate-500 mt-1">البحث والفلترة والمتابعة الشاملة</p>
          </div>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md">
          <Plus size={18} /> إضافة عميل جديد
        </button>
      </div>

      {/* محرك البحث والفلاتر (تمت زراعته هنا) */}
      <LeadFilters />

      {/* عرض نتائج العملاء */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {(!leads || leads.length === 0) ? (
          <div className="p-12 text-center text-slate-500 font-bold flex flex-col items-center justify-center">
            <Briefcase size={48} className="text-slate-300 mb-4" />
            لا يوجد عملاء يطابقون معايير البحث الحالية.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold border-b border-slate-100">
                <tr>
                  <th className="p-4">اسم العميل</th>
                  <th className="p-4">رقم الهاتف</th>
                  <th className="p-4">حالة التفاوض</th>
                  <th className="p-4">قيمة الصفقة المتوقعة</th>
                  <th className="p-4">تاريخ الإضافة</th>
                  <th className="p-4">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead: any) => (
                  <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-4 font-black text-slate-900">{lead.client_name}</td>
                    <td className="p-4 text-sm font-bold text-slate-600 font-mono" dir="ltr">{lead.phone || 'غير مسجل'}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-black rounded-lg border border-slate-200 shadow-sm">
                        {lead.status || 'Fresh Leads'}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-black text-emerald-600">{Number(lead.expected_value || 0).toLocaleString()} ج.م</td>
                    <td className="p-4 text-xs font-bold text-slate-400">
                      {new Date(lead.created_at).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="p-4">
                      <Link href={`/dashboard/leads/${lead.id}`} className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-black transition-all">
                        فتح السجل <ArrowLeft size={14}/>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}