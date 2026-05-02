import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Sparkles, User, Building2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { matchLeadToUnits } from './matching-engine'
import { getI18n } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ lead_id?: string }>
}

export default async function MatchingPage({ searchParams }: PageProps) {
  const { t, numLocale } = await getI18n()
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { lead_id } = await searchParams

  const [{ data: leads }, { data: units }] = await Promise.all([
    supabase.from('leads')
      .select('id, client_name, full_name, expected_value, status, source, temperature')
      .in('status', ['Interested', 'Contacted', 'Negotiation'])
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('inventory')
      .select('id, unit_name, project_name, unit_type, price, status, floor, area')
      .in('status', ['available', 'Available'])
      .order('price'),
  ])

  const selectedLead = lead_id ? leads?.find(l => l.id === lead_id) : null
  const matches = selectedLead && units ? matchLeadToUnits(selectedLead, units) : []

  const fmt = (n: number) => new Intl.NumberFormat(numLocale, { maximumFractionDigits: 0 }).format(n)

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="w-10 h-10 bg-gradient-to-br from-[#00C27C] to-[#009F64] rounded-xl flex items-center justify-center shadow-lg shadow-[#00C27C]/20">
          <Sparkles size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-black text-slate-900">{t('مطابقة المشترين بالوحدات', 'Lead-to-Unit Matching')}</h1>
          <p className="text-xs text-slate-400">{t('اختر عميلاً لعرض أفضل الوحدات المناسبة له تلقائياً', 'Select a lead to automatically show the best matching units')}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">

        {/* Lead selector */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h2 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
            <User size={15} className="text-[#00C27C]" /> {t('اختر العميل', 'Select Lead')}
          </h2>
          <div className="space-y-2 max-h-[480px] overflow-y-auto">
            {(leads ?? []).map(lead => {
              const name = lead.full_name || lead.client_name || 'عميل'
              const isSelected = lead_id === lead.id
              return (
                <Link
                  key={lead.id}
                  href={`?lead_id=${lead.id}`}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-[#00C27C]/10 border-[#00C27C]/30 text-[#00C27C]'
                      : 'border-slate-100 hover:border-[#00C27C]/20 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <p className="font-bold text-sm">{name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {lead.status} · {t('ميزانية', 'Budget')} {fmt(Number(lead.expected_value || 0))} {t('ج.م', 'EGP')}
                    </p>
                  </div>
                  {isSelected && <ArrowLeft size={14} className="text-[#00C27C]" />}
                </Link>
              )
            })}
            {!leads?.length && (
              <p className="text-sm text-slate-400 text-center py-8">{t('لا توجد عملاء مهتمون في الوقت الحالي', 'No interested leads at the moment')}</p>
            )}
          </div>
        </div>

        {/* Matches */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h2 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
            <Building2 size={15} className="text-[#00C27C]" />
            {selectedLead
              ? `${t('أفضل وحدات لـ', 'Best units for')} ${selectedLead.full_name || selectedLead.client_name}`
              : t('نتائج المطابقة', 'Matching Results')}
          </h2>

          {!selectedLead ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-300">
              <Sparkles size={40} className="mb-3" />
              <p className="text-sm font-bold text-slate-400">{t('اختر عميلاً من القائمة لبدء المطابقة', 'Select a lead from the list to start matching')}</p>
            </div>
          ) : matches.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-300">
              <Building2 size={40} className="mb-3" />
              <p className="text-sm font-bold text-slate-400">{t('لا توجد وحدات متاحة مناسبة حالياً', 'No suitable available units at the moment')}</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[480px] overflow-y-auto">
              {matches.map(({ unit, score, reasons }) => (
                <div key={unit.id} className="border border-slate-100 rounded-xl p-4 hover:border-[#00C27C]/30 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-black text-slate-900 text-sm">{unit.project_name}</p>
                      <p className="text-xs text-slate-500">{unit.unit_type} {unit.area ? `· ${unit.area}${t('م²', 'sqm')}` : ''} {unit.floor ? `· ${t('دور', 'Fl.')} ${unit.floor}` : ''}</p>
                    </div>
                    <div className="text-left">
                      <div className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                        score >= 80 ? 'bg-emerald-50 text-emerald-700' :
                        score >= 60 ? 'bg-amber-50 text-amber-700' :
                        'bg-slate-50 text-slate-600'
                      }`}>
                        {score}% {t('تطابق', 'match')}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm font-black text-[#00C27C]">{fmt(Number(unit.price))} {t('ج.م', 'EGP')}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {reasons.map(r => (
                      <span key={r} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">{r}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
