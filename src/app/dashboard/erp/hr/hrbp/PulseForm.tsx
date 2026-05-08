'use client'
import { useI18n } from '@/hooks/use-i18n'

import { useActionState } from 'react'
import { Heart } from 'lucide-react'
import { saveEmployeePulseAction, type HRBPActionState } from './actions'

const initial: HRBPActionState = { ok: false, message: '' }

export function PulseForm() {
  const { t } = useI18n()
  const [state, action, pending] = useActionState(saveEmployeePulseAction, initial)

  return (
    <section className="ds-card p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-pink-500">CULTURE PULSE</p>
          <h2 className="mt-1 text-xl font-black text-[var(--fi-ink)]">{t('استطلاع رضا الموظفين', 'Employee Satisfaction Survey')}</h2>
          <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">
            {t('تقييمك سري ومجهول. يُستخدم لتحسين بيئة العمل فقط.', 'Your response is confidential and anonymous. Used only to improve the work environment.')}
          </p>
        </div>
        <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-pink-50 text-pink-500">
          <Heart className="size-5" />
        </span>
      </div>

      {state.message ? (
        <div className={`mb-4 rounded-lg border px-4 py-3 text-sm font-bold ${state.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {state.message}
        </div>
      ) : null}

      <form key={state.ok ? state.message : 'pulse-form'} action={action} className="grid gap-5" noValidate>
        <RatingField
          name="engagementScore"
          label={t('مستوى الانخراط والمشاركة', 'Engagement & Participation Level')}
          hint={t('هل تشعر بأنك جزء من الفريق وتؤثر فيه؟', 'Do you feel part of the team and that you make an impact?')}
        />
        <RatingField
          name="satisfactionScore"
          label={t('مستوى الرضا الوظيفي', 'Job Satisfaction Level')}
          hint={t('هل أنت راضٍ عن دورك وظروف عملك؟', 'Are you satisfied with your role and working conditions?')}
        />
        <RatingField
          name="npsScore"
          label={t('هل ستوصي بالعمل هنا؟ (0–10)', 'Would you recommend working here? (0–10)')}
          hint={t('0 = لن أوصي أبداً، 10 = سأوصي بشدة', '0 = would never recommend, 10 = would strongly recommend')}
          max={10}
        />

        <label className="block">
          <span className="mb-2 block text-sm font-black text-[var(--fi-ink)]">{t('تعليق مجهول (اختياري)', 'Anonymous Comment (optional)')}</span>
          <textarea
            name="comments"
            rows={3}
            className="h-auto w-full rounded-lg border border-[var(--fi-line)] bg-white px-3 py-2.5 text-sm font-bold text-[var(--fi-ink)] outline-none transition placeholder:text-[var(--fi-muted)] focus:border-[var(--fi-emerald)] focus:ring-4 focus:ring-emerald-100 dark:bg-white/5"
            placeholder={t('ما الذي يمكن تحسينه؟', 'What could be improved?')}
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          className="fi-primary-button flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-black disabled:opacity-60"
        >
          {pending ? t('جاري الإرسال...', 'Submitting...') : t('إرسال التقييم', 'Submit Survey')}
        </button>
      </form>
    </section>
  )
}

function RatingField({ name, label, hint, max = 5 }: { name: string; label: string; hint: string; max?: number }) {
  const mid = Math.ceil(max / 2)
  return (
    <div>
      <p className="text-sm font-black text-[var(--fi-ink)]">{label}</p>
      <p className="mt-0.5 text-xs font-bold text-[var(--fi-muted)]">{hint}</p>
      <div className="mt-2 flex gap-1.5">
        {Array.from({ length: max }, (_, i) => i + 1).map((val) => (
          <label key={val} className="flex flex-1 cursor-pointer flex-col items-center">
            <input type="radio" name={name} value={val} defaultChecked={val === mid} className="sr-only" />
            <span className={`flex h-9 w-full items-center justify-center rounded-lg border-2 text-sm font-black transition hover:border-[var(--fi-emerald)] hover:bg-emerald-50 has-[:checked]:border-[var(--fi-emerald)] has-[:checked]:bg-emerald-50 has-[:checked]:text-emerald-700`}>
              {val}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
