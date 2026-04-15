'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { updateLeadStatus, addLeadReport } from '@/app/dashboard/leads/actions'
import { getTeamMembers, assignLeadToMember } from '@/app/dashboard/team/actions'
import { Building2, DollarSign, MessageSquarePlus, Loader2, UserCheck } from 'lucide-react'

const COLUMNS = [
  { id: 'Fresh Leads', title: 'عملاء جدد', color: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-700' },
  { id: 'Follow Up', title: 'متابعة', color: 'bg-amber-50', borderColor: 'border-amber-200', textColor: 'text-amber-700' },
  { id: 'Meeting', title: 'اجتماعات', color: 'bg-purple-50', borderColor: 'border-purple-200', textColor: 'text-purple-700' },
  { id: 'Won', title: 'تم البيع (Won)', color: 'bg-emerald-50', borderColor: 'border-emerald-200', textColor: 'text-emerald-700' },
  { id: 'Lost', title: 'مرفوض (Lost)', color: 'bg-red-50', borderColor: 'border-red-200', textColor: 'text-red-700' }
]

interface PipelineLead {
  id: string
  client_name: string
  status: string
  property_type?: string
  expected_value?: number
  user_id?: string
}

interface TeamMember {
  id: string
  full_name: string
}

export default function PipelineBoard({ initialLeads }: { initialLeads: PipelineLead[] }) {
  const [leads, setLeads] = useState(initialLeads)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const [reportFormLeadId, setReportFormLeadId] = useState<string | null>(null)
  const [reportText, setReportText] = useState('')
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)

  useEffect(() => {
    let mounted = true
    async function load() {
      const data = await getTeamMembers()
      if (mounted) setTeamMembers((data as TeamMember[]) || [])
    }
    load()
    return () => { mounted = false }
  }, [])

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedLeadId(leadId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault()
    if (!draggedLeadId) return

    const leadToMove = leads.find(l => l.id === draggedLeadId)
    if (!leadToMove || leadToMove.status === targetStatus) {
      setDraggedLeadId(null)
      return
    }

    setLeads(prev => prev.map(l => l.id === draggedLeadId ? { ...l, status: targetStatus } : l))
    setDraggedLeadId(null)
    setIsUpdating(true)

    try {
      await updateLeadStatus(draggedLeadId, targetStatus)
    } catch (error) {
      console.error("Failed to update status:", error)
      setLeads(initialLeads)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAddReport = async (leadId: string) => {
    if (!reportText.trim()) return
    setIsSubmittingReport(true)
    try {
      await addLeadReport(leadId, reportText, 'متابعة عادية', '')
      setReportFormLeadId(null)
      setReportText('')
      window.location.reload()
    } catch (error) {
      console.error("Failed to add report:", error)
    } finally {
      setIsSubmittingReport(false)
    }
  }

  const handleAssignLead = async (leadId: string, memberId: string) => {
    if (!memberId) return
    setIsUpdating(true)
    try {
      await assignLeadToMember(leadId, memberId)
      window.location.reload() 
    } catch (error) {
      console.error("Assignment failed", error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="flex gap-6 overflow-x-auto pb-8 snap-x" dir="rtl">
      {COLUMNS.map(column => {
        const columnLeads = leads.filter(l => l.status === column.id || (!l.status && column.id === 'Fresh Leads'))
        
        return (
          <div 
            key={column.id} 
            className="flex-shrink-0 w-[350px] bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col snap-center h-[calc(100vh-200px)]"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className={`p-4 rounded-t-2xl border-b flex justify-between items-center ${column.color} ${column.borderColor}`}>
              <h3 className={`font-black ${column.textColor}`}>{column.title}</h3>
              <span className={`text-xs font-bold px-2.5 py-1 bg-white rounded-lg shadow-sm ${column.textColor}`}>
                {columnLeads.length}
              </span>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-4 bg-slate-50/50">
              {columnLeads.length === 0 ? (
                <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl">
                  <p className="text-slate-400 font-bold text-sm">اسحب البطاقات إلى هنا</p>
                </div>
              ) : (
                columnLeads.map(lead => (
                  <div 
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:border-blue-300 hover:shadow-md transition-all group relative"
                  >
                    <div className="text-center mb-4">
                      {/* 🔥 الرابط السحري الذي ينقلك لملف العميل */}
                      <Link 
                        href={`/dashboard/leads/${lead.id}`} 
                        className="font-black text-slate-900 text-lg mb-1 block hover:text-blue-600 hover:underline underline-offset-4 transition-colors"
                      >
                        {lead.client_name}
                      </Link>
                      
                      <div className="flex justify-center items-center gap-4 text-xs font-bold text-slate-500 mt-2">
                        <span className="flex items-center gap-1"><Building2 size={12}/> {lead.property_type || 'غير محدد'}</span>
                        <span className="flex items-center gap-1 text-emerald-600"><DollarSign size={12}/> {lead.expected_value?.toLocaleString() || 0} ج.م</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {teamMembers.length > 0 && (
                        <div className="pt-3 border-t border-slate-100 relative">
                          <UserCheck size={14} className="absolute right-2 top-5 text-slate-400 pointer-events-none" />
                          <select
                            onChange={(e) => handleAssignLead(lead.id, e.target.value)}
                            value={lead.user_id || ""}
                            disabled={isUpdating}
                            className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5 pr-8 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none transition-colors"
                          >
                            <option value="" disabled>تفويض العميل لـ...</option>
                            {teamMembers.map(member => (
                              <option key={member.id} value={member.id}>
                                {member.full_name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {reportFormLeadId !== lead.id ? (
                        <button 
                          onClick={() => setReportFormLeadId(lead.id)}
                          className="w-full flex justify-center items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors"
                        >
                          <MessageSquarePlus size={14} /> إضافة تقرير متابعة سريع
                        </button>
                      ) : (
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                          <textarea 
                            autoFocus
                            value={reportText}
                            onChange={(e) => setReportText(e.target.value)}
                            placeholder="اكتب تفاصيل المكالمة أو المتابعة..."
                            className="w-full text-xs p-2 rounded-md border border-slate-200 outline-none focus:border-blue-400 resize-none h-16 bg-white"
                          />
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleAddReport(lead.id)}
                              disabled={isSubmittingReport}
                              className="flex-1 bg-blue-600 text-white text-[10px] font-bold py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                              {isSubmittingReport ? <Loader2 size={12} className="animate-spin mx-auto" /> : 'حفظ'}
                            </button>
                            <button 
                              onClick={() => { setReportFormLeadId(null); setReportText(''); }}
                              className="px-3 bg-slate-200 text-slate-600 text-[10px] font-bold py-1.5 rounded-md hover:bg-slate-300"
                            >
                              إلغاء
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}