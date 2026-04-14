'use client'

import { useState, useEffect } from 'react'
import { getLeads, updateLeadStatus } from './actions'
import { AlertTriangle, Plus, GripVertical, Building, DollarSign, Loader2 } from 'lucide-react'

// تعريف مراحل المبيعات حسب التقرير
const PIPELINE_STAGES = [
  { id: 'Fresh Leads', title: 'عملاء جدد', color: 'bg-blue-100 border-blue-200 text-blue-800' },
  { id: 'Follow-up', title: 'متابعة', color: 'bg-amber-100 border-amber-200 text-amber-800' },
  { id: 'Meeting', title: 'اجتماعات', color: 'bg-purple-100 border-purple-200 text-purple-800' },
  { id: 'Won', title: 'مغلق بنجاح', color: 'bg-emerald-100 border-emerald-200 text-emerald-800' }
]

export default function KanbanBoardPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [errorState, setErrorState] = useState<{message: string, details: string} | null>(null)
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null)

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    try {
      const data = await getLeads()
      setLeads(data)
    } catch (err: any) {
      setErrorState({ message: "فشل تحميل مسار المبيعات", details: err.message })
    } finally {
      setLoading(false)
    }
  }

  // دوال السحب والإفلات
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedLeadId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault() // ضروري للسماح بالإفلات
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    if (!draggedLeadId) return

    // تحديث الواجهة فوراً (Optimistic UI) لسرعة الاستجابة
    const originalLeads = [...leads]
    setLeads(leads.map(lead => lead.id === draggedLeadId ? { ...lead, status: newStatus } : lead))
    setDraggedLeadId(null)

    try {
      await updateLeadStatus(draggedLeadId, newStatus)
    } catch (err: any) {
      // في حالة الفشل، نعود للحالة القديمة ونظهر الخطأ
      setLeads(originalLeads)
      setErrorState({ message: "تعذر تحديث حالة العميل", details: err.message })
    }
  }

  // حساب إجمالي قيمة كل مرحلة
  const getStageTotal = (status: string) => {
    return leads
      .filter(l => l.status === status)
      .reduce((sum, l) => sum + Number(l.expected_value || 0), 0)
  }

  return (
    <div className="space-y-6" dir="rtl">
      
      <div className="flex justify-between items-end bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900">مسار المبيعات (Pipeline)</h1>
          <p className="text-sm font-bold text-slate-500 mt-1">تتبع رحلة العملاء واسحب البطاقات لتحديث حالتهم</p>
        </div>
        <button className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-slate-900/20">
          <Plus size={18} /> إضافة عميل
        </button>
      </div>

      {/* صائد الأخطاء الإجباري (Rule 3) */}
      {errorState && (
        <div className="bg-red-50 border border-red-200 p-6 rounded-2xl flex items-start gap-4">
          <AlertTriangle className="text-red-500 flex-shrink-0" size={24} />
          <div>
            <h3 className="font-bold text-red-800">{errorState.message}</h3>
            <p className="text-xs font-mono text-red-600 mt-1" dir="ltr">{errorState.details}</p>
          </div>
          <button onClick={() => setErrorState(null)} className="mr-auto text-sm font-bold text-red-500 hover:text-red-700">إخفاء</button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <Loader2 size={48} className="animate-spin mb-4 text-blue-500" />
          <p className="font-bold">جاري تحميل مسار المبيعات...</p>
        </div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-8 custom-scrollbar items-start">
          {PIPELINE_STAGES.map((stage) => {
            const stageLeads = leads.filter(l => l.status === stage.id)
            const stageTotal = getStageTotal(stage.id)

            return (
              <div 
                key={stage.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
                className="flex-shrink-0 w-80 bg-slate-50/50 rounded-2xl border border-slate-200 flex flex-col max-h-[75vh]"
              >
                {/* رأس العمود */}
                <div className={`p-4 border-b border-slate-200 rounded-t-2xl ${stage.color} bg-opacity-50`}>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-black text-sm">{stage.title}</h3>
                    <span className="bg-white/50 text-xs font-black px-2 py-1 rounded-md">{stageLeads.length}</span>
                  </div>
                  <div className="text-xs font-bold opacity-80 flex items-center gap-1">
                    <DollarSign size={12} />
                    {new Intl.NumberFormat('ar-EG').format(stageTotal)} ج.م
                  </div>
                </div>

                {/* منطقة البطاقات */}
                <div className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[150px]">
                  {stageLeads.length === 0 ? (
                    <div className="h-full border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs font-bold py-8">
                      اسحب البطاقات إلى هنا
                    </div>
                  ) : (
                    stageLeads.map(lead => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all group"
                      >
                        <div className="flex items-start gap-2">
                          <GripVertical size={16} className="text-slate-300 mt-1 cursor-grab" />
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-900 text-sm mb-2">{lead.client_name}</h4>
                            <div className="space-y-1.5">
                              <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                                <Building size={12} className="text-blue-500" /> {lead.property_type || 'غير محدد'}
                              </p>
                              <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                                <DollarSign size={12} className="text-emerald-500" /> 
                                {new Intl.NumberFormat('ar-EG').format(lead.expected_value)} ج.م
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}