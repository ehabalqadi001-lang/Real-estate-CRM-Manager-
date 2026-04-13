'use client'

import { useState, useEffect } from 'react'
import { updateLeadStatus, addLeadReport } from '@/app/dashboard/leads/actions'
import { getTeamMembers, assignLeadToMember } from '@/app/dashboard/team/actions'
import { ChevronDown, ChevronUp, CalendarDays, Phone, Target, FileText, Send, Clock, Bell, AlertCircle, UserCheck } from 'lucide-react'

// المراحل وألوانها
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
  const [expandedId, setExpandedId] = useState<string | null>(null)
  
  // حالات التقارير والمواعيد
  const [reportFormLeadId, setReportFormLeadId] = useState<string | null>(null)
  const [reportText, setReportText] = useState('')
  const [reportStatus, setReportStatus] = useState('followup')
  const [followupDate, setFollowupDate] = useState('') 
  const [isSubmitting, setIsSubmitting] = useState(false)

  // حالة فريق العمل
  const [teamMembers, setTeamMembers] = useState<any[]>([])

  // جلب أعضاء الفريق عند فتح الصفحة
  useEffect(() => {
    getTeamMembers().then(setTeamMembers).catch(console.error)
  }, [])

  // 1. تحديث مرحلة العميل
  const handleStatusChange = async (leadId: string, newStatus: string) => {
    setLeads(current => current.map(lead => lead.id === leadId ? { ...lead, status: newStatus } : lead))
    try {
      await updateLeadStatus(leadId, newStatus)
    } catch (error) {
      alert("تعذر تحديث الحالة")
      window.location.reload()
    }
  }

  // 2. توزيع المهام (تحديد الموظف المسؤول)
  const handleAssignMember = async (leadId: string, memberId: string) => {
    // تحديث الشاشة فوراً
    setLeads(current => current.map(lead => lead.id === leadId ? { ...lead, assigned_to: memberId } : lead))
    try {
      const assignedId = memberId === "" ? null : memberId
      await assignLeadToMember(leadId, assignedId as any)
    } catch (error) {
      alert("تعذر تعيين الموظف")
      window.location.reload()
    }
  }

  // 3. إرسال التقرير وموعد المتابعة الذكي
  const submitReport = async (leadId: string) => {
    if (!reportText.trim()) return alert('يرجى كتابة التقرير أولاً')
    setIsSubmitting(true)
    try {
      await addLeadReport(leadId, reportText, reportStatus, followupDate)
      setReportFormLeadId(null)
      setReportText('')
      setFollowupDate('')
      window.location.reload()
    } catch (error: any) {
      alert("حدث خطأ: " + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 4. نظام شارات AI Calendar
  const getFollowupBadge = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    const now = new Date()
    const isPast = date < now
    const isToday = date.toDateString() === now.toDateString()

    if (isPast && !isToday) {
      return <span className="flex items-center gap-1 text-[10px] font-bold bg-red-100 text-red-700 px-2 py-1 rounded-full border border-red-200 animate-pulse"><AlertCircle size={12}/> متابعة فائتة</span>
    } else if (isToday) {
      return <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-full border border-amber-200"><Bell size={12}/> متابعة اليوم</span>
    } else {
      return <span className="flex items-center gap-1 text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full border border-green-200"><CalendarDays size={12}/> مجدولة لاحقاً</span>
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-2">
      {leads.map((lead) => {
        const currentStage = STAGES[lead.status] || STAGES['fresh']
        const isExpanded = expandedId === lead.id
        const reports = (lead.lead_reports || []).sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

        return (
          <div key={lead.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
            
            {/* --- البطاقة الأساسية --- */}
            <div className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div className="flex flex-col gap-1 pr-1">
                  <h3 className="font-bold text-slate-900 text-lg truncate">{lead.name}</h3>
                  {getFollowupBadge(lead.next_followup_date)}
                </div>
                <div className="flex gap-1">
                  {lead.temperature === 'hot' && <span title="ساخن" className="text-xl">🔥</span>}
                  {lead.temperature === 'warm' && <span title="دافئ" className="text-xl">☀️</span>}
                  {lead.temperature === 'cold' && <span title="بارد" className="text-xl">❄️</span>}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Target size={16} className="text-slate-400" />
                  <span className="truncate font-medium">{lead.interest || 'لم يتم تحديد الاهتمام'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CalendarDays size={16} className="text-slate-400" />
                  <span>{new Date(lead.created_at).toLocaleDateString('ar-EG')}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100">
                {/* 1. القائمة المنسدلة للموظف (Team Assignment) */}
                <div>
                  <label className="flex items-center gap-1 text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                    <UserCheck size={12}/> المسؤول
                  </label>
                  <select
                    value={lead.assigned_to || ''}
                    onChange={(e) => handleAssignMember(lead.id, e.target.value)}
                    className="w-full px-2 py-2 text-xs font-bold rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-700 cursor-pointer truncate"
                  >
                    <option value="">-- غير محدد --</option>
                    {teamMembers.map(member => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                </div>

                {/* 2. القائمة المنسدلة للحالة (Pipeline Status) */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">المرحلة الحالية</label>
                  <select
                    value={lead.status}
                    onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                    className={`w-full px-2 py-2 text-xs font-bold rounded-lg border focus:outline-none appearance-none text-center cursor-pointer truncate ${currentStage.color}`}
                  >
                    {Object.entries(STAGES).map(([key, stage]) => (
                      <option key={key} value={key} className="bg-white text-slate-900 font-medium">{stage.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* --- زر الطي والفرد --- */}
            <button 
              onClick={() => setExpandedId(isExpanded ? null : lead.id)}
              className="w-full bg-slate-50 border-t border-slate-200 p-2 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-700 flex justify-center items-center gap-1 transition-colors"
            >
              {isExpanded ? <><ChevronUp size={16}/> إخفاء التفاصيل والمتابعات</> : <><ChevronDown size={16}/> عرض التفاصيل والمتابعات ({reports.length})</>}
            </button>

            {/* --- البطاقة المنسدلة (التفاصيل، التقويم، التقارير) --- */}
            {isExpanded && (
              <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-4 animate-in slide-in-from-top-2 duration-200">
                
                <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-blue-500" />
                    <span className="text-sm font-bold text-slate-700" dir="ltr">{lead.phone}</span>
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{lead.source || 'غير محدد'}</span>
                </div>

                {/* قسم المتابعات */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-slate-700" />
                      <h4 className="font-bold text-slate-800 text-sm">سجل المتابعات</h4>
                    </div>
                    <button 
                      onClick={() => setReportFormLeadId(lead.id)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors border border-blue-200"
                    >
                      + متابعة جديدة
                    </button>
                  </div>

                  {reportFormLeadId === lead.id && (
                    <div className="bg-white border-2 border-blue-200 rounded-xl p-4 mb-3 shadow-md animate-in fade-in">
                      <textarea 
                        autoFocus
                        placeholder="اكتب تفاصيل المكالمة هنا..."
                        className="w-full text-sm p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3 resize-none bg-slate-50"
                        rows={2}
                        value={reportText}
                        onChange={(e) => setReportText(e.target.value)}
                      />
                      
                      <div className="mb-3 bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                        <label className="flex items-center gap-1 text-xs font-bold text-blue-700 mb-1">
                          <Clock size={14} /> جدول المتابعة القادمة (AI Calendar)
                        </label>
                        <input 
                          type="datetime-local" 
                          className="w-full text-xs border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                          value={followupDate}
                          onChange={(e) => setFollowupDate(e.target.value)}
                        />
                      </div>

                      <div className="flex gap-2">
                        <select 
                          value={reportStatus}
                          onChange={(e) => setReportStatus(e.target.value)}
                          className="flex-1 text-xs font-bold border border-slate-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                        >
                          <option value="" disabled>نتيجة المتابعة...</option>
                          {Object.entries(STAGES).map(([key, stage]) => (
                            <option key={key} value={key}>{stage.title}</option>
                          ))}
                        </select>
                        <button 
                          onClick={() => submitReport(lead.id)}
                          disabled={isSubmitting}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 font-bold flex items-center gap-1 transition-colors"
                        >
                          <Send size={14} /> حفظ
                        </button>
                        <button 
                          onClick={() => setReportFormLeadId(null)}
                          className="bg-slate-100 text-slate-500 px-3 py-2 rounded-lg hover:bg-slate-200 font-bold transition-colors"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {reports.length > 0 ? reports.map((report: any) => (
                      <div key={report.id} className="bg-white border border-slate-200 rounded-lg p-3 text-sm hover:border-slate-300 transition-colors">
                        <div className="flex justify-between items-start mb-2 text-slate-500 text-xs">
                          <span className="flex items-center gap-1 font-medium"><Clock size={12}/> {new Date(report.created_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</span>
                          <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 shadow-sm">
                            {STAGES[report.status_logged]?.title || report.status_logged}
                          </span>
                        </div>
                        <p className="text-slate-800 leading-relaxed font-medium">{report.report_text}</p>
                      </div>
                    )) : (
                      <div className="text-center text-slate-400 text-xs py-6 border-2 border-dashed border-slate-200 rounded-xl bg-white">
                        لا توجد متابعات سابقة. ابدأ بإضافة تقريرك الأول.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        )
      })}

      {leads.length === 0 && (
        <div className="col-span-full py-20 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-sm">
          لا يوجد عملاء في مسار المبيعات حالياً.
        </div>
      )}
    </div>
  )
}