'use client'

import { useActionState } from 'react'
import { Save } from 'lucide-react'
import { updateBatchMappingAction, type MappingReviewState } from './actions'

const INVENTORY_MAPPING_FIELDS = [
  'ignore',
  'developer_name',
  'project_name',
  'unit_number',
  'building',
  'floor_number',
  'unit_type',
  'area_sqm',
  'price',
  'status',
  'down_payment',
  'monthly_installment',
  'installment_years',
] as const

const FIELD_LABELS: Record<string, string> = {
  ignore: 'تجاهل',
  developer_name: 'اسم المطور',
  project_name: 'اسم المشروع',
  unit_number: 'رقم الوحدة',
  building: 'المبنى',
  floor_number: 'الدور',
  unit_type: 'نوع الوحدة',
  area_sqm: 'المساحة',
  price: 'السعر',
  status: 'الحالة',
  down_payment: 'المقدم',
  monthly_installment: 'القسط الشهري',
  installment_years: 'سنوات التقسيط',
}

const initialState: MappingReviewState = { ok: false, message: '' }

export function MappingReviewForm({
  batchId,
  headers,
  mapping,
}: {
  batchId: string
  headers: string[]
  mapping: Record<string, string>
}) {
  const [state, formAction, pending] = useActionState(updateBatchMappingAction, initialState)

  return (
    <form action={formAction} className="ds-card overflow-hidden">
      <input type="hidden" name="batchId" value={batchId} />
      <div className="border-b border-[var(--fi-line)] p-5">
        <h2 className="text-xl font-black text-[var(--fi-ink)]">مراجعة Auto-Mapping</h2>
        <p className="mt-1 text-sm font-semibold leading-7 text-[var(--fi-muted)]">
          راجع ربط أعمدة الملف قبل تطبيق الصفوف على جدول الوحدات. الحقول الأساسية: اسم المشروع، رقم الوحدة، السعر.
        </p>
      </div>

      {state.message ? (
        <div className={`mx-5 mt-5 rounded-lg border p-3 text-sm font-bold ${state.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {state.message}
        </div>
      ) : null}

      <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
        {headers.map((header) => (
          <label key={header} className="space-y-2 rounded-lg border border-[var(--fi-line)] bg-white p-3 dark:bg-white/5">
            <span className="block truncate text-xs font-black text-[var(--fi-muted)]">{header}</span>
            <select
              name={`mapping:${header}`}
              defaultValue={mapping[header] ?? 'ignore'}
              className="h-10 w-full rounded-lg border border-[var(--fi-line)] bg-[var(--fi-soft)] px-3 text-sm font-bold text-[var(--fi-ink)] outline-none focus:border-[var(--fi-emerald)]"
            >
              {INVENTORY_MAPPING_FIELDS.map((field) => (
                <option key={field} value={field}>
                  {FIELD_LABELS[field] ?? field}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <div className="border-t border-[var(--fi-line)] p-5">
        <button
          type="submit"
          disabled={pending}
          className="fi-primary-button inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-black disabled:opacity-60"
        >
          <Save className="size-4" aria-hidden="true" />
          {pending ? 'جار حفظ المراجعة...' : 'حفظ المراجعة'}
        </button>
      </div>
    </form>
  )
}
