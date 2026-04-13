'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, X, Percent } from 'lucide-react'
import { addCommission, getActiveDeals, getActiveTeam } from '@/app/dashboard/commissions/actions'

export default function AddCommissionButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deals, setDeals] = useState<any[]>([])
  const [team, setTeam] = useState<any[]>([])

  useEffect(() => {
    if (isOpen) {
      getActiveDeals().then(setDeals)
      getActiveTeam().then(setTeam)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      await addCommission(new FormData(e.currentTarget))
      setIsOpen(false)
      window.location.reload()
    } catch (error: any) {
      alert('خطأ أثناء الحفظ: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-all shadow-md">
        <PlusIcon size={18} />
        <span className="text-sm font-bold">تسجيل عمولة</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2"><Percent size={18} className="text-emerald-600"/> تسجيل مستحقات مبيعات</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الصفقة المرتبطة</label>
                <select name="deal_id" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm bg-white">
                  <option value="">-- اختر الصفقة الناجحة --</option>
                  {deals.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الموظف المستحق للعمولة</label>
                <select name="member_id" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm bg-white">
                  <option value="">-- اختر الموظف --</option>
                  {team.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">قيمة العمولة (EGP)</label>
                  <input name="amount" type="number" required min="0" placeholder="مثال: 50000" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">حالة الصرف</label>
                  <select name="status" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm bg-white">
                    <option value="pending">معلقة (قيد التحصيل)</option>
                    <option value="paid">تم الصرف للموظف</option>
                  </select>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 disabled:bg-slate-300 transition-colors mt-4 shadow-md">
                {loading ? 'جاري التسجيل...' : 'حفظ العمولة'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}