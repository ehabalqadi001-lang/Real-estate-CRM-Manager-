'use client'

import { useActionState, useTransition } from 'react'
import { Upload, ShieldCheck, Trash2 } from 'lucide-react'
import { uploadDocumentAction, verifyDocumentAction, deleteDocumentAction, type DocActionState } from './actions'
import { useI18n } from '@/hooks/use-i18n'

const initial: DocActionState = { ok: false, message: '' }

const inputClass =
  'h-10 w-full rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-bold text-[var(--fi-ink)] outline-none transition focus:border-[var(--fi-emerald)] focus:ring-4 focus:ring-emerald-100 dark:bg-white/5'

type EmployeeOption = { id: string; name: string }

export function UploadDocumentForm({ employees }: { employees: EmployeeOption[] }) {
  const { t } = useI18n()
  const [state, action, pending] = useActionState(uploadDocumentAction, initial)

  const docTypeOptions = [
    { value: 'id_card',      label: t('بطاقة الهوية', 'ID Card') },
    { value: 'contract',     label: t('عقد العمل', 'Employment Contract') },
    { value: 'offer_letter', label: t('خطاب العرض', 'Offer Letter') },
    { value: 'certificate',  label: t('شهادة / مؤهل', 'Certificate / Qualification') },
    { value: 'bank',         label: t('بيانات بنكية', 'Bank Details') },
    { value: 'medical',      label: t('تقرير طبي', 'Medical Report') },
    { value: 'other',        label: t('أخرى', 'Other') },
  ]

  return (
    <section className="ds-card p-5" dir="rtl">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--fi-emerald)]">DOCUMENT VAULT</p>
          <h2 className="mt-1 text-xl font-black text-[var(--fi-ink)]">{t('رفع وثيقة موظف', 'Upload Employee Document')}</h2>
          <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">{t('PDF، صور، Word — حد أقصى 10 ميغابايت', 'PDF, images, Word — max 10 MB')}</p>
        </div>
        <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <Upload className="size-5" />
        </span>
      </div>

      {state.message && (
        <div className={`mb-4 rounded-lg border px-4 py-3 text-sm font-bold ${state.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {state.message}
        </div>
      )}

      <form action={action} className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-black text-[var(--fi-ink)]">{t('الموظف', 'Employee')}</span>
          <select name="employeeId" required className={inputClass}>
            <option value="">{t('— اختر موظفاً —', '— Select employee —')}</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-black text-[var(--fi-ink)]">{t('نوع الوثيقة', 'Document Type')}</span>
          <select name="docType" className={inputClass}>
            {docTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-black text-[var(--fi-ink)]">{t('عنوان الوثيقة', 'Document Title')}</span>
          <input name="title" required placeholder={t('مثال: بطاقة هوية 2026', 'e.g. ID Card 2026')} className={inputClass} />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-black text-[var(--fi-ink)]">{t('تاريخ الانتهاء (اختياري)', 'Expiry Date (optional)')}</span>
          <input name="expiryDate" type="date" className={inputClass} />
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-2 block text-sm font-black text-[var(--fi-ink)]">{t('الملف', 'File')}</span>
          <input name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
            className="block w-full text-sm font-bold text-[var(--fi-muted)] file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-sm file:font-black file:text-emerald-700 hover:file:bg-emerald-100"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-2 block text-sm font-black text-[var(--fi-ink)]">{t('ملاحظات', 'Notes')}</span>
          <input name="notes" placeholder={t('اختياري...', 'optional...')} className={inputClass} />
        </label>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="fi-primary-button flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-black disabled:opacity-60"
          >
            <Upload className="size-4" />
            {pending ? t('جاري الرفع...', 'Uploading...') : t('رفع الوثيقة', 'Upload Document')}
          </button>
        </div>
      </form>
    </section>
  )
}

export function VerifyDocButton({ docId }: { docId: string }) {
  const { t } = useI18n()
  const [pending, startTransition] = useTransition()
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(async () => { await verifyDocumentAction(docId) })}
      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-black text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
    >
      <ShieldCheck className="size-3.5" />
      {pending ? '...' : t('تحقق', 'Verify')}
    </button>
  )
}

export function DeleteDocButton({ docId, filePath }: { docId: string; filePath: string | null }) {
  const { t } = useI18n()
  const [pending, startTransition] = useTransition()
  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!window.confirm(t('حذف هذه الوثيقة نهائياً؟', 'Permanently delete this document?'))) return
        startTransition(async () => { await deleteDocumentAction(docId, filePath) })
      }}
      className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-black text-red-700 transition hover:bg-red-100 disabled:opacity-50"
    >
      <Trash2 className="size-3.5" />
      {pending ? '...' : t('حذف', 'Delete')}
    </button>
  )
}
