'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'

interface ToggleItem {
  id: string
  label: string
  description: string
  default: boolean
}

const TOGGLES: ToggleItem[] = [
  { id: 'late_followup', label: 'تنبيهات المتابعة المتأخرة', description: 'إشعار فوري للمدير عند تأخر الوكيل في متابعة العميل أكثر من 48 ساعة', default: true },
  { id: 'deal_closed',   label: 'إشعار إغلاق الصفقات',      description: 'إشعار للفريق عند إتمام أي صفقة جديدة',                              default: true },
  { id: 'target_alert',  label: 'تنبيه إنجاز الأهداف',      description: 'تنبيه عند وصول الوكيل إلى 80% أو 100% من هدفه الشهري',             default: true },
  { id: 'score_drop',    label: 'تنبيه تراجع نقاط العميل',  description: 'إشعار عند انخفاض نقاط العميل بسبب غياب النشاط',                    default: false },
]

export default function SettingsToggles() {
  const [states, setStates] = useState<Record<string, boolean>>(
    Object.fromEntries(TOGGLES.map(t => [t.id, t.default]))
  )

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <h2 className="font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4 mb-5">
        <Bell size={16} className="text-amber-500" /> إعدادات التنبيهات الذكية
      </h2>
      <div className="space-y-3">
        {TOGGLES.map(t => (
          <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100/50 transition-colors">
            <div>
              <p className="font-bold text-slate-800 text-sm">{t.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{t.description}</p>
            </div>
            <button
              type="button"
              onClick={() => setStates(s => ({ ...s, [t.id]: !s[t.id] }))}
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${states[t.id] ? 'bg-blue-600' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${states[t.id] ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
