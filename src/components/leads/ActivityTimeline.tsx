'use client'

import { Phone, Users, FileText, MessageCircle, Mail, MapPin, RefreshCw, Clock } from 'lucide-react'
import { useI18n } from '@/hooks/use-i18n'

interface Activity {
  id: string
  type: string
  outcome?: string | null
  note?: string | null
  duration_min?: number | null
  created_at: string
  profiles?: { full_name?: string } | null
}

export default function ActivityTimeline({ activities }: { activities: Activity[] }) {
  const { t, numLocale } = useI18n()

  const TYPE_CONFIG: Record<string, { icon: typeof Phone; label: string; color: string; bg: string }> = {
    call:          { icon: Phone,         label: t('مكالمة', 'Call'),          color: 'text-blue-600',    bg: 'bg-blue-50' },
    meeting:       { icon: Users,         label: t('اجتماع', 'Meeting'),        color: 'text-purple-600',  bg: 'bg-purple-50' },
    note:          { icon: FileText,      label: t('ملاحظة', 'Note'),           color: 'text-slate-600',   bg: 'bg-slate-50' },
    whatsapp:      { icon: MessageCircle, label: t('واتساب', 'WhatsApp'),       color: 'text-emerald-600', bg: 'bg-emerald-50' },
    email:         { icon: Mail,          label: t('بريد', 'Email'),            color: 'text-indigo-600',  bg: 'bg-indigo-50' },
    site_visit:    { icon: MapPin,        label: t('زيارة موقع', 'Site Visit'), color: 'text-orange-600',  bg: 'bg-orange-50' },
    status_change: { icon: RefreshCw,     label: t('تغيير حالة', 'Status Change'), color: 'text-amber-600', bg: 'bg-amber-50' },
  }

  const OUTCOME_LABELS: Record<string, { label: string; color: string }> = {
    answered:       { label: t('رد', 'Answered'),              color: 'text-emerald-600 bg-emerald-50' },
    no_answer:      { label: t('لم يرد', 'No Answer'),         color: 'text-red-600 bg-red-50' },
    busy:           { label: t('مشغول', 'Busy'),               color: 'text-amber-600 bg-amber-50' },
    interested:     { label: t('مهتم', 'Interested'),          color: 'text-purple-600 bg-purple-50' },
    not_interested: { label: t('غير مهتم', 'Not Interested'),  color: 'text-slate-500 bg-slate-100' },
  }

  if (!activities.length) {
    return (
      <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <Clock size={32} className="mx-auto text-slate-200 mb-2" />
        <p className="text-sm font-bold text-slate-500">{t('لا توجد أنشطة مسجلة بعد', 'No activities recorded yet')}</p>
        <p className="text-xs text-slate-400 mt-0.5">{t('سجّل مكالمة أو زيارة أو ملاحظة لهذا العميل', 'Log a call, visit, or note for this client')}</p>
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
                    <span className="text-[11px] text-slate-400">{activity.duration_min} {t('دقيقة', 'min')}</span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400">
                  {new Date(activity.created_at).toLocaleDateString(numLocale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
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
