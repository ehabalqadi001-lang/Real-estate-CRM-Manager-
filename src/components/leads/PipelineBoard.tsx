'use client'

import { useState } from 'react'
import { updateLeadStatus } from '@/app/dashboard/leads/actions'
import { ChevronDown, ChevronUp, CalendarDays, Phone, Info, Target, FileText } from 'lucide-react'

// تعريف المراحل والألوان الخاصة بكل حالة
const STAGES: Record<string, { title: string, color: string }> = {
  'fresh': { title: 'Fresh Leads', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  'old': { title: 'Old Leads', color: 'bg-slate-100 text-slate-800 border-slate-200' },
  'followup': { title: 'Follow Up', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  'meeting': { title: 'Meeting', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  'sitevisit': { title: 'Site Visit', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  'win': { title: 'Deal Close (Win)', color: 'bg-green-100 text-green-800 border-green-200' },
  'lose': { title: 'Deal Lose', color: 'bg-red-100 text-red-800 border-red-200' }
}

export default function PipelineBoard({ initialLeads }: { initialLeads: any[] }) {
  const [leads, setLeads] = useState(initialLeads || [])
  const [expandedId, setExpandedId] = useState<string | null>(null) // للتحكم في فتح البطاقة المنسدلة

  // معالجة تغيير الحالة من القائمة المنسدلة
  const handleStatusChange = async (leadId: string, newStatus: string) => {
    // تحديث الواجهة فوراً
    setLeads(current => current.map(lead => lead.id === leadId ? { ...lead, status: newStatus } : lead))
    try {
      await updateLeadStatus(leadId, newStatus)
    } catch (error) {
      alert("تعذر تحديث الحالة")
      window.location.reload()
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-2">
      {leads.map((lead) => {
        const currentStage = STAGES[lead.status] || STAGES['fresh']
        const isExpanded = expandedId === lead.id

        return (
          <div key={lead.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
            
            {/* --- البطاقة الأساسية (المتوسطة) --- */}
            <div className="p-5">
              {/* الهيدر: الاسم والحرارة */}
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-slate-900 text-lg truncate pr-1">{lead.name}</h3>
                <div className="flex gap-1">
                  {lead.temperature === 'hot' && <span title="ساخن" className="text-xl">🔥</span>}
                  {lead.temperature === 'warm' && <span title="دافئ" className="text-xl">☀️</span>}
                  {lead.temperature === 'cold' && <span title="بارد" className="text-xl">❄️</span>}
                </div>
              </div>

              {/* المعلومات السريعة */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Target size={16} className="text-slate-400" />
                  <span className="truncate font-medium">{lead.interest || 'لم يتم تحديد الاهتمام'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CalendarDays size={16} className="text-slate-400" />
                  <span>{new Date(lead.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>

              {/* تغيير المرحلة (قائمة منسدلة ملونة) */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">مرحلة العميل الحالية</label>
                <select
                  value={lead.status}
                  onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                  className={`w-full px-3 py-2 text-sm font-bold rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-center cursor-pointer ${currentStage.color}`}
                >
                  {Object.entries(STAGES).map(([key, stage]) => (
                    <option key={key} value={key} className="bg-white text-slate-900 font-medium">
                      {stage.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* زر الطي والفرد */}
            <button 
              onClick={() => setExpandedId(isExpanded ? null : lead.id)}
              className="w-full bg-slate-50 border-t border-slate-200 p-2 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-700 flex justify-center items-center gap-1 transition-colors"
            >
              {isExpanded ? <><ChevronUp size={16}/> إخفاء التفاصيل والتقارير</> : <><ChevronDown size={16}/> عرض التفاصيل والتقارير</>}
            </button>

            {/* --- البطاقة المنسدلة (التفاصيل والتقارير) --- */}
            {isExpanded && (
              <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-4 animate-in slide-in-from-top-2 duration-200">
                
                {/* بيانات التواصل */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-blue-500" />
                    <span className="text-sm font-bold text-slate-700" dir="ltr">{lead.phone}</span>
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{lead.source || 'غير محدد'}</span>
                </div>

                {/* قسم التقارير والمتابعة (واجهة مجهزة للبرمجة المستقبلية) */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={16} className="text-slate-700" />
                    <h4 className="font-bold text-slate-800 text-sm">تقارير المتابعة</h4>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-3 h-32 overflow-y-auto">
                    {/* هنا سيتم عرض التقارير والملاحظات لاحقاً */}
                    <div className="text-center text-slate-400 text-xs mt-8">
                      لا توجد تقارير متابعة مسجلة حتى الآن.
                      <br/>
                      <button className="text-blue-600 hover:underline mt-1 font-bold">إضافة تقرير جديد +</button>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        )
      })}

      {leads.length === 0 && (
        <div className="col-span-full py-20 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
          لا يوجد عملاء في مسار المبيعات حالياً.
        </div>
      )}
    </div>
  )
}