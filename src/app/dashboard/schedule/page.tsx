import { getI18n } from '@/lib/i18n'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { CalendarClock, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface Installment {
  id: string
  deal_id: string
  due_date: string
  amount: number
  status: string
  deals?: { compound?: string; buyer_name?: string; buyer_phone?: string } | null
}

export default async function PaymentSchedulePage() {
  const { t, numLocale } = await getI18n()
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const today = new Date()
  const thirtyDaysLater = new Date(today)
  thirtyDaysLater.setDate(today.getDate() + 30)

  const { data: upcoming } = await supabase
    .from('installments')
    .select('*, deals(compound, buyer_name, buyer_phone)')
    .gte('due_date', today.toISOString().split('T')[0])
    .lte('due_date', thirtyDaysLater.toISOString().split('T')[0])
    .eq('status', 'pending')
    .order('due_date', { ascending: true })

  const { data: overdue } = await supabase
    .from('installments')
    .select('*, deals(compound, buyer_name, buyer_phone)')
    .lt('due_date', today.toISOString().split('T')[0])
    .eq('status', 'pending')
    .order('due_date', { ascending: false })
    .limit(30)

  const totalUpcoming = (upcoming ?? []).reduce((s, i) => s + Number(i.amount ?? 0), 0)
  const totalOverdue  = (overdue  ?? []).reduce((s, i) => s + Number(i.amount ?? 0), 0)

  const fmt = (n: number) => new Intl.NumberFormat(numLocale, { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(n)

  function daysDiff(dateStr: string) {
    const diff = Math.round((new Date(dateStr).getTime() - today.getTime()) / 86400000)
    return diff
  }

  function overdayDiff(dateStr: string) {
    return Math.round((today.getTime() - new Date(dateStr).getTime()) / 86400000)
  }

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <CalendarClock size={20} className="text-blue-600" /> {t('جدول الأقساط والمدفوعات', 'Payment Schedule')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{t('الأقساط القادمة خلال 30 يوم + المتأخرات', 'Upcoming installments (30 days) + overdue')}</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('أقساط قادمة (30 يوم)', 'Upcoming (30 days)'), value: (upcoming ?? []).length, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: Clock },
          { label: t('إجمالي القادمة', 'Upcoming Total'), value: `${(totalUpcoming / 1_000_000).toFixed(2)}M`, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: CheckCircle },
          { label: t('أقساط متأخرة', 'Overdue'), value: (overdue ?? []).length, color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: AlertTriangle },
          { label: t('إجمالي المتأخرات', 'Overdue Total'), value: `${(totalOverdue / 1_000_000).toFixed(2)}M`, color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: AlertTriangle },
        ].map(k => (
          <div key={k.label} className={`border rounded-2xl p-4 ${k.bg}`}>
            <k.icon size={16} className={k.color} />
            <div className={`text-2xl font-black mt-2 ${k.color}`}>{k.value}</div>
            <div className="text-xs text-slate-500 mt-0.5 font-medium">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Overdue */}
      {(overdue ?? []).length > 0 && (
        <div className="bg-white rounded-2xl border border-red-200 overflow-hidden shadow-sm">
          <div className="bg-red-50 px-5 py-3 border-b border-red-200 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-600" />
            <h2 className="font-black text-red-800">{t('أقساط متأخرة', 'Overdue Installments')} ({(overdue ?? []).length})</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {(overdue as Installment[]).map(inst => {
              const deal = inst.deals
              return (
                <div key={inst.id} className="px-5 py-4 flex items-center justify-between hover:bg-red-50/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{deal?.compound ?? 'صفقة'} — {deal?.buyer_name ?? 'العميل'}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {overdayDiff(inst.due_date)} {t('يوم متأخر', 'days overdue')} |
                        {new Date(inst.due_date).toLocaleDateString(numLocale, { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-black text-red-600 text-sm">{fmt(Number(inst.amount))}</p>
                    {deal?.buyer_phone && (
                      <Link href={`https://wa.me/2${deal.buyer_phone.replace(/^0/, '')}`} target="_blank"
                        className="text-[10px] text-emerald-600 font-bold hover:underline">
                        {t('تواصل واتساب', 'WhatsApp')} ←
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Upcoming */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <CalendarClock size={16} className="text-blue-600" />
          <h2 className="font-black text-slate-800">{t('الأقساط القادمة — 30 يوماً', 'Upcoming — 30 Days')} ({(upcoming ?? []).length})</h2>
        </div>
        {(upcoming ?? []).length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <CheckCircle size={32} className="mx-auto mb-2 opacity-30" />
            <p className="font-bold">{t('لا توجد أقساط مستحقة خلال 30 يوماً', 'No installments due in the next 30 days')}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {(upcoming as Installment[]).map(inst => {
              const deal = inst.deals
              const days = daysDiff(inst.due_date)
              const urgency = days <= 3 ? 'text-red-600 bg-red-50' : days <= 7 ? 'text-amber-600 bg-amber-50' : 'text-blue-600 bg-blue-50'
              return (
                <div key={inst.id} className="px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className={`text-xs font-black px-2 py-1 rounded-lg ${urgency} flex-shrink-0`}>
                      {days === 0 ? t('اليوم', 'Today') : `${days}${t('ي', 'd')}`}
                    </span>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{deal?.compound ?? 'صفقة'} — {deal?.buyer_name ?? 'العميل'}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(inst.due_date).toLocaleDateString(numLocale, { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-black text-slate-900 text-sm">{fmt(Number(inst.amount))}</p>
                    {deal?.buyer_phone && (
                      <Link href={`https://wa.me/2${deal.buyer_phone.replace(/^0/, '')}`} target="_blank"
                        className="text-[10px] text-emerald-600 font-bold hover:underline">
                        {t('تذكير واتساب', 'WhatsApp Reminder')} ←
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
