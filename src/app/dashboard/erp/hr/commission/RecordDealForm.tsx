'use client'

import { useActionState } from 'react'
import { BadgeDollarSign } from 'lucide-react'
import { recordDealCommissionAction, type CommissionActionState } from './actions'

type EmployeeOption = { id: string; name: string; jobTitle: string | null; commissionRate: number | null }

const initial: CommissionActionState = { ok: false, message: '' }

const stageOptions = [
  { value: 'reservation', label: 'حجز' },
  { value: 'contract', label: 'توقيع عقد' },
  { value: 'handover', label: 'تسليم وحدة' },
  { value: 'collection', label: 'تحصيل دفعة' },
]

export function RecordDealForm({ employees }: { employees: EmployeeOption[] }) {
  const [state, action, pending] = useActionState(recordDealCommissionAction, initial)

  return (
    <section className="ds-card p-5" dir="rtl">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--fi-emerald)]">COMMISSION ENGINE</p>
          <h2 className="mt-1 text-xl font-black text-[var(--fi-ink)]">تسجيل صفقة جديدة</h2>
          <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">
            العمولة محتسبة تلقائياً: 1.5% حتى 5 مليون — 2% فوقها
          </p>
        </div>
        <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <BadgeDollarSign className="size-5" />
        </span>
      </div>

      {state.message ? (
        <div className={`mb-4 rounded-lg border px-4 py-3 text-sm font-bold ${state.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {state.message}
        </div>
      ) : null}

      <form key={state.ok ? state.message : 'deal-form'} action={action} className="grid gap-4 md:grid-cols-2" noValidate>
        <Field label="الموظف">
          <select name="employeeId" required className={inputClass}>
            <option value="">اختر الموظف</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} — {emp.jobTitle ?? 'غير محدد'} ({emp.commissionRate ?? 'متدرج'}%)
              </option>
            ))}
          </select>
        </Field>

        <Field label="رقم الصفقة">
          <input name="dealRef" required className={inputClass} placeholder="FI-DEAL-2025-001" />
        </Field>

        <Field label="رقم الوحدة">
          <input name="unitRef" className={inputClass} placeholder="B2-1204" />
        </Field>

        <Field label="اسم العميل">
          <input name="clientName" className={inputClass} placeholder="محمد أحمد" />
        </Field>

        <Field label="قيمة البيع (ج.م)">
          <input name="saleValue" type="number" required min={1} step="0.01" className={inputClass} placeholder="0" />
        </Field>

        <Field label="المبلغ المحصّل (ج.م)">
          <input name="collectedAmount" type="number" min={0} step="0.01" className={inputClass} placeholder="0" />
        </Field>

        <Field label="مرحلة الصفقة">
          <select name="dealStage" className={inputClass} defaultValue="reservation">
            {stageOptions.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </Field>

        <Field label="ملاحظات">
          <input name="notes" className={inputClass} placeholder="اختياري" />
        </Field>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="fi-primary-button flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-black disabled:opacity-60"
          >
            {pending ? 'جاري الحساب...' : 'تسجيل الصفقة واحتساب العمولة'}
          </button>
        </div>
      </form>
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-[var(--fi-ink)]">{label}</span>
      {children}
    </label>
  )
}

const inputClass = 'h-11 w-full rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-bold text-[var(--fi-ink)] outline-none transition placeholder:text-[var(--fi-muted)] focus:border-[var(--fi-emerald)] focus:ring-4 focus:ring-emerald-100 dark:bg-white/5'
