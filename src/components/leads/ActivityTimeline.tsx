'use client'

import { Phone, Users, FileText, MessageCircle, Mail, MapPin, RefreshCw, Clock } from 'lucide-react'

interface Activity {
  id: string
  type: string
  outcome?: string | null
  note?: string | null
  duration_min?: number | null
  created_at: string
  profiles?: { full_name?: string } | null
}

const TYPE_CONFIG: Record<string, { icon: typeof Phone; label: string; color: string; bg: string }> = {
  call:          { icon: Phone,         label: 'مكالمة',      color: 'text-blue-600',    bg: 'bg-blue-50' },
  meeting:       { icon: Users,         label: 'اجتماع',      color: 'text-purple-600',  bg: 'bg-purple-50' },
  note:          { icon: FileText,      label: 'ملاحظة',      color: 'text-slate-600',   bg: 'bg-slate-50' },
  whatsapp:      { icon: MessageCircle, label: 'واتساب',      color: 'text-emerald-600', bg: 'bg-emerald-50' },
  email:         { icon: Mail,          label: 'بريد',        color: 'text-indigo-600',  bg: 'bg-indigo-50' },
  site_visit:    { icon: MapPin,        label: 'زيارة موقع',  color: 'text-orange-600',  bg: 'bg-orange-50' },
  status_change: { icon: RefreshCw,     label: 'تغيير حالة',  color: 'text-amber-600',   bg: 'bg-amber-50' },
}

const OUTCOME_LABELS: Record<string, { label: string; color: string }> = {
  answered:       { label: 'رد',             color: 'text-emerald-600 bg-emerald-50' },
  no_answer:      { label: 'لم يرد',         color: 'text-red-600 bg-red-50' },
  busy:           { label: 'مشغول',          color: 'text-amber-600 bg-amber-50' },
  interested:     { label: 'مهتم',           color: 'text-purple-600 bg-purple-50' },
  not_interested: { label: 'غير مهتم',       color: 'text-slate-500 bg-slate-100' },
}

export default function ActivityTimeline({ activities }: { activities: Activity[] }) {
  if (!activities.length) {
    return (
      <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <Clock size={32} className="mx-auto text-slate-200 mb-2" />
        <p className="text-sm font-bold text-slate-500">لا توجد أنشطة مسجلة بعد</p>
        <p className="text-xs text-slate-400 mt-0.5">سجّل مكالمة أو زيارة أو ملاحظة لهذا العميل</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {activities.map(activity => {
        const cfg = TYPE_CONFIG[activity.type] ?? TYPE_CONFIG.note
        const Icon = cfg.icon
        const outcome = activity.outcome ? OUTCOME_LABELS[activity.outcome] : null

        return (
          <div key={activity.id} className="flex gap-3">
            <div className={`${cfg.bg} w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5`}>
              <Icon size={14} className={cfg.color} />
            </div>
            <div className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-black ${cfg.color}`}>{cfg.label}</span>
                  {outcome && (
                    <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${outcome.color}`}>
                      {outcome.label}
                    </span>
                  )}
                  {activity.duration_min && (
                    <span className="text-[11px] text-slate-400">{activity.duration_min} دقيقة</span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400">
                  {new Date(activity.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {activity.note && (
                <p className="text-sm text-slate-700 leading-relaxed">{activity.note}</p>
              )}
              {activity.profiles?.full_name && (
                <p className="text-[11px] text-slate-400 mt-1">{activity.profiles.full_name}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
