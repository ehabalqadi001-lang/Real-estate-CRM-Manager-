'use client'

import { useActionState, useTransition } from 'react'
import { CheckSquare2, Square, Plus, Play } from 'lucide-react'
import {
  completeOnboardingTaskAction,
  uncompleteOnboardingTaskAction,
  initOnboardingAction,
  addCustomOnboardingTaskAction,
  type OnboardingActionState,
} from './actions'
import { useI18n } from '@/hooks/use-i18n'

const initial: OnboardingActionState = { ok: false, message: '' }

const inputClass =
  'h-10 w-full rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-bold text-[var(--fi-ink)] outline-none transition focus:border-[var(--fi-emerald)] focus:ring-4 focus:ring-emerald-100 dark:bg-white/5'

export function TaskToggleButton({ taskId, completed }: { taskId: string; completed: boolean }) {
  const [pending, startTransition] = useTransition()
  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          if (completed) await uncompleteOnboardingTaskAction(taskId)
          else await completeOnboardingTaskAction(taskId)
        })
      }
      className={`flex size-7 shrink-0 items-center justify-center rounded-md transition disabled:opacity-50 ${
        completed
          ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
          : 'border border-[var(--fi-line)] bg-white text-[var(--fi-muted)] hover:border-emerald-400 hover:text-emerald-600'
      }`}
    >
      {completed ? <CheckSquare2 className="size-4" /> : <Square className="size-4" />}
    </button>
  )
}

export function InitOnboardingButton({ employeeId }: { employeeId: string }) {
  const { t } = useI18n()
  const [pending, startTransition] = useTransition()
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(async () => { await initOnboardingAction(employeeId) })}
      className="fi-primary-button flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-black disabled:opacity-60"
    >
      <Play className="size-4" />
      {pending ? t('جاري التفعيل...', 'Activating...') : t('بدء بروتوكول الاستقبال', 'Start Onboarding Protocol')}
    </button>
  )
}

export function AddCustomTaskForm({ employeeId }: { employeeId: string }) {
  const { t } = useI18n()
  const [state, action, pending] = useActionState(addCustomOnboardingTaskAction, initial)
  return (
    <form action={action} className="mt-4 grid gap-3 sm:grid-cols-3" dir="rtl">
      <input type="hidden" name="employeeId" value={employeeId} />
      <input name="taskTitle" placeholder={t('عنوان المهمة...', 'Task title...')} required className={inputClass} />
      <select name="category" className={inputClass}>
        <option value="document">{t('وثيقة', 'Document')}</option>
        <option value="access">{t('صلاحيات', 'Access')}</option>
        <option value="training">{t('تدريب', 'Training')}</option>
        <option value="equipment">{t('معدات', 'Equipment')}</option>
        <option value="intro">{t('تعارف', 'Intro')}</option>
        <option value="review">{t('مراجعة', 'Review')}</option>
        <option value="general">{t('عام', 'General')}</option>
      </select>
      <button
        type="submit"
        disabled={pending}
        className="flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-60"
      >
        <Plus className="size-4" />
        {pending ? '...' : t('إضافة', 'Add')}
      </button>
      {state.message && (
        <p className={`sm:col-span-3 text-xs font-bold ${state.ok ? 'text-emerald-600' : 'text-red-600'}`}>
          {state.message}
        </p>
      )}
    </form>
  )
}
