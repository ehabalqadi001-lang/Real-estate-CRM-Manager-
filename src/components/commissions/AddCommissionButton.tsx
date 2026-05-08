'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, X, Percent, Calculator } from 'lucide-react'
import { addCommission, getActiveDeals, getActiveTeam } from '@/app/dashboard/commissions/actions'
import { useI18n } from '@/hooks/use-i18n'

interface Deal { id: string; title: string; unit_value?: number }
interface TeamMember { id: string; name: string }

export default function AddCommissionButton() {
  const { t, numLocale } = useI18n()
  const [isOpen, setIsOpen]       = useState(false)
  const [loading, setLoading]     = useState(false)
  const [deals, setDeals]         = useState<Deal[]>([])
  const [team, setTeam]           = useState<TeamMember[]>([])
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [percentage, setPercentage]     = useState(2.5)
  const [manualAmount, setManualAmount] = useState('')
  const [usePercentage, setUsePercentage] = useState(true)

  const COMMISSION_TYPES = [
    { value: 'agent',     label: t('وكيل مبيعات', 'Sales Agent') },
    { value: 'manager',   label: t('مدير فريق', 'Team Manager') },
    { value: 'company',   label: t('حصة الشركة', 'Company Share') },
    { value: 'developer', label: t('مطور عقاري', 'Real Estate Developer') },
  ]

  useEffect(() => {
    if (!isOpen) return
    let mounted = true
    async function load() {
      const [d, tm] = await Promise.all([getActiveDeals(), getActiveTeam()])
      if (mounted) { setDeals(d); setTeam(tm) }
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
      alert(t('خطأ أثناء الحفظ: ', 'Error saving: ') + (error instanceof Error ? error.message : t('خطأ غير معروف', 'Unknown error')))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-all shadow-md text-sm font-bold">
        <PlusIcon size={16} /> {t('تسجيل عمولة', 'Record Commission')}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Percent size={16} className="text-emerald-600" /> {t('تسجيل عمولة مبيعات', 'Record Sales Commission')}
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('نوع العمولة', 'Commission Type')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {COMMISSION_TYPES.map(ct => (
                    <label key={ct.value} className="cursor-pointer">
                      <input type="radio" name="commission_type" value={ct.value}
                        defaultChecked={ct.value === 'agent'} className="sr-only peer" />
                      <div className="border-2 border-slate-200 rounded-lg p-2.5 text-center text-xs font-bold text-slate-600 peer-checked:border-emerald-500 peer-checked:bg-emerald-50 peer-checked:text-emerald-700 transition-all cursor-pointer hover:border-slate-300">
                        {ct.label}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('الصفقة المرتبطة', 'Linked Deal')}</label>
                <select name="deal_id" required
                  onChange={e => {
                    const deal = deals.find(d => d.id === e.target.value) ?? null
                    setSelectedDeal(deal)
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-400 text-sm bg-white">
                  <option value="">{t('-- اختر الصفقة --', '-- Select Deal --')}</option>
                  {deals.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                </select>
                {selectedDeal?.unit_value && (
                  <p className="text-xs text-slate-400 mt-1">{t('قيمة الصفقة:', 'Deal value:')} {selectedDeal.unit_value.toLocaleString(numLocale)} {t('ج.م', 'EGP')}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('المستفيد', 'Beneficiary')}</label>
                <select name="member_id" required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-400 text-sm bg-white">
                  <option value="">{t('-- اختر الموظف أو الجهة --', '-- Select Employee or Entity --')}</option>
                  {team.map(tm => <option key={tm.id} value={tm.id}>{tm.name}</option>)}
                </select>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Calculator size={13} /> {t('حساب القيمة', 'Calculate Value')}
                  </label>
                  <div className="flex gap-2 text-xs">
                    <button type="button" onClick={() => setUsePercentage(true)}
                      className={`px-2 py-1 rounded-md font-bold transition-colors ${usePercentage ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      {t('نسبة %', 'Percentage %')}
                    </button>
                    <button type="button" onClick={() => setUsePercentage(false)}
                      className={`px-2 py-1 rounded-md font-bold transition-colors ${!usePercentage ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      {t('مبلغ ثابت', 'Flat Amount')}
                    </button>
                  </div>
                </div>

                {usePercentage ? (
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-slate-600">{t('نسبة العمولة', 'Commission Rate')}</span>
                      <span className="text-xs font-black text-emerald-700">{percentage}%</span>
                    </div>
                    <input type="range" min={0.5} max={10} step={0.25} value={percentage}
                      onChange={e => setPercentage(Number(e.target.value))}
                      className="w-full accent-emerald-600" />
                  </div>
                ) : (
                  <input type="number" min={0} placeholder={t('أدخل المبلغ بالجنيه', 'Enter amount in EGP')}
                    value={manualAmount} onChange={e => setManualAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-400" />
                )}

                <div className="bg-white border border-emerald-200 rounded-lg p-3 text-center">
                  <div className="text-xs text-slate-500 mb-0.5">{t('قيمة العمولة المحسوبة', 'Calculated Commission Value')}</div>
                  <div className="text-2xl font-black text-emerald-700">
                    {calculatedAmount.toLocaleString(numLocale)} <span className="text-sm">{t('ج.م', 'EGP')}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('حالة الصرف', 'Payout Status')}</label>
                <select name="status" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-400 text-sm bg-white">
                  <option value="pending">{t('معلقة (قيد التحصيل)', 'Pending (In Collection)')}</option>
                  <option value="paid">{t('تم الصرف', 'Paid')}</option>
                </select>
              </div>

              <button type="submit" disabled={loading || calculatedAmount === 0}
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                {loading ? t('جاري الحفظ...', 'Saving...') : t('حفظ العمولة', 'Save Commission')}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
