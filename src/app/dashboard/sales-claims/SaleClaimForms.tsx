'use client'

import { useActionState } from 'react'
import { Plus, CheckCircle, XCircle, Eye, Banknote } from 'lucide-react'
import {
  createSaleClaimAction,
  reviewClaimAction,
  markClaimPaidAction,
  type ClaimActionState,
} from './actions'

type Unit = { id: string; unit_number: string }

const initial: ClaimActionState = { ok: false, message: '' }

const inputClass =
  'h-10 w-full rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-bold text-[var(--fi-ink)] outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:bg-white/5'

export function CreateSaleClaimForm({ units }: { units: Unit[] }) {
  const [state, action, pending] = useActionState(createSaleClaimAction, initial)

  return (
    <div className="bg-[var(--fi-paper)] border border-[var(--fi-line)] rounded-2xl overflow-hidden" dir="rtl">
      <div className="flex items-center gap-3 border-b border-[var(--fi-line)] p-4">
        <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <Plus size={16} />
        </div>
        <div>
          <h2 className="font-bold text-[var(--fi-ink)]">مطالبة بيع جديدة</h2>
          <p className="text-xs text-[var(--fi-muted)]">رفع عملية بيع للمراجعة والاعتماد</p>
        </div>
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

        {/* Buyer info */}
        <div className="sm:col-span-2">
          <p className="text-xs font-black text-[var(--fi-muted)] uppercase tracking-widest mb-3 pb-2 border-b border-[var(--fi-line)]">
            بيانات المشتري
          </p>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">اسم المشتري *</span>
          <input name="buyerName" required placeholder="الاسم الكامل" className={inputClass} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">رقم الهاتف</span>
          <input name="buyerPhone" placeholder="+20 1XX XXX XXXX" className={inputClass} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">البريد الإلكتروني</span>
          <input name="buyerEmail" type="email" placeholder="buyer@example.com" className={inputClass} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">الرقم القومي</span>
          <input name="buyerNationalId" placeholder="14 رقماً" maxLength={14} className={inputClass} />
        </label>

        {/* Unit & financial */}
        <div className="sm:col-span-2 mt-1">
          <p className="text-xs font-black text-[var(--fi-muted)] uppercase tracking-widest mb-3 pb-2 border-b border-[var(--fi-line)]">
            تفاصيل البيع
          </p>
        </div>

        {units.length > 0 && (
          <label className="sm:col-span-2 block">
            <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">الوحدة</span>
            <select name="unitId" className={inputClass}>
              <option value="">— اختر وحدة (اختياري) —</option>
              {units.map(u => (
                <option key={u.id} value={u.id}>{u.unit_number}</option>
              ))}
            </select>
          </label>
        )}

        <label className="block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">سعر البيع (ج.م) *</span>
          <input name="salePrice" type="number" min="1" required placeholder="0" className={inputClass} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">الدفعة المقدمة (ج.م)</span>
          <input name="downPayment" type="number" min="0" placeholder="اختياري" className={inputClass} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">نسبة العمولة (%)</span>
          <input name="commissionRate" type="number" min="0" max="100" step="0.1" placeholder="مثال: 2.5" className={inputClass} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">سنوات التقسيط</span>
          <input name="installmentYears" type="number" min="0" max="30" placeholder="0 = نقداً" className={inputClass} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">تاريخ التعاقد</span>
          <input name="contractDate" type="date" className={inputClass} />
        </label>

        <label className="sm:col-span-2 block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">ملاحظات</span>
          <textarea
            name="notes"
            placeholder="أي تفاصيل إضافية عن الصفقة..."
            rows={2}
            className="w-full rounded-lg border border-[var(--fi-line)] bg-white px-3 py-2 text-sm font-bold text-[var(--fi-ink)] outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:bg-white/5 resize-none"
          />
        </label>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            <Plus size={16} />
            {pending ? 'جاري الرفع...' : 'رفع مطالبة البيع'}
          </button>
        </div>
      </form>
    </div>
  )
}

function ReviewButton({
  claimId,
  status,
  label,
  colorClass,
  icon,
}: {
  claimId: string
  status: string
  label: string
  colorClass: string
  icon: React.ReactNode
}) {
  const [, action, pending] = useActionState(reviewClaimAction, initial)

  return (
    <form action={action} className="inline">
      <input type="hidden" name="claimId" value={claimId} />
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

export function ApproveClaimButton({ claimId }: { claimId: string }) {
  return (
    <ReviewButton
      claimId={claimId}
      status="approved"
      label="اعتماد"
      icon={<CheckCircle size={12} />}
      colorClass="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
    />
  )
}

export function RejectClaimButton({ claimId }: { claimId: string }) {
  return (
    <ReviewButton
      claimId={claimId}
      status="rejected"
      label="رفض"
      icon={<XCircle size={12} />}
      colorClass="border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
    />
  )
}

export function ReviewClaimButton({ claimId }: { claimId: string }) {
  return (
    <ReviewButton
      claimId={claimId}
      status="under_review"
      label="قيد المراجعة"
      icon={<Eye size={12} />}
      colorClass="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
    />
  )
}

export function MarkPaidButton({ claimId }: { claimId: string }) {
  const [state, action, pending] = useActionState(markClaimPaidAction, initial)

  return (
    <form action={action} className="inline">
      <input type="hidden" name="claimId" value={claimId} />
      {state.message && !state.ok && (
        <p className="text-xs text-red-600 mb-1">{state.message}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
      >
        <Banknote size={12} />
        {pending ? '...' : 'صرف العمولة'}
      </button>
    </form>
  )
}
