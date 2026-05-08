'use client'

import { useActionState } from 'react'
import { Plus, BookOpen } from 'lucide-react'
import { createAccountAction, type AccountActionState } from './actions'
import { useI18n } from '@/hooks/use-i18n'

type Account = { id: string; account_code: string; account_name: string; account_type: string }

const initial: AccountActionState = { ok: false, message: '' }

const inputClass =
  'h-10 w-full rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-bold text-[var(--fi-ink)] outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:bg-white/5'

export function CreateAccountForm({ parentAccounts }: { parentAccounts: Account[] }) {
  const { t } = useI18n()
  const [state, action, pending] = useActionState(createAccountAction, initial)

  const ACCOUNT_TYPES = [
    { value: 'asset',     label: t('أصل', 'Asset') },
    { value: 'liability', label: t('التزام', 'Liability') },
    { value: 'equity',    label: t('حقوق ملكية', 'Equity') },
    { value: 'revenue',   label: t('إيراد', 'Revenue') },
    { value: 'expense',   label: t('مصروف', 'Expense') },
  ]

  return (
    <div className="bg-[var(--fi-paper)] border border-[var(--fi-line)] rounded-2xl overflow-hidden" dir="rtl">
      <div className="flex items-center gap-3 border-b border-[var(--fi-line)] p-4">
        <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <BookOpen size={16} />
        </div>
        <h2 className="font-bold text-[var(--fi-ink)]">{t('إضافة حساب جديد', 'Add New Account')}</h2>
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
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">{t('كود الحساب', 'Account Code')}</span>
          <input name="accountCode" required placeholder={t('مثال: 1010', 'e.g. 1010')} className={inputClass} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">{t('نوع الحساب', 'Account Type')}</span>
          <select name="accountType" className={inputClass}>
            {ACCOUNT_TYPES.map(acct => (
              <option key={acct.value} value={acct.value}>{acct.label}</option>
            ))}
          </select>
        </label>

        <label className="sm:col-span-2 block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">{t('اسم الحساب', 'Account Name')}</span>
          <input name="accountName" required placeholder={t('مثال: النقدية والبنوك', 'e.g. Cash & Banks')} className={inputClass} />
        </label>

        {parentAccounts.length > 0 && (
          <label className="sm:col-span-2 block">
            <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">{t('الحساب الرئيسي (اختياري)', 'Parent Account (optional)')}</span>
            <select name="parentId" className={inputClass}>
              <option value="">{t('— لا يوجد — (حساب رئيسي)', '— None — (top-level account)')}</option>
              {parentAccounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.account_code} — {a.account_name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="sm:col-span-2 block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">{t('وصف (اختياري)', 'Description (optional)')}</span>
          <input name="description" placeholder={t('وصف مختصر للحساب...', 'Brief account description...')} className={inputClass} />
        </label>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            <Plus size={16} />
            {pending ? t('جاري الحفظ...', 'Saving...') : t('إضافة الحساب', 'Add Account')}
          </button>
        </div>
      </form>
    </div>
  )
}
