'use client'

import { useState } from 'react'
import { payCommission } from '@/app/dashboard/commissions/actions'
import { CheckCircle, Clock, Building, User, Banknote, Users, Star } from 'lucide-react'

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

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  agent:     { label: 'وكيل مبيعات',   color: 'bg-blue-50 text-blue-700 border-blue-200',     icon: User },
  manager:   { label: 'مدير فريق',      color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Users },
  company:   { label: 'حصة الشركة',     color: 'bg-slate-100 text-slate-700 border-slate-200',   icon: Building },
  developer: { label: 'مطور عقاري',     color: 'bg-amber-50 text-amber-700 border-amber-200',    icon: Star },
}

export default function CommissionsList({ commissions }: { commissions: Commission[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState('all')

  const handlePay = async (id: string) => {
    if (!confirm('هل أنت متأكد من تأكيد صرف هذه العمولة؟')) return
    setLoadingId(id)
    try {
      await payCommission(id)
      window.location.reload()
    } catch (error: unknown) {
      alert('خطأ أثناء الصرف: ' + (error instanceof Error ? error.message : 'خطأ غير معروف'))
      setLoadingId(null)
    }
  }

  const filtered = commissions.filter(c =>
    typeFilter === 'all' || (c.commission_type ?? 'agent') === typeFilter
  )

  // حساب إجماليات حسب النوع
  const byType = Object.keys(TYPE_CONFIG).map(type => ({
    type,
    count: commissions.filter(c => (c.commission_type ?? 'agent') === type).length,
    total: commissions.filter(c => (c.commission_type ?? 'agent') === type).reduce((s, c) => s + Number(c.amount ?? 0), 0),
  })).filter(t => t.count > 0)

  if (!commissions || commissions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-slate-500 shadow-sm mt-6">
        <Banknote size={40} className="mx-auto text-slate-300 mb-4" />
        <h3 className="text-lg font-bold text-slate-800 mb-1">لا توجد عمولات مسجلة بعد</h3>
        <p className="text-sm">قم بتسجيل أول عمولة لتبدأ في تتبع المستحقات المالية.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Breakdown by type */}
      {byType.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {byType.map(t => {
            const cfg = TYPE_CONFIG[t.type]
            const Icon = cfg.icon
            return (
              <button key={t.type} onClick={() => setTypeFilter(typeFilter === t.type ? 'all' : t.type)}
                className={`border rounded-xl p-4 text-right transition-all hover:shadow-md ${cfg.color} ${typeFilter === t.type ? 'ring-2 ring-offset-1 ring-current' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <Icon size={16} />
                  <span className="text-xs font-bold opacity-70">{t.count} سجل</span>
                </div>
                <div className="text-lg font-black">{(t.total / 1_000).toFixed(0)}K ج.م</div>
                <div className="text-xs font-semibold mt-0.5">{cfg.label}</div>
              </button>
            )
          })}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[{ key: 'all', label: 'الكل' }, ...Object.entries(TYPE_CONFIG).map(([k, v]) => ({ key: k, label: v.label }))].map(t => (
          <button key={t.key} onClick={() => setTypeFilter(t.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              typeFilter === t.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Cards */}
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
                    {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(c.amount)}
                  </h3>
                  {c.percentage && c.deal_value && (
                    <div className="text-xs text-slate-400 mt-0.5">
                      {c.percentage}% من {(c.deal_value / 1_000).toFixed(0)}K ج.م
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {c.status === 'paid'
                    ? <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 border border-emerald-200"><CheckCircle size={11}/> مصروفة</span>
                    : <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 border border-amber-200"><Clock size={11}/> معلقة</span>
                  }
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${cfg.color}`}>
                    <Icon size={10} /> {cfg.label}
                  </span>
                </div>
              </div>

              <div className="space-y-2 py-3 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <User size={13} className="text-blue-400 flex-shrink-0" />
                  <span className="font-semibold text-slate-700">{c.team_members?.name ?? 'غير محدد'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building size={13} className="text-slate-400 flex-shrink-0" />
                  <span className="text-slate-500 truncate">{c.deals?.title ?? 'غير محدد'}</span>
                </div>
                <div className="text-slate-400">
                  {new Date(c.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>

              {c.status === 'pending' && (
                <div className="mt-2 pt-3 border-t border-slate-50">
                  <button onClick={() => handlePay(c.id)} disabled={loadingId === c.id}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                    {loadingId === c.id ? 'جاري الاعتماد...' : <><Banknote size={14}/> اعتماد الصرف</>}
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
