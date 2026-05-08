'use client'

import { useActionState } from 'react'
import { Plus, X, Clock, ArrowRightCircle } from 'lucide-react'
import {
  createReservationAction,
  cancelReservationAction,
  extendReservationAction,
  convertReservationToDealAction,
  type ReservationActionState,
} from './actions'
import { useI18n } from '@/hooks/use-i18n'

type Unit = { id: string; unit_number: string; project_name: string }

const initial: ReservationActionState = { ok: false, message: '' }

const inputClass =
  'h-10 w-full rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-bold text-[var(--fi-ink)] outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:bg-white/5'

export function CreateReservationForm({ availableUnits }: { availableUnits: Unit[] }) {
  const { t } = useI18n()
  const [state, action, pending] = useActionState(createReservationAction, initial)

  return (
    <div className="bg-[var(--fi-paper)] border border-[var(--fi-line)] rounded-2xl overflow-hidden" dir="rtl">
      <div className="flex items-center gap-3 border-b border-[var(--fi-line)] p-4">
        <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <Plus size={16} />
        </div>
        <h2 className="font-bold text-[var(--fi-ink)]">{t('حجز جديد', 'New Reservation')}</h2>
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
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">{t('الوحدة', 'Unit')}</span>
          <select name="unitId" required className={inputClass}>
            <option value="">{t('— اختر وحدة متاحة —', '— Select available unit —')}</option>
            {availableUnits.map(u => (
              <option key={u.id} value={u.id}>
                {u.unit_number} — {u.project_name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">{t('اسم العميل', 'Client Name')}</span>
          <input name="clientName" required placeholder={t('الاسم الكامل', 'Full name')} className={inputClass} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">{t('رقم الهاتف', 'Phone')}</span>
          <input name="clientPhone" placeholder="+20 1XX XXX XXXX" className={inputClass} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">{t('رسوم الحجز (ج.م)', 'Reservation Fee (EGP)')}</span>
          <input name="reservationFee" type="number" min="0" defaultValue={0} className={inputClass} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">{t('مبلغ التأمين (ج.م)', 'Deposit Amount (EGP)')}</span>
          <input name="depositAmount" type="number" min="0" placeholder={t('اختياري', 'optional')} className={inputClass} />
        </label>

        <label className="sm:col-span-2 block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">{t('ملاحظات', 'Notes')}</span>
          <input name="notes" placeholder={t('أي تفاصيل إضافية...', 'Any additional details...')} className={inputClass} />
        </label>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            <Plus size={16} />
            {pending ? t('جاري الحفظ...', 'Saving...') : t('تأكيد الحجز', 'Confirm Reservation')}
          </button>
        </div>
      </form>
    </div>
  )
}

export function CancelReservationButton({ reservationId }: { reservationId: string }) {
  const { t } = useI18n()
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
        {pending ? '...' : t('إلغاء', 'Cancel')}
      </button>
    </form>
  )
}

export function ConvertReservationButton({ reservationId }: { reservationId: string }) {
  const { t } = useI18n()
  const [state, action, pending] = useActionState(convertReservationToDealAction, initial)

  return (
    <form action={action} className="inline">
      <input type="hidden" name="reservationId" value={reservationId} />
      {state.message && (
        <p className={`text-xs mb-1 ${state.ok ? 'text-emerald-600' : 'text-red-600'}`}>
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 transition hover:bg-sky-100 disabled:opacity-50"
      >
        <ArrowRightCircle size={12} />
        {pending ? '...' : t('تحويل لصفقة', 'Convert to Deal')}
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
  const { t } = useI18n()
  const [, action, pending] = useActionState(extendReservationAction, initial)
  const exhausted = extensionCount >= maxExtensions

  return (
    <form action={action} className="inline">
      <input type="hidden" name="reservationId" value={reservationId} />
      <button
        type="submit"
        disabled={pending || exhausted}
        title={exhausted ? t('وصلت للحد الأقصى للتمديد', 'Maximum extensions reached') : t('تمديد 48 ساعة', 'Extend 48 hours')}
        className="flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 transition hover:bg-amber-100 disabled:opacity-40"
      >
        <Clock size={12} />
        {pending ? '...' : `${t('تمديد', 'Extend')} (${extensionCount}/${maxExtensions})`}
      </button>
    </form>
  )
}
