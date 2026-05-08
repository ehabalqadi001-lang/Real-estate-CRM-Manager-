'use client'

import { useState } from 'react'
import { payCommission } from '@/app/dashboard/commissions/actions'
import { CheckCircle, Clock, Building, User, Banknote, Users, Star } from 'lucide-react'
import { useI18n } from '@/hooks/use-i18n'

interface Commission {
  id: string
  amount: number
  status: string
  commission_type?: string
  percentage?: number
  deal_value?: number
  created_at: string
  team_members?: { name?: string }
  deals?: { title?: string }
}

export default function CommissionsList({ commissions }: { commissions: Commission[] }) {
  const { t, numLocale } = useI18n()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState('all')

  const TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    agent:     { label: t('وكيل مبيعات', 'Sales Agent'),   color: 'bg-blue-50 text-blue-700 border-blue-200',       icon: User },
    manager:   { label: t('مدير فريق', 'Team Manager'),     color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Users },
    company:   { label: t('حصة الشركة', 'Company Share'),   color: 'bg-slate-100 text-slate-700 border-slate-200',   icon: Building },
    developer: { label: t('مطور عقاري', 'Developer'),       color: 'bg-amber-50 text-amber-700 border-amber-200',    icon: Star },
  }

  const currency = t('ج.م', 'EGP')

  const handlePay = async (id: string) => {
    if (!confirm(t('هل أنت متأكد من تأكيد صرف هذه العمولة؟', 'Are you sure you want to confirm this payout?'))) return
    setLoadingId(id)
    try {
      await payCommission(id)
      window.location.reload()
    } catch (error: unknown) {
      alert(t('خطأ أثناء الصرف: ', 'Error during payout: ') + (error instanceof Error ? error.message : t('خطأ غير معروف', 'Unknown error')))
      setLoadingId(null)
    }
  }

  const filtered = commissions.filter(c =>
    typeFilter === 'all' || (c.commission_type ?? 'agent') === typeFilter
  )

  const byType = Object.keys(TYPE_CONFIG).map(type => ({
    type,
    count: commissions.filter(c => (c.commission_type ?? 'agent') === type).length,
    total: commissions.filter(c => (c.commission_type ?? 'agent') === type).reduce((s, c) => s + Number(c.amount ?? 0), 0),
  })).filter(t => t.count > 0)

  if (!commissions || commissions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-slate-500 shadow-sm mt-6">
        <Banknote size={40} className="mx-auto text-slate-300 mb-4" />
        <h3 className="text-lg font-bold text-slate-800 mb-1">{t('لا توجد عمولات مسجلة بعد', 'No commissions recorded yet')}</h3>
        <p className="text-sm">{t('قم بتسجيل أول عمولة لتبدأ في تتبع المستحقات المالية.', 'Register the first commission to start tracking financial dues.')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 mt-4">
      {byType.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {byType.map(item => {
            const cfg = TYPE_CONFIG[item.type]
            const Icon = cfg.icon
            return (
              <button key={item.type} onClick={() => setTypeFilter(typeFilter === item.type ? 'all' : item.type)}
                className={`border rounded-xl p-4 text-right transition-all hover:shadow-md ${cfg.color} ${typeFilter === item.type ? 'ring-2 ring-offset-1 ring-current' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <Icon size={16} />
                  <span className="text-xs font-bold opacity-70">{item.count} {t('سجل', 'records')}</span>
                </div>
                <div className="text-lg font-black">{(item.total / 1_000).toFixed(0)}K {currency}</div>
                <div className="text-xs font-semibold mt-0.5">{cfg.label}</div>
              </button>
            )
          })}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {[{ key: 'all', label: t('الكل', 'All') }, ...Object.entries(TYPE_CONFIG).map(([k, v]) => ({ key: k, label: v.label }))].map(item => (
          <button key={item.key} onClick={() => setTypeFilter(item.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              typeFilter === item.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}>
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(c => {
          const type = c.commission_type ?? 'agent'
          const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.agent
          const Icon = cfg.icon
          return (
            <div key={c.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-1.5 h-full ${c.status === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'}`} />

              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-black text-xl text-slate-900">
                    {new Intl.NumberFormat(numLocale, { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(c.amount)}
                  </h3>
                  {c.percentage && c.deal_value && (
                    <div className="text-xs text-slate-400 mt-0.5">
                      {c.percentage}% {t('من', 'of')} {(c.deal_value / 1_000).toFixed(0)}K {currency}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {c.status === 'paid'
                    ? <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 border border-emerald-200"><CheckCircle size={11}/> {t('مصروفة', 'Paid')}</span>
                    : <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 border border-amber-200"><Clock size={11}/> {t('معلقة', 'Pending')}</span>
                  }
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${cfg.color}`}>
                    <Icon size={10} /> {cfg.label}
                  </span>
                </div>
              </div>

              <div className="space-y-2 py-3 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <User size={13} className="text-blue-400 flex-shrink-0" />
                  <span className="font-semibold text-slate-700">{c.team_members?.name ?? t('غير محدد', 'N/A')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building size={13} className="text-slate-400 flex-shrink-0" />
                  <span className="text-slate-500 truncate">{c.deals?.title ?? t('غير محدد', 'N/A')}</span>
                </div>
                <div className="text-slate-400">
                  {new Date(c.created_at).toLocaleDateString(numLocale, { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>

              {c.status === 'pending' && (
                <div className="mt-2 pt-3 border-t border-slate-50">
                  <button onClick={() => handlePay(c.id)} disabled={loadingId === c.id}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                    {loadingId === c.id ? t('جاري الاعتماد...', 'Processing...') : <><Banknote size={14}/> {t('اعتماد الصرف', 'Approve Payout')}</>}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
