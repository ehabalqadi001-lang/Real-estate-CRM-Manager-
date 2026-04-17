import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { requireAdmin } from '@/lib/require-role'
import { Percent, Plus, CheckCircle, XCircle } from 'lucide-react'
import AddRuleButton from './AddRuleButton'
import ToggleRuleButton from './ToggleRuleButton'

export const dynamic = 'force-dynamic'

export default async function CommissionRulesPage() {
  await requireAdmin()

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: rules } = await supabase
    .from('commission_rules')
    .select('*')
    .order('created_at', { ascending: false })

  const TYPE_LABELS: Record<string, string> = {
    agent: 'وكيل', manager: 'مدير', company: 'شركة', developer: 'مطور',
  }

  return (
    <div className="p-6 space-y-5" dir="rtl">
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#00C27C] rounded-xl flex items-center justify-center shadow-lg shadow-[#00C27C]/20">
            <Percent size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900">قواعد العمولات</h1>
            <p className="text-xs text-slate-400">{rules?.filter(r => r.is_active).length ?? 0} قاعدة نشطة</p>
          </div>
        </div>
        <AddRuleButton />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {!rules?.length ? (
          <div className="p-16 text-center">
            <Percent size={40} className="mx-auto text-slate-200 mb-3" />
            <p className="font-bold text-slate-600">لا توجد قواعد عمولات بعد</p>
            <p className="text-sm text-slate-400 mt-1">أضف قاعدة لحساب العمولات تلقائياً عند تسجيل الصفقات</p>
          </div>
        ) : (
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['الاسم', 'النوع', 'المشروع', 'النسبة / المبلغ', 'الحالة', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-bold text-slate-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rules.map(rule => (
                <tr key={rule.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900 text-sm">{rule.name}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-100">
                      {TYPE_LABELS[rule.commission_type] ?? rule.commission_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{rule.project_name ?? 'جميع المشاريع'}</td>
                  <td className="px-4 py-3 font-black text-emerald-600 text-sm">
                    {rule.use_percentage
                      ? `${rule.percentage}%`
                      : `${Number(rule.flat_amount).toLocaleString('ar-EG')} ج.م`}
                  </td>
                  <td className="px-4 py-3">
                    {rule.is_active
                      ? <span className="flex items-center gap-1 text-xs text-emerald-600 font-bold"><CheckCircle size={13} /> نشطة</span>
                      : <span className="flex items-center gap-1 text-xs text-slate-400 font-bold"><XCircle size={13} /> معطلة</span>}
                  </td>
                  <td className="px-4 py-3">
                    <ToggleRuleButton id={rule.id} isActive={rule.is_active} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
