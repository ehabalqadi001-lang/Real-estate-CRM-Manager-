'use client'

import { useState } from 'react'
import { updateLeadStatus } from '@/app/dashboard/leads/actions'

// تعريف المراحل الـ 7 التي طلبتها
const PIPELINE_STAGES = [
  { id: 'fresh', title: 'Fresh Leads', color: 'border-blue-200 bg-blue-50' },
  { id: 'old', title: 'Old Leads', color: 'border-slate-200 bg-slate-50' },
  { id: 'followup', title: 'Follow Up', color: 'border-amber-200 bg-amber-50' },
  { id: 'meeting', title: 'Meeting', color: 'border-purple-200 bg-purple-50' },
  { id: 'sitevisit', title: 'Site Visit', color: 'border-indigo-200 bg-indigo-50' },
  { id: 'win', title: 'Deal Close (Win)', color: 'border-green-200 bg-green-50' },
  { id: 'lose', title: 'Deal Lose', color: 'border-red-200 bg-red-50' }
]

export default function PipelineBoard({ initialLeads }: { initialLeads: any[] }) {
  const [leads, setLeads] = useState(initialLeads || [])

  // وظائف السحب والإفلات (Drag & Drop)
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault() // ضروري للسماح بالإفلات
  }

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    const leadId = e.dataTransfer.getData('leadId')
    
    // تحديث الواجهة فوراً (Optimistic Update) لسرعة الاستجابة
    setLeads(current => 
      current.map(lead => lead.id === leadId ? { ...lead, status: newStatus } : lead)
    )

    // إرسال التحديث لقاعدة البيانات في الخلفية
    try {
      await updateLeadStatus(leadId, newStatus)
    } catch (error) {
      alert("تعذر تحديث حالة العميل")
      // في حالة الخطأ، أعد البيانات لحالتها
      window.location.reload()
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 pt-2 min-h-[650px] snap-x">
      {PIPELINE_STAGES.map((stage) => {
        const stageLeads = leads.filter(lead => lead.status === stage.id)

        return (
          <div 
            key={stage.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.id)}
            className={`flex-shrink-0 w-80 rounded-2xl border-2 ${stage.color} p-4 flex flex-col snap-center`}
          >
            {/* عنوان المرحلة */}
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200/50">
              <h3 className="font-bold text-slate-800 text-sm">{stage.title}</h3>
              <span className="bg-white text-slate-600 text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                {stageLeads.length}
              </span>
            </div>

            {/* بطاقات العملاء */}
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {stageLeads.map(lead => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, lead.id)}
                  className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-blue-300 transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-900 text-sm truncate">{lead.name}</h4>
                    {lead.temperature === 'hot' && <span title="ساخن" className="text-red-500 text-xs">🔥</span>}
                    {lead.temperature === 'warm' && <span title="دافئ" className="text-amber-500 text-xs">☀️</span>}
                    {lead.temperature === 'cold' && <span title="بارد" className="text-blue-500 text-xs">❄️</span>}
                  </div>
                  <div className="text-xs text-slate-500 flex justify-between items-center mt-3 pt-2 border-t border-slate-50">
                    <span dir="ltr">{lead.phone}</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px]">{lead.source || 'غير محدد'}</span>
                  </div>
                </div>
              ))}
              
              {stageLeads.length === 0 && (
                <div className="text-center text-slate-400 text-xs py-8 border-2 border-dashed border-slate-200 rounded-xl">
                  اسحب وأفلت هنا
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}