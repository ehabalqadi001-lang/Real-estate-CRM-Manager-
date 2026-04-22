'use client'

import { useActionState } from 'react'
import { Link2, UserCog } from 'lucide-react'
import { linkDeveloperAccountAction, type DeveloperAccountActionState } from './actions'

type DeveloperOption = { id: string; name: string | null; name_ar: string | null }
type UserOption = { id: string; full_name: string | null; email: string | null; role: string | null }

const initialState: DeveloperAccountActionState = { ok: false, message: '' }
const inputClass = 'h-11 rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-bold text-[var(--fi-ink)] outline-none focus:border-[var(--fi-emerald)] dark:bg-white/5'

export function DeveloperAccountForm({
  developers,
  users,
}: {
  developers: DeveloperOption[]
  users: UserOption[]
}) {
  const [state, action, pending] = useActionState(linkDeveloperAccountAction, initialState)

  return (
    <section className="ds-card p-5" dir="rtl">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[var(--fi-soft)] text-[var(--fi-emerald)]">
          <UserCog className="size-5" />
        </span>
        <div>
          <h2 className="text-xl font-black text-[var(--fi-ink)]">ربط حساب مطور</h2>
          <p className="mt-1 text-sm font-semibold leading-7 text-[var(--fi-muted)]">
            اربط مستخدماً بمطور محدد ليتمكن من الدخول إلى Developer Hub.
          </p>
        </div>
      </div>

      {state.message ? (
        <div className={`mb-4 rounded-lg border px-4 py-3 text-sm font-bold ${state.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {state.message}
        </div>
      ) : null}

      <form action={action} className="grid gap-4">
        <select name="userId" className={inputClass} defaultValue="" required>
          <option value="">اختر المستخدم</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.full_name ?? user.email ?? user.id} · {user.role ?? 'بدون دور'}
            </option>
          ))}
        </select>
        <select name="developerId" className={inputClass} defaultValue="" required>
          <option value="">اختر المطور</option>
          {developers.map((developer) => (
            <option key={developer.id} value={developer.id}>
              {developer.name_ar ?? developer.name ?? developer.id}
            </option>
          ))}
        </select>
        <select name="role" className={inputClass} defaultValue="developer_sales">
          <option value="developer_admin">مدير المطور</option>
          <option value="developer_manager">مدير مبيعات المطور</option>
          <option value="developer_sales">مبيعات المطور</option>
          <option value="content_manager">مسؤول محتوى</option>
          <option value="viewer">مشاهد</option>
        </select>
        <button type="submit" disabled={pending} className="fi-primary-button flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-black disabled:opacity-60">
          <Link2 className="size-4" />
          {pending ? 'جاري الربط...' : 'ربط الحساب'}
        </button>
      </form>
    </section>
  )
}
