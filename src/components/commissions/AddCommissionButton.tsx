'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, X, Percent, Calculator } from 'lucide-react'
import { addCommission, getActiveDeals, getActiveTeam } from '@/app/dashboard/commissions/actions'

interface Deal { id: string; title: string; unit_value?: number }
interface TeamMember { id: string; name: string }

const COMMISSION_TYPES = [
  { value: 'agent',     label: 'وكيل مبيعات' },
  { value: 'manager',   label: 'مدير فريق' },
  { value: 'company',   label: 'حصة الشركة' },
  { value: 'developer', label: 'مطور عقاري' },
]

export default function AddCommissionButton() {
  const [isOpen, setIsOpen]       = useState(false)
  const [loading, setLoading]     = useState(false)
  const [deals, setDeals]         = useState<Deal[]>([])
  const [team, setTeam]           = useState<TeamMember[]>([])
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [percentage, setPercentage]     = useState(2.5)
  const [manualAmount, setManualAmount] = useState('')
  const [usePercentage, setUsePercentage] = useState(true)

  useEffect(() => {
    if (!isOpen) return
    let mounted = true
    async function load() {
      const [d, t] = await Promise.all([getActiveDeals(), getActiveTeam()])
      if (mounted) { setDeals(d); setTeam(t) }
    }
    load()
    return () => { mounted = false }
  }, [isOpen])

  const calculatedAmount = selectedDeal?.unit_value && usePercentage
    ? Math.round((selectedDeal.unit_value * percentage) / 100)
    : Number(manualAmount) || 0

  const handleSubmit = async (e: { preventDefault(): void; currentTarget: HTMLFormElement }) => {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set('amount', String(calculatedAmount))
    if (selectedDeal?.unit_value) fd.set('deal_value', String(selectedDeal.unit_value))
    fd.set('percentage', String(percentage))
    try {
      await addCommission(fd)
      setIsOpen(false)
      window.location.reload()
    } catch (error: unknown) {
      alert('خطأ أثناء الحفظ: ' + (error instanceof Error ? error.message : 'خطأ غير معروف'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-all shadow-md text-sm font-bold">
        <PlusIcon size={16} /> تسجيل عمولة
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Percent size={16} className="text-emerald-600" /> تسجيل عمولة مبيعات
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* نوع العمولة */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">نوع العمولة</label>
                <div className="grid grid-cols-2 gap-2">
                  {COMMISSION_TYPES.map(t => (
                    <label key={t.value} className="cursor-pointer">
                      <input type="radio" name="commission_type" value={t.value}
                        defaultChecked={t.value === 'agent'} className="sr-only peer" />
                      <div className="border-2 border-slate-200 rounded-lg p-2.5 text-center text-xs font-bold text-slate-600 peer-checked:border-emerald-500 peer-checked:bg-emerald-50 peer-checked:text-emerald-700 transition-all cursor-pointer hover:border-slate-300">
                        {t.label}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* الصفقة */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الصفقة المرتبطة</label>
                <select name="deal_id" required
                  onChange={e => {
                    const deal = deals.find(d => d.id === e.target.value) ?? null
                    setSelectedDeal(deal)
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-400 text-sm bg-white">
                  <option value="">-- اختر الصفقة --</option>
                  {deals.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                </select>
                {selectedDeal?.unit_value && (
                  <p className="text-xs text-slate-400 mt-1">قيمة الصفقة: {selectedDeal.unit_value.toLocaleString()} ج.م</p>
                )}
              </div>

              {/* الموظف */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المستفيد</label>
                <select name="member_id" required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-400 text-sm bg-white">
                  <option value="">-- اختر الموظف أو الجهة --</option>
                  {team.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              {/* حساب العمولة */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Calculator size={13} /> حساب القيمة
                  </label>
                  <div className="flex gap-2 text-xs">
                    <button type="button" onClick={() => setUsePercentage(true)}
                      className={`px-2 py-1 rounded-md font-bold transition-colors ${usePercentage ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      نسبة %
                    </button>
                    <button type="button" onClick={() => setUsePercentage(false)}
                      className={`px-2 py-1 rounded-md font-bold transition-colors ${!usePercentage ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      مبلغ ثابت
                    </button>
                  </div>
                </div>

                {usePercentage ? (
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-slate-600">نسبة العمولة</span>
                      <span className="text-xs font-black text-emerald-700">{percentage}%</span>
                    </div>
                    <input type="range" min={0.5} max={10} step={0.25} value={percentage}
                      onChange={e => setPercentage(Number(e.target.value))}
                      className="w-full accent-emerald-600" />
                  </div>
                ) : (
                  <input type="number" min={0} placeholder="أدخل المبلغ بالجنيه"
                    value={manualAmount} onChange={e => setManualAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-400" />
                )}

                <div className="bg-white border border-emerald-200 rounded-lg p-3 text-center">
                  <div className="text-xs text-slate-500 mb-0.5">قيمة العمولة المحسوبة</div>
                  <div className="text-2xl font-black text-emerald-700">
                    {calculatedAmount.toLocaleString()} <span className="text-sm">ج.م</span>
                  </div>
                </div>
              </div>

              {/* الحالة */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">حالة الصرف</label>
                <select name="status" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-400 text-sm bg-white">
                  <option value="pending">معلقة (قيد التحصيل)</option>
                  <option value="paid">تم الصرف</option>
                </select>
              </div>

              <button type="submit" disabled={loading || calculatedAmount === 0}
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                {loading ? 'جاري الحفظ...' : 'حفظ العمولة'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
