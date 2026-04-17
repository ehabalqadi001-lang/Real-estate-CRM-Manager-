import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Users, Plus, Phone, Calendar, TrendingUp, Target, Flame, ArrowUpRight } from 'lucide-react'
import LeadFilters from '@/components/leads/LeadFilters'
import BulkImportButton from '@/components/leads/BulkImportButton'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ query?: string; status?: string }>
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  'Fresh Leads':   { label: 'جديد',     color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-100',   dot: 'bg-blue-500' },
  'fresh':         { label: 'جديد',     color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-100',   dot: 'bg-blue-500' },
  'Contacted':     { label: 'تم التواصل', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-100', dot: 'bg-indigo-500' },
  'Interested':    { label: 'مهتم',     color: 'text-purple-700', bg: 'bg-purple-50 border-purple-100', dot: 'bg-purple-500' },
  'Site Visit':    { label: 'زيارة موقع', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-100', dot: 'bg-orange-500' },
  'Negotiation':   { label: 'تفاوض',    color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-100',  dot: 'bg-amber-500' },
  'Contracted':    { label: 'تعاقد',    color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100', dot: 'bg-emerald-500' },
  'Not Interested':{ label: 'غير مهتم', color: 'text-red-700',    bg: 'bg-red-50 border-red-100',     dot: 'bg-red-500' },
  'Follow Up':     { label: 'متابعة',   color: 'text-teal-700',   bg: 'bg-teal-50 border-teal-100',   dot: 'bg-teal-500' },
}

const TEMP_CONFIG: Record<string, { icon: typeof Flame; color: string }> = {
  hot:  { icon: Flame,      color: 'text-red-500' },
  warm: { icon: TrendingUp, color: 'text-amber-500' },
  cold: { icon: Target,     color: 'text-blue-400' },
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const params = await searchParams
  const searchQuery = params?.query || ''
  const statusFilter = params?.status || ''

  let query = supabase
    .from('leads')
    .select('id, client_name, full_name, phone, status, expected_value, created_at, temperature, source')
    .order('created_at', { ascending: false })

  if (searchQuery) {
    query = query.or(`client_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
  }
  if (statusFilter) {
    query = query.eq('status', statusFilter)
  }

  const { data: leads } = await query

  // KPI counts
  const total      = leads?.length ?? 0
  const fresh      = leads?.filter(l => ['Fresh Leads','fresh'].includes(l.status ?? '')).length ?? 0
  const contracted = leads?.filter(l => l.status === 'Contracted').length ?? 0
  const totalValue = leads?.reduce((s, l) => s + Number(l.expected_value || 0), 0) ?? 0

  const fmt = (n: number) => new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(n)

  return (
    <div className="p-6 space-y-5" dir="rtl">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#00C27C] rounded-xl flex items-center justify-center shadow-lg shadow-[#00C27C]/20">
            <Users size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900">العملاء المحتملون</h1>
            <p className="text-xs text-slate-400">{total} عميل محتمل · قيمة متوقعة {fmt(totalValue)} ج.م</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <BulkImportButton />
          <Link href="/dashboard/leads/new"
            className="bg-[#00C27C] hover:bg-[#009F64] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm transition-all shadow-lg shadow-[#00C27C]/20">
            <Plus size={15} /> إضافة عميل
          </Link>
        </div>
      </div>

      {/* KPI mini row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'إجمالي العملاء', value: total,     color: 'text-blue-600',    bg: 'bg-blue-50' },
          { label: 'عملاء جدد',      value: fresh,     color: 'text-indigo-600',  bg: 'bg-indigo-50' },
          { label: 'تعاقدات',        value: contracted, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'قيمة الخط',      value: `${(totalValue / 1_000_000).toFixed(1)}M ج.م`, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
            <div className={`${k.bg} w-9 h-9 rounded-lg flex items-center justify-center`}>
              <div className={`text-sm font-black ${k.color}`}>{typeof k.value === 'number' ? k.value : ''}</div>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">{k.label}</p>
              <p className={`text-base font-black ${k.color}`}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <LeadFilters />

      {/* Leads table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {(!leads || leads.length === 0) ? (
          <div className="p-16 text-center">
            <Users size={40} className="mx-auto text-slate-200 mb-3" />
            <p className="font-bold text-slate-600">لا يوجد عملاء يطابقون البحث</p>
            <p className="text-sm text-slate-400 mt-1">جرب تغيير الفلاتر أو أضف عملاء جدد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['العميل', 'الهاتف', 'الحالة', 'الحرارة', 'القيمة المتوقعة', 'التاريخ', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-bold text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {leads.map(lead => {
                  const name    = lead.full_name || lead.client_name || 'عميل'
                  const status  = STATUS_CONFIG[lead.status ?? 'Fresh Leads'] ?? STATUS_CONFIG['Fresh Leads']
                  const temp    = TEMP_CONFIG[lead.temperature ?? 'warm'] ?? TEMP_CONFIG.warm
                  const TempIcon = temp.icon
                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00C27C] to-[#009F64] text-white flex items-center justify-center font-black text-sm shrink-0">
                            {name.charAt(0)}
                          </div>
                          <span className="font-semibold text-slate-900 text-sm">{name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {lead.phone
                          ? <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors" dir="ltr">
                              <Phone size={11} className="text-slate-300" /> {lead.phone}
                            </a>
                          : <span className="text-xs text-slate-300">غير مسجل</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${status.bg} ${status.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <TempIcon size={14} className={temp.color} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-emerald-600">
                          {Number(lead.expected_value || 0) > 0
                            ? `${fmt(Number(lead.expected_value))} ج.م`
                            : <span className="text-slate-300 font-normal">—</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Calendar size={11} />
                          {new Date(lead.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/leads/${lead.id}`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00C27C] hover:text-[#009F64] bg-[#00C27C]/10 hover:bg-[#00C27C]/20 px-2.5 py-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                          فتح <ArrowUpRight size={11} />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {leads && leads.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-50 text-xs text-slate-400 font-medium bg-slate-50/50">
            إجمالي {leads.length} نتيجة
          </div>
        )}
      </div>
    </div>
  )
}
