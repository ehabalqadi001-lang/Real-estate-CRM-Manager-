"use client"
import { useI18n } from '@/hooks/use-i18n'
/* eslint-disable react-hooks/set-state-in-effect -- Legacy client-loaded developers page; will move to server query + client form island. */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Building2, Plus, Search, Settings, AlertTriangle, X, TrendingUp, MapPin } from 'lucide-react'

interface Developer {
  id: string; name: string; region: string; class_grade: string
  license_number: string; payment_days: number; contract_end_date: string | null
}
interface CommissionRule { id: string; developer_id: string; percentage: number }
interface EnrichedDeveloper extends Developer {
  dealsCount: number; totalVolume: number; commission: number
  contractWarning: boolean; daysToExpiry: number | null
}

const GRADE_STYLE: Record<string, { label: string; color: string; bg: string; border: string }> = {
  A: { label: 'Class A', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  B: { label: 'Class B', color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200' },
  C: { label: 'Class C', color: 'text-slate-600',   bg: 'bg-slate-100',  border: 'border-slate-200' },
}

export default function DevelopersPage() {
  const { dir } = useI18n()
  const [todayMs] = useState(() => Date.now())
  const [developers, setDevelopers] = useState<Developer[]>([])
  const [deals, setDeals] = useState<{ developer: string; unit_value: number }[]>([])
  const [rules, setRules] = useState<CommissionRule[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isManageOpen, setIsManageOpen] = useState(false)
  const [selectedDev, setSelectedDev] = useState<EnrichedDeveloper | null>(null)
  const [search, setSearch] = useState('')
  const [regionFilter, setRegionFilter] = useState('All')
  const [form, setForm] = useState({ name: '', region: 'القاهرة الجديدة', class_grade: 'B', license_number: '', payment_days: 60, contract_end_date: '' })
  const [manageData, setManageData] = useState({ contract_end_date: '', commission_percentage: 2.5 })

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [{ data: devData }, { data: dealsData }, { data: rulesData }] = await Promise.all([
      supabase.from('developers').select('*').order('name', { ascending: true }),
      supabase.from('deals').select('developer_name, unit_value, amount'),
      supabase.from('commission_rules').select('*'),
    ])
    setDevelopers(devData || [])
    setDeals((dealsData || []).map(d => ({ developer: d.developer_name ?? '', unit_value: Number(d.unit_value ?? d.amount ?? 0) })))
    setRules(rulesData || [])
    setLoading(false)
  }, [])

  useEffect(() => { void fetchData() }, [fetchData])

  const handleAddDeveloper = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const { data, error } = await supabase.from('developers').insert([{
      name: form.name, region: form.region, class_grade: form.class_grade,
      license_number: form.license_number || 'غير مسجل',
      payment_days: Number(form.payment_days),
      contract_end_date: form.contract_end_date || null
    }]).select()
    if (!error && data) {
      await supabase.from('commission_rules').insert([{ developer_id: data[0].id, sale_type: 'All', commission_pct: 2.5, payout_days: 60 }])
      setIsAddOpen(false)
      setForm({ name: '', region: 'القاهرة الجديدة', class_grade: 'B', license_number: '', payment_days: 60, contract_end_date: '' })
      void fetchData()
    }
  }

  const openManage = (dev: EnrichedDeveloper) => {
    setSelectedDev(dev)
    const rule = rules.find(r => r.developer_id === dev.id)
    setManageData({ contract_end_date: dev.contract_end_date || '', commission_percentage: rule ? rule.percentage : 2.5 })
    setIsManageOpen(true)
  }

  const handleUpdateSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedDev) return
    await supabase.from('developers').update({ contract_end_date: manageData.contract_end_date || null }).eq('id', selectedDev.id)
    const existingRule = rules.find(r => r.developer_id === selectedDev.id)
    if (existingRule) {
      await supabase.from('commission_rules').update({ commission_pct: Number(manageData.commission_percentage) }).eq('id', existingRule.id)
    } else {
      await supabase.from('commission_rules').insert([{ developer_id: selectedDev.id, sale_type: 'All', commission_pct: Number(manageData.commission_percentage), payout_days: 60 }])
    }
    setIsManageOpen(false)
    void fetchData()
  }

  const enriched: EnrichedDeveloper[] = developers.map(dev => {
    const devDeals = deals.filter(d => d.developer === dev.name)
    const totalVolume = devDeals.reduce((s, d) => s + Number(d.unit_value || 0), 0)
    const rule = rules.find(r => r.developer_id === dev.id)
    let contractWarning = false, daysToExpiry: number | null = null
    if (dev.contract_end_date) {
      daysToExpiry = Math.ceil((new Date(dev.contract_end_date).getTime() - todayMs) / 86400000)
      contractWarning = daysToExpiry <= 30
    }
    return { ...dev, dealsCount: devDeals.length, totalVolume, commission: rule ? rule.percentage : 2.5, contractWarning, daysToExpiry }
  })

  const filtered = enriched.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) &&
    (regionFilter === 'All' || d.region === regionFilter)
  )

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Building2 size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900">سجل المطورين العقاريين</h1>
            <p className="text-xs text-slate-400">{developers.length} مطور مسجل</p>
          </div>
        </div>
        <button onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-900/20">
          <Plus size={15} /> إضافة مطور جديد
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="ابحث باسم المطور..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
          <option value="All">جميع المناطق</option>
          {['القاهرة الجديدة','العاصمة الإدارية','الساحل الشمالي','متعدد المناطق'].map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 font-bold">جاري التحميل...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <Building2 size={40} className="mx-auto text-slate-200 mb-3" />
          <p className="text-slate-500 font-bold">لا يوجد مطورون مسجلون</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(dev => {
            const grade = GRADE_STYLE[dev.class_grade] ?? GRADE_STYLE.C
            return (
              <div key={dev.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                {dev.contractWarning && <div className="h-1 bg-red-500" />}
                {!dev.contractWarning && <div className="h-1 bg-blue-500" />}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{dev.name}</h3>
                      <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                        <MapPin size={11} /> {dev.region}
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${grade.bg} ${grade.color} ${grade.border}`}>
                      {grade.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 mb-4">
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-slate-400 mb-0.5">حجم المبيعات</p>
                      <p className="text-sm font-black text-blue-600">{(dev.totalVolume / 1_000_000).toFixed(1)}M</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-slate-400 mb-0.5">العمولة</p>
                      <p className="text-sm font-black text-emerald-600">{dev.commission}%</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs mb-4">
                    <div className="flex justify-between">
                      <span className="text-slate-400">رقم الترخيص</span>
                      <span className="font-semibold text-slate-700">{dev.license_number}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">انتهاء التعاقد</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-700">
                          {dev.contract_end_date ? new Date(dev.contract_end_date).toLocaleDateString('ar-EG') : 'غير محدد'}
                        </span>
                        {dev.contractWarning && (
                          <span className="flex items-center gap-0.5 text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full border border-red-100 font-bold">
                            <AlertTriangle size={9} /> تنبيه
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button onClick={() => openManage(dev)}
                    className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition-colors">
                    <Settings size={13} /> إعدادات العقد والعمولة
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2"><Building2 size={16} className="text-blue-600" /> إضافة مطور عقاري</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <form onSubmit={handleAddDeveloper} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">الاسم *</label>
                <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">المنطقة</label>
                  <select value={form.region} onChange={e => setForm({...form, region: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                    {['القاهرة الجديدة','العاصمة الإدارية','الساحل الشمالي','متعدد المناطق'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">التصنيف</label>
                  <select value={form.class_grade} onChange={e => setForm({...form, class_grade: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                    {['A','B','C'].map(g => <option key={g} value={g}>Class {g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم الترخيص</label>
                  <input type="text" value={form.license_number} onChange={e => setForm({...form, license_number: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">دورة الصرف (أيام)</label>
                  <input type="number" value={form.payment_days} onChange={e => setForm({...form, payment_days: Number(e.target.value)})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">تاريخ انتهاء التعاقد (اختياري)</label>
                <input type="date" value={form.contract_end_date} onChange={e => setForm({...form, contract_end_date: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm transition-colors">حفظ المطور</button>
            </form>
          </div>
        </div>
      )}

      {/* Manage Modal */}
      {isManageOpen && selectedDev && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2"><Settings size={16} className="text-blue-600" /> {selectedDev.name}</h3>
              <button onClick={() => setIsManageOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <form onSubmit={handleUpdateSettings} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-blue-700 mb-1.5">نسبة العمولة المتفق عليها (%) *</label>
                <input required type="number" step="0.1" min="0" value={manageData.commission_percentage}
                  onChange={e => setManageData({...manageData, commission_percentage: Number(e.target.value)})}
                  className="w-full bg-blue-50 border-2 border-blue-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                <p className="text-[10px] text-slate-400 mt-1">تُستخدم لحساب المطالبات المالية القادمة</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-red-600 mb-1.5">تاريخ انتهاء عقد التعاون</label>
                <input type="date" value={manageData.contract_end_date}
                  onChange={e => setManageData({...manageData, contract_end_date: e.target.value})}
                  className="w-full bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300" />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
                <TrendingUp size={15} /> حفظ التحديثات
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
