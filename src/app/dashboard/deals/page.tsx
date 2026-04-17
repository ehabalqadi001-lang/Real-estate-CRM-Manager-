import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import AddDealButton from '@/components/deals/AddDealButton'
import { Briefcase, DollarSign, Calendar, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 30

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function DealsPage({ searchParams }: PageProps) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const params = await searchParams
  const page = Math.max(1, parseInt(params?.page || '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

  const { data: { user } } = await supabase.auth.getUser()

  // تحديد هوية الشركة
  const { data: profile } = await supabase.from('profiles').select('company_id, role').eq('id', user?.id).single()
  const targetCompanyId = profile?.company_id || user?.id

  // جلب العملاء النشطين (لإغلاق صفقاتهم)
  const { data: activeLeads } = await supabase.from('leads').select('id, client_name').eq('company_id', targetCompanyId).neq('status', 'Won')
  
  // جلب الوكلاء
  const { data: teamMembers } = await supabase.from('profiles').select('id, full_name').eq('company_id', targetCompanyId).eq('role', 'agent')

  // جلب الصفقات المسجلة
  const { data: deals, count: totalDealsCount } = await supabase.from('deals')
    .select('*, leads(client_name), profiles!deals_agent_id_fkey(full_name), commissions(amount, status)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  return (
    <div className="p-8 space-y-8 min-h-screen bg-slate-50/50" dir="rtl">
      
      {/* الهيدر العلوي */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900">إدارة الصفقات والعمولات</h1>
          <p className="text-sm font-bold text-slate-500 mt-1">توثيق العقود ومتابعة المستحقات المالية للوكلاء</p>
        </div>
        <AddDealButton activeLeads={activeLeads || []} teamMembers={teamMembers || []} />
      </div>

      {/* الرادار: عرض الصفقات */}
      {(!deals || deals.length === 0) ? (
        <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center shadow-sm">
          <Briefcase size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-black text-slate-800 mb-2">لا توجد صفقات موثقة حتى الآن</h3>
          <p className="text-slate-500 font-medium">اضغط على زر &ldquo;توثيق صفقة جديدة&rdquo; لتحويل عميل إلى مشتري فعلي.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deals.map((deal) => (
            <div key={deal.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group">
              <div className="p-5 border-b border-slate-100 bg-slate-900 text-white flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 mb-1">اسم العميل (المشتري)</p>
                  <h3 className="font-black text-lg">{deal.leads?.client_name || 'عميل غير معروف'}</h3>
                </div>
                <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md">
                  <CheckCircle2 size={14}/> تم التوقيع
                </span>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><DollarSign size={12}/> قيمة العقد</p>
                    <p className="text-lg font-black text-slate-800">{Number(deal.final_price).toLocaleString()} ج.م</p>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 justify-end"><Calendar size={12}/> التاريخ</p>
                    <p className="text-sm font-bold text-slate-700">{new Date(deal.created_at).toLocaleDateString('ar-EG')}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 bg-slate-50 -mx-5 px-5 pb-1">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-slate-600">الوكيل: <span className="font-black text-blue-600">{deal.profiles?.full_name}</span></p>
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-emerald-600">العمولة المستحقة</p>
                      <p className="text-md font-black text-emerald-600">{Number(deal.commissions?.[0]?.amount || 0).toLocaleString()} ج.م</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {(totalDealsCount ?? 0) > PAGE_SIZE && (
        <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-xs text-slate-400 font-medium">
            {from + 1}–{Math.min(to + 1, totalDealsCount ?? 0)} من {totalDealsCount} صفقة
          </span>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link href={`?page=${page - 1}`}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                <ChevronRight size={13} /> السابق
              </Link>
            )}
            <span className="text-xs font-bold text-slate-500 px-2">
              {page} / {Math.ceil((totalDealsCount ?? 0) / PAGE_SIZE)}
            </span>
            {page < Math.ceil((totalDealsCount ?? 0) / PAGE_SIZE) && (
              <Link href={`?page=${page + 1}`}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#00C27C] text-white hover:bg-[#009F64] transition-colors">
                التالي <ChevronLeft size={13} />
              </Link>
            )}
          </div>
        </div>
      )}

    </div>
  )
}