'use client'

import { useState, useTransition } from 'react'
import { Bell, Loader2 } from 'lucide-react'
import { saveNotificationPrefs } from './actions'

interface ToggleItem {
  id: string
  label: string
  description: string
}

const TOGGLES: ToggleItem[] = [
  { id: 'late_followup', label: 'تنبيهات المتابعة المتأخرة', description: 'إشعار فوري للمدير عند تأخر الوكيل في متابعة العميل أكثر من 48 ساعة' },
  { id: 'deal_closed',   label: 'إشعار إغلاق الصفقات',      description: 'إشعار للفريق عند إتمام أي صفقة جديدة' },
  { id: 'target_alert',  label: 'تنبيه إنجاز الأهداف',      description: 'تنبيه عند وصول الوكيل إلى 80% أو 100% من هدفه الشهري' },
  { id: 'score_drop',    label: 'تنبيه تراجع نقاط العميل',  description: 'إشعار عند انخفاض نقاط العميل بسبب غياب النشاط' },
]

const DEFAULT_PREFS = { late_followup: true, deal_closed: true, target_alert: true, score_drop: false }

export default function SettingsToggles({ initialPrefs }: { initialPrefs?: Record<string, boolean> | null }) {
  const [states, setStates] = useState<Record<string, boolean>>(
    initialPrefs ?? DEFAULT_PREFS
  )
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function toggle(id: string) {
    const next = { ...states, [id]: !states[id] }
    setStates(next)
    setSaved(false)
    startTransition(async () => {
      await saveNotificationPrefs(next)
      setSaved(true)
    })
  }

  return (
    <div className="rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between border-b border-[var(--fi-line)] pb-4">
        <h2 className="flex items-center gap-2 font-black text-[var(--fi-ink)]">
          <Bell size={16} className="text-amber-500" aria-hidden="true" />
          إعدادات التنبيهات الذكية
        </h2>
        {isPending && <Loader2 size={14} className="animate-spin text-[var(--fi-muted)]" />}
        {saved && !isPending && <span className="text-xs font-bold text-[var(--fi-emerald)]">تم الحفظ</span>}
      </div>
      <div className="space-y-3">
        {TOGGLES.map(t => (
          <div
            key={t.id}
            className="flex cursor-pointer items-center justify-between rounded-xl border border-[var(--fi-line)] bg-[var(--fi-soft)] p-4 transition hover:opacity-80"
            onClick={() => toggle(t.id)}
          >
            <div>
              <p className="text-sm font-bold text-[var(--fi-ink)]">{t.label}</p>
              <p className="mt-0.5 text-xs text-[var(--fi-muted)]">{t.description}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={states[t.id]}
              aria-label={t.label}
              onClick={e => { e.stopPropagation(); toggle(t.id) }}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${states[t.id] ? 'bg-[var(--fi-emerald)]' : 'bg-[var(--fi-line)]'}`}
            >
              <div className={`absolute top-1 size-4 rounded-full bg-white shadow transition-all ${states[t.id] ? 'right-1' : 'left-1'}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
