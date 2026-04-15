'use client'

import { useState } from 'react'
import { PlusIcon, X, Loader2, DollarSign, Percent, User, Briefcase } from 'lucide-react'
import { closeDeal } from '@/app/dashboard/deals/actions'

interface Lead { id: string; client_name: string }
interface TeamMember { id: string; full_name: string }

export default function AddDealButton({ activeLeads, teamMembers }: { activeLeads: Lead[], teamMembers: TeamMember[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)
    
    try {
      const payload = {
        leadId: formData.get('leadId'),
        agentId: formData.get('agentId'),
        finalPrice: Number(formData.get('finalPrice')),
        commissionRate: Number(formData.get('commissionRate')),
        discount: 0
      }
      
      const response = await closeDeal(payload)
      if (response && response.success) {
        setIsOpen(false)
        window.location.reload()
      }
    } catch (error: unknown) {
      alert("تعذر حفظ الصفقة: " + (error instanceof Error ? error.message : 'خطأ غير معروف'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg"
      >
        <PlusIcon size={18} /> توثيق صفقة جديدة
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Briefcase className="text-emerald-600"/> توثيق عقد مبيعات
              </h2>
              <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><User size={16}/> العميل (Lead)</label>
                <select name="leadId" required className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium outline-none focus:border-emerald-500">
                  <option value="">اختر العميل الذي أتم الشراء...</option>
                  {activeLeads.map(lead => (
                    <option key={lead.id} value={lead.id}>{lead.client_name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><User size={16}/> الوكيل المسؤول</label>
                <select name="agentId" required className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium outline-none focus:border-emerald-500">
                  <option value="">اختر الوكيل لإضافة العمولة لحسابه...</option>
                  {teamMembers.map(agent => (
                    <option key={agent.id} value={agent.id}>{agent.full_name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><DollarSign size={16}/> قيمة العقد النهائي</label>
                  <input type="number" name="finalPrice" required min="0" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold outline-none focus:border-emerald-500" placeholder="مثال: 5000000" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><Percent size={16}/> نسبة العمولة (%)</label>
                  <input type="number" step="0.01" name="commissionRate" required min="0" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold outline-none focus:border-emerald-500" placeholder="مثال: 2.5" />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 rounded-xl font-black transition-all flex justify-center items-center gap-2">
                  {isLoading ? <><Loader2 size={18} className="animate-spin"/> جاري التوثيق...</> : 'تأكيد الصفقة وحساب العمولة'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  )
}