'use client'

import { useActionState } from 'react'
import { Plus, X, Clock } from 'lucide-react'
import {
  createReservationAction,
  cancelReservationAction,
  extendReservationAction,
  type ReservationActionState,
} from './actions'

type Unit = { id: string; unit_number: string; project_name: string }

const initial: ReservationActionState = { ok: false, message: '' }

const inputClass =
  'h-10 w-full rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-bold text-[var(--fi-ink)] outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:bg-white/5'

export function CreateReservationForm({ availableUnits }: { availableUnits: Unit[] }) {
  const [state, action, pending] = useActionState(createReservationAction, initial)

  return (
    <div className="bg-[var(--fi-paper)] border border-[var(--fi-line)] rounded-2xl overflow-hidden" dir="rtl">
      <div className="flex items-center gap-3 border-b border-[var(--fi-line)] p-4">
        <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <Plus size={16} />
        </div>
        <h2 className="font-bold text-[var(--fi-ink)]">حجز جديد</h2>
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
        <label className="sm:col-span-2 block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">الوحدة</span>
          <select name="unitId" required className={inputClass}>
            <option value="">— اختر وحدة متاحة —</option>
            {availableUnits.map(u => (
              <option key={u.id} value={u.id}>
                {u.unit_number} — {u.project_name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">اسم العميل</span>
          <input name="clientName" required placeholder="الاسم الكامل" className={inputClass} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">رقم الهاتف</span>
          <input name="clientPhone" placeholder="+20 1XX XXX XXXX" className={inputClass} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">رسوم الحجز (ج.م)</span>
          <input name="reservationFee" type="number" min="0" defaultValue={0} className={inputClass} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">مبلغ التأمين (ج.م)</span>
          <input name="depositAmount" type="number" min="0" placeholder="اختياري" className={inputClass} />
        </label>

        <label className="sm:col-span-2 block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">ملاحظات</span>
          <input name="notes" placeholder="أي تفاصيل إضافية..." className={inputClass} />
        </label>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            <Plus size={16} />
            {pending ? 'جاري الحفظ...' : 'تأكيد الحجز'}
          </button>
        </div>
      </form>
    </div>
  )
}

export function CancelReservationButton({ reservationId }: { reservationId: string }) {
  const [, action, pending] = useActionState(cancelReservationAction, initial)

  return (
    <form action={action} className="inline">
      <input type="hidden" name="reservationId" value={reservationId} />
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
      >
        <X size={12} />
        {pending ? '...' : 'إلغاء'}
      </button>
    </form>
  )
}

export function ExtendReservationButton({
  reservationId,
  extensionCount,
  maxExtensions,
}: {
  reservationId: string
  extensionCount: number
  maxExtensions: number
}) {
  const [, action, pending] = useActionState(extendReservationAction, initial)
  const exhausted = extensionCount >= maxExtensions

  return (
    <form action={action} className="inline">
      <input type="hidden" name="reservationId" value={reservationId} />
      <button
        type="submit"
        disabled={pending || exhausted}
        title={exhausted ? 'وصلت للحد الأقصى للتمديد' : 'تمديد 48 ساعة'}
        className="flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 transition hover:bg-amber-100 disabled:opacity-40"
      >
        <Clock size={12} />
        {pending ? '...' : `تمديد (${extensionCount}/${maxExtensions})`}
      </button>
    </form>
  )
}
