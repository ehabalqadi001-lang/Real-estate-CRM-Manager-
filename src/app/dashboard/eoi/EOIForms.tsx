'use client'

import { useActionState } from 'react'
import { Plus, CheckCircle, XCircle, ArrowRightCircle } from 'lucide-react'
import {
  createEOIAction,
  updateEOIStatusAction,
  type EOIActionState,
} from './actions'

type Unit = { id: string; unit_number: string; project_name: string }

const initial: EOIActionState = { ok: false, message: '' }

const inputClass =
  'h-10 w-full rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-bold text-[var(--fi-ink)] outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:bg-white/5'

export function CreateEOIForm({ units }: { units: Unit[] }) {
  const [state, action, pending] = useActionState(createEOIAction, initial)

  return (
    <div className="bg-[var(--fi-paper)] border border-[var(--fi-line)] rounded-2xl overflow-hidden" dir="rtl">
      <div className="flex items-center gap-3 border-b border-[var(--fi-line)] p-4">
        <div className="flex size-9 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
          <Plus size={16} />
        </div>
        <h2 className="font-bold text-[var(--fi-ink)]">خطاب نية جديد</h2>
      </div>

      {state.message && (
        <div className={`mx-4 mt-4 rounded-lg border px-4 py-3 text-sm font-bold ${
          state.ok
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-red-200 bg-red-50 text-red-700'
        }`}>
          {state.message}
        </div>
      )}

      <form action={action} className="grid gap-4 p-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">اسم العميل</span>
          <input name="clientName" required placeholder="الاسم الكامل" className={inputClass} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">رقم الهاتف</span>
          <input name="clientPhone" placeholder="+20 1XX XXX XXXX" className={inputClass} />
        </label>

        <label className="sm:col-span-2 block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">البريد الإلكتروني</span>
          <input name="clientEmail" type="email" placeholder="client@example.com" className={inputClass} />
        </label>

        {units.length > 0 && (
          <label className="sm:col-span-2 block">
            <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">الوحدة (اختياري)</span>
            <select name="unitId" className={inputClass}>
              <option value="">— بدون وحدة محددة —</option>
              {units.map(u => (
                <option key={u.id} value={u.id}>
                  {u.unit_number} — {u.project_name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">المبلغ (ج.م)</span>
          <input name="amount" type="number" min="0" placeholder="اختياري" className={inputClass} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">صلاحية الخطاب (أيام)</span>
          <input name="expiryDays" type="number" min="1" max="90" defaultValue={7} className={inputClass} />
        </label>

        <label className="sm:col-span-2 block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">ملاحظات</span>
          <input name="notes" placeholder="تفاصيل الصفقة أو متطلبات العميل..." className={inputClass} />
        </label>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-sky-700 disabled:opacity-50"
          >
            <Plus size={16} />
            {pending ? 'جاري الإنشاء...' : 'إنشاء خطاب النية'}
          </button>
        </div>
      </form>
    </div>
  )
}

function EOIActionButton({
  eoiId,
  status,
  label,
  icon,
  colorClass,
}: {
  eoiId: string
  status: string
  label: string
  icon: React.ReactNode
  colorClass: string
}) {
  const [, action, pending] = useActionState(updateEOIStatusAction, initial)

  return (
    <form action={action} className="inline">
      <input type="hidden" name="eoiId"   value={eoiId}   />
      <input type="hidden" name="status"  value={status}  />
      <button
        type="submit"
        disabled={pending}
        className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-bold transition disabled:opacity-50 ${colorClass}`}
      >
        {icon}
        {pending ? '...' : label}
      </button>
    </form>
  )
}

export function ApproveEOIButton({ eoiId }: { eoiId: string }) {
  return (
    <EOIActionButton
      eoiId={eoiId}
      status="approved"
      label="اعتماد"
      icon={<CheckCircle size={12} />}
      colorClass="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
    />
  )
}

export function RejectEOIButton({ eoiId }: { eoiId: string }) {
  return (
    <EOIActionButton
      eoiId={eoiId}
      status="rejected"
      label="رفض"
      icon={<XCircle size={12} />}
      colorClass="border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
    />
  )
}

export function ConvertEOIButton({ eoiId }: { eoiId: string }) {
  return (
    <EOIActionButton
      eoiId={eoiId}
      status="converted"
      label="تحويل لصفقة"
      icon={<ArrowRightCircle size={12} />}
      colorClass="border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
    />
  )
}
