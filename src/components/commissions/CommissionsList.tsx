'use client'

import { useState } from 'react'
import { payCommission } from '@/app/dashboard/commissions/actions'
import { CheckCircle, Clock, Building, User, Banknote } from 'lucide-react'

interface Commission {
  id: string
  amount: number
  status: string
  created_at: string
  team_members?: { name?: string }
  deals?: { title?: string }
}

export default function CommissionsList({ commissions }: { commissions: Commission[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handlePay = async (id: string) => {
    if (!confirm('هل أنت متأكد من تأكيد صرف هذه العمولة للموظف؟')) return
    setLoadingId(id)
    try {
      await payCommission(id)
      window.location.reload()
    } catch (error: unknown) {
      alert("خطأ أثناء الصرف: " + (error instanceof Error ? error.message : 'خطأ غير معروف'))
      setLoadingId(null)
    }
  }

  if (!commissions || commissions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-slate-500 shadow-sm mt-6">
        <Banknote size={40} className="mx-auto text-slate-300 mb-4" />
        <h3 className="text-lg font-bold text-slate-800 mb-1">لا توجد عمولات مسجلة بعد</h3>
        <p className="text-sm">قم بتسجيل أول عمولة لتبدأ في تتبع المستحقات المالية لفريقك.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
      {commissions.map((c) => (
        <div key={c.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden">
          {/* شريط جانبي لوني حسب الحالة */}
          <div className={`absolute top-0 right-0 w-1.5 h-full ${c.status === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
          
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-black text-xl text-slate-900">
                {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(c.amount)}
              </h3>
              <div className="flex items-center gap-1 text-xs font-bold mt-1">
                {c.status === 'paid' 
                  ? <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1"><CheckCircle size={12}/> تم الصرف</span>
                  : <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-1"><Clock size={12}/> معلقة</span>
                }
              </div>
            </div>
            <div className="text-left">
              <p className="text-[10px] text-slate-400 font-bold">تاريخ التسجيل</p>
              <p className="text-xs text-slate-700 font-medium">{new Date(c.created_at).toLocaleDateString('ar-EG')}</p>
            </div>
          </div>

          <div className="space-y-3 py-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-sm">
              <User size={16} className="text-blue-500" />
              <span className="font-bold text-slate-800">المستفيد:</span>
              <span className="text-slate-600">{c.team_members?.name || 'غير محدد'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Building size={16} className="text-slate-400" />
              <span className="font-bold text-slate-800">الصفقة:</span>
              <span className="text-slate-600 truncate" title={c.deals?.title}>{c.deals?.title || 'غير محدد'}</span>
            </div>
          </div>

          {/* زر الصرف يظهر فقط للعمولات المعلقة */}
          {c.status === 'pending' && (
            <div className="mt-2 pt-4 border-t border-slate-50">
              <button
                onClick={() => handlePay(c.id)}
                disabled={loadingId === c.id}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loadingId === c.id ? 'جاري التأكيد...' : <><Banknote size={16}/> اعتماد صرف العمولة</>}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}