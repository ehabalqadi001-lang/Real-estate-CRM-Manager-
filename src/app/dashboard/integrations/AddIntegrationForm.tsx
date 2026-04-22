'use client'

import { useActionState } from 'react'
import { PlugZap } from 'lucide-react'
import { createIntegrationAction, type IntegrationActionState } from './actions'

type DeveloperOption = { id: string; name_ar: string | null; name: string | null }

const initialState: IntegrationActionState = { ok: false, message: '' }
const inputClass =
  'h-11 w-full rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-bold text-[var(--fi-ink)] outline-none focus:border-[var(--fi-emerald)] dark:bg-white/5'

export function AddIntegrationForm({ developers }: { developers: DeveloperOption[] }) {
  const [state, action, pending] = useActionState(createIntegrationAction, initialState)

  return (
    <section className="ds-card p-5" dir="rtl">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-lg bg-[var(--fi-soft)] text-[var(--fi-emerald)]">
          <PlugZap className="size-5" />
        </span>
        <div>
          <h2 className="text-xl font-black text-[var(--fi-ink)]">إضافة API Gateway</h2>
          <p className="text-sm font-semibold text-[var(--fi-muted)]">
            استقبال بيانات المخزون والأسعار وخطط السداد من المطورين.
          </p>
        </div>
      </div>

      {state.message ? (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm font-bold ${
            state.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <form action={action} className="grid gap-4 sm:grid-cols-2">
        <input name="name" className={inputClass} placeholder="اسم التكامل" required />
        <input name="provider" className={inputClass} placeholder="اسم المزود / المطور" required />
        <select name="developerId" className={inputClass} defaultValue="">
          <option value="">بدون مطور محدد</option>
          {developers.map((developer) => (
            <option key={developer.id} value={developer.id}>
              {developer.name_ar || developer.name}
            </option>
          ))}
        </select>
        <select name="integrationType" className={inputClass} defaultValue="inventory">
          <option value="inventory">المخزون</option>
          <option value="prices">الأسعار</option>
          <option value="payment_plans">خطط السداد</option>
          <option value="availability">التوافر</option>
          <option value="webhook">Webhook</option>
        </select>
        <input name="baseUrl" className={`${inputClass} sm:col-span-2`} placeholder="https://developer.example.com/api/feed" />
        <input name="syncFrequencyMinutes" type="number" min={5} className={inputClass} placeholder="كل 60 دقيقة" />
        <button type="submit" disabled={pending} className="fi-primary-button min-h-11 rounded-lg px-4 text-sm font-black disabled:opacity-60">
          {pending ? 'جاري الحفظ...' : 'حفظ التكامل'}
        </button>
      </form>
    </section>
  )
}
