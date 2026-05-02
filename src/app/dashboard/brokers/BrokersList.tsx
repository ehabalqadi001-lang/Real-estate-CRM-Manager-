'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Phone, Mail, Star, CheckCircle, XCircle, Search, ExternalLink } from 'lucide-react'

interface Broker {
  id: string
  full_name: string
  phone?: string
  email?: string
  tier: string
  status: string
  total_sales: number
  total_deals: number
  commission_rate: number
  join_date?: string
  specialties?: string[]
  profile_image?: string
}

interface Props { brokers: Broker[] }

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  platinum: { label: 'بلاتينيوم', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', dot: 'bg-purple-500' },
  gold:     { label: 'ذهبي',      color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200',  dot: 'bg-amber-500' },
  silver:   { label: 'فضي',       color: 'text-slate-600',  bg: 'bg-slate-100', border: 'border-slate-200',  dot: 'bg-slate-400' },
  bronze:   { label: 'برونزي',    color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', dot: 'bg-orange-400' },
}

const fmt = (n: number) =>
  new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(n)

export default function BrokersList({ brokers }: Props) {
  const [search, setSearch]     = useState('')
  const [tierFilter, setTierFilter] = useState('all')
  const [statusFilter, setStatus]   = useState('all')
  const [view, setView]         = useState<'grid' | 'table'>('grid')

  const filtered = brokers.filter(b => {
    const matchSearch = b.full_name.includes(search) || (b.phone ?? '').includes(search)
    const matchTier   = tierFilter === 'all' || b.tier === tierFilter
    const matchStatus = statusFilter === 'all' || b.status === statusFilter
    return matchSearch && matchTier && matchStatus
  })

  if (brokers.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-sm">
        <Star size={44} className="mx-auto text-slate-200 mb-4" />
        <h3 className="text-lg font-bold text-slate-700 mb-1">لا يوجد وسطاء مسجلون بعد</h3>
        <p className="text-sm text-slate-400">أضف أول وسيط عقاري لبدء تتبع الأداء</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text" placeholder="بحث بالاسم أو الهاتف..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', ...Object.keys(TIER_CONFIG)].map(t => (
              <button key={t} onClick={() => setTierFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  tierFilter === t ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                {t === 'all' ? 'الكل' : TIER_CONFIG[t]?.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {['all', 'active', 'inactive'].map(s => (
              <button key={s} onClick={() => setStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  statusFilter === s ? 'bg-[#00C27C] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                {s === 'all' ? 'الحالة' : s === 'active' ? 'نشط' : 'غير نشط'}
              </button>
            ))}
          </div>
          <div className="mr-auto flex gap-1 bg-slate-100 rounded-lg p-1">
            <button onClick={() => setView('grid')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${view === 'grid' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>
              شبكة
            </button>
            <button onClick={() => setView('table')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${view === 'table' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>
              قائمة
            </button>
          </div>
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-slate-400 px-1 font-semibold">{filtered.length} وسيط</p>

      {view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(broker => {
            const tier = TIER_CONFIG[broker.tier] ?? TIER_CONFIG.bronze
            return (
              <div key={broker.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                {/* Tier header bar */}
                <div className={`h-1 ${tier.dot}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black text-base shadow">
                        {broker.full_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{broker.full_name}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tier.bg} ${tier.color} ${tier.border} border`}>
                          <Star size={8} className="inline ml-0.5" />
                          {tier.label}
                        </span>
                      </div>
                    </div>
                    {broker.status === 'active'
                      ? <CheckCircle size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                      : <XCircle size={16} className="text-red-400 mt-0.5 shrink-0" />}
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                    <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                      <p className="text-xs font-black text-slate-900">{broker.total_deals}</p>
                      <p className="text-[9px] text-slate-400">صفقة</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                      <p className="text-xs font-black text-slate-900">{(Number(broker.total_sales) / 1_000_000).toFixed(1)}M</p>
                      <p className="text-[9px] text-slate-400">مبيعات</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                      <p className="text-xs font-black text-slate-900">{broker.commission_rate}%</p>
                      <p className="text-[9px] text-slate-400">عمولة</p>
                    </div>
                  </div>

                  {/* Contact info */}
                  <div className="space-y-1.5">
                    {broker.phone && (
                      <a href={`tel:${broker.phone}`}
                        className="flex items-center gap-2 text-xs text-slate-500 hover:text-blue-600 transition-colors">
                        <Phone size={12} className="text-slate-300" />
                        <span dir="ltr">{broker.phone}</span>
                      </a>
                    )}
                    {broker.email && (
                      <a href={`mailto:${broker.email}`}
                        className="flex items-center gap-2 text-xs text-slate-500 hover:text-blue-600 transition-colors truncate">
                        <Mail size={12} className="text-slate-300" />
                        <span className="truncate">{broker.email}</span>
                      </a>
                    )}
                  </div>

                  {/* Specialties */}
                  {broker.specialties && broker.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {broker.specialties.slice(0, 3).map(s => (
                        <span key={s} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  <Link href={`/dashboard/brokers/${broker.id}`}
                    className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-1.5 text-xs font-bold text-slate-500 transition hover:border-[#00C27C]/40 hover:bg-[#00C27C]/5 hover:text-[#00C27C]">
                    <ExternalLink size={12} /> عرض الملف الكامل
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto w-full rounded-xl"><table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['الوسيط', 'المستوى', 'الحالة', 'الصفقات', 'المبيعات', 'العمولة', 'التواصل'].map(h => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-bold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(broker => {
                const tier = TIER_CONFIG[broker.tier] ?? TIER_CONFIG.bronze
                return (
                  <tr key={broker.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black text-sm">
                          {broker.full_name.charAt(0)}
                        </div>
                        <span className="font-semibold text-slate-800">{broker.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tier.bg} ${tier.color} ${tier.border} border`}>
                        {tier.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {broker.status === 'active'
                        ? <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs"><CheckCircle size={12} /> نشط</span>
                        : <span className="flex items-center gap-1 text-red-500 font-bold text-xs"><XCircle size={12} /> غير نشط</span>}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800">{broker.total_deals}</td>
                    <td className="px-4 py-3 font-bold text-slate-800 text-xs">{fmt(Number(broker.total_sales))}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-600">{broker.commission_rate}%</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {broker.phone && (
                          <a href={`tel:${broker.phone}`} className="p-1.5 bg-slate-100 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors text-slate-500">
                            <Phone size={12} />
                          </a>
                        )}
                        {broker.email && (
                          <a href={`mailto:${broker.email}`} className="p-1.5 bg-slate-100 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors text-slate-500">
                            <Mail size={12} />
                          </a>
                        )}
                        <Link href={`/dashboard/brokers/${broker.id}`}
                          className="p-1.5 bg-slate-100 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 transition-colors text-slate-500"
                          title="عرض الملف الكامل">
                          <ExternalLink size={12} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table></div>
        </div>
      )}
    </div>
  )
}
