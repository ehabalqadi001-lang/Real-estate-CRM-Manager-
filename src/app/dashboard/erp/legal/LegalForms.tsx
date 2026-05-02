'use client'
import { useI18n } from '@/hooks/use-i18n'

import { useActionState, useTransition } from 'react'
import { FileText, Plus, UserCheck } from 'lucide-react'
import { createLegalDocumentAction, createHRContractAction, updateDocumentStatusAction, type LegalActionState } from './actions'

const initial: LegalActionState = { ok: false, message: '' }

const inputClass =
  'h-10 w-full rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-bold text-[var(--fi-ink)] outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:bg-white/5'

type Employee = { id: string; name: string }

const DOC_TYPES = [
  { value: 'employment_contract', label: 'عقد عمل' },
  { value: 'nda',                 label: 'اتفاقية سرية NDA' },
  { value: 'addendum',            label: 'ملحق عقد' },
  { value: 'termination',         label: 'إنهاء عقد' },
  { value: 'warning',             label: 'خطاب إنذار' },
  { value: 'appreciation',        label: 'خطاب تقدير' },
  { value: 'other',               label: 'أخرى' },
]

const CONTRACT_TYPES = [
  { value: 'employment', label: 'عقد توظيف' },
  { value: 'nda',        label: 'اتفاقية سرية' },
  { value: 'freelance',  label: 'عقد مستقل' },
  { value: 'internship', label: 'تدريب' },
  { value: 'amendment',  label: 'تعديل عقد' },
]

export function CreateLegalDocumentForm() {
  const { dir } = useI18n()
  const [state, action, pending] = useActionState(createLegalDocumentAction, initial)
  return (
    <div className="bg-[var(--fi-paper)] border border-[var(--fi-line)] rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 border-b border-[var(--fi-line)] p-4">
        <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <FileText size={16} />
        </div>
        <h2 className="font-bold text-[var(--fi-ink)]">وثيقة قانونية جديدة</h2>
      </div>
      {state.message && (
        <div className={`mx-4 mt-4 rounded-lg border px-4 py-3 text-sm font-bold ${state.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {state.message}
        </div>
      )}
      <form action={action} className="grid gap-4 p-4 sm:grid-cols-2">
        <label className="sm:col-span-2 block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">عنوان الوثيقة</span>
          <input name="title" required placeholder="مثال: عقد عمل — أحمد محمد 2026" className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">نوع الوثيقة</span>
          <select name="documentType" className={inputClass}>
            {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">الحالة</span>
          <select name="status" className={inputClass}>
            <option value="draft">مسودة</option>
            <option value="pending">قيد المراجعة</option>
            <option value="approved">معتمد</option>
          </select>
        </label>
        <label className="sm:col-span-2 block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">ملاحظات</span>
          <input name="notes" placeholder="اختياري..." className={inputClass} />
        </label>
        <div className="sm:col-span-2">
          <button type="submit" disabled={pending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-indigo-700 disabled:opacity-50">
            <Plus size={16} />
            {pending ? 'جاري الحفظ...' : 'إنشاء الوثيقة'}
          </button>
        </div>
      </form>
    </div>
  )
}

export function CreateHRContractForm({ employees }: { employees: Employee[] }) {
  const [state, action, pending] = useActionState(createHRContractAction, initial)
  return (
    <div className="bg-[var(--fi-paper)] border border-[var(--fi-line)] rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 border-b border-[var(--fi-line)] p-4">
        <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <UserCheck size={16} />
        </div>
        <h2 className="font-bold text-[var(--fi-ink)]">عقد موظف جديد</h2>
      </div>
      {state.message && (
        <div className={`mx-4 mt-4 rounded-lg border px-4 py-3 text-sm font-bold ${state.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {state.message}
        </div>
      )}
      <form action={action} className="grid gap-4 p-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">الموظف</span>
          <select name="employeeId" required className={inputClass}>
            <option value="">— اختر موظفاً —</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">نوع العقد</span>
          <select name="contractType" className={inputClass}>
            {CONTRACT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>
        <label className="sm:col-span-2 block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">عنوان العقد</span>
          <input name="title" required placeholder="مثال: عقد توظيف دائم — مدير مبيعات" className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">تاريخ البدء</span>
          <input name="startDate" type="date" required className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">تاريخ الانتهاء</span>
          <input name="endDate" type="date" className={inputClass} />
        </label>
        <label className="sm:col-span-2 flex items-center gap-3">
          <input name="isPermanent" type="checkbox" value="true" className="size-4 rounded" />
          <span className="text-sm font-bold text-[var(--fi-ink)]">عقد دائم (بدون تاريخ انتهاء)</span>
        </label>
        <label className="sm:col-span-2 block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">ملاحظات</span>
          <input name="notes" placeholder="اختياري..." className={inputClass} />
        </label>
        <div className="sm:col-span-2">
          <button type="submit" disabled={pending || !employees.length}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-50">
            <Plus size={16} />
            {pending ? 'جاري الحفظ...' : 'إنشاء العقد'}
          </button>
        </div>
      </form>
    </div>
  )
}

export function DocStatusButton({ docId, currentStatus }: { docId: string; currentStatus: string }) {
  const [pending, startTransition] = useTransition()
  const next =
    currentStatus === 'draft'   ? 'pending' :
    currentStatus === 'pending' ? 'approved' :
    currentStatus === 'approved' ? 'signed' : null

  if (!next) return null
  const labels: Record<string, string> = { pending: 'إرسال للمراجعة', approved: 'اعتماد', signed: 'تسجيل توقيع' }

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(async () => { await updateDocumentStatusAction(docId, next) })}
      className="rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-black text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50"
    >
      {pending ? '...' : labels[next]}
    </button>
  )
}
