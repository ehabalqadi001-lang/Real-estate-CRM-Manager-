'use client'

import { useMemo, useState, useTransition } from 'react'
import { Building2, Loader2, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { CompanyOption } from '@/shared/company-context/server'
import { selectActiveCompanyAction } from '@/shared/company-context/actions'

export function CompanyContextForm({
  activeCompanyId,
  companies,
}: {
  activeCompanyId: string | null
  companies: CompanyOption[]
}) {
  const router = useRouter()
  const [selectedCompanyId, setSelectedCompanyId] = useState(activeCompanyId ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === selectedCompanyId) ?? null,
    [companies, selectedCompanyId],
  )

  function submit() {
    setMessage(null)
    setError(null)

    startTransition(async () => {
      const result = await selectActiveCompanyAction(selectedCompanyId)
      if (!result.success) {
        setError(result.error ?? 'تعذر تغيير الشركة النشطة.')
        return
      }

      setMessage('تم ربط حساب مدير النظام بالشركة المحددة وتحديث سياق التشغيل.')
      router.refresh()
    })
  }

  return (
    <section className="ds-card space-y-5 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[var(--fi-soft)] text-[var(--fi-emerald)]">
          <ShieldCheck className="size-6" aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--fi-emerald)]">SUPER ADMIN CONTEXT</p>
          <h2 className="mt-1 text-xl font-black text-[var(--fi-ink)]">اختيار شركة التشغيل النشطة</h2>
          <p className="mt-2 text-sm font-semibold leading-7 text-[var(--fi-muted)]">
            هذا الاختيار يحدد الشركة التي تعمل عليها صفحات CRM مثل الصفقات، العملاء، الموارد البشرية، وتكاملات المطورين.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>
      ) : null}

      {message ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{message}</div>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
        <label className="space-y-2">
          <span className="flex items-center gap-2 text-sm font-black text-[var(--fi-ink)]">
            <Building2 className="size-4 text-[var(--fi-emerald)]" aria-hidden="true" />
            الشركة
          </span>
          <select
            value={selectedCompanyId}
            onChange={(event) => setSelectedCompanyId(event.target.value)}
            disabled={isPending || companies.length === 0}
            className="min-h-12 w-full rounded-lg border border-[var(--fi-line)] bg-white px-3 text-right text-sm font-bold text-[var(--fi-ink)] outline-none focus:border-[var(--fi-emerald)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="" disabled>
              اختر شركة فعلية
            </option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={submit}
          disabled={isPending || !selectedCompanyId || selectedCompanyId === activeCompanyId}
          className="mt-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[var(--fi-emerald)] px-5 text-sm font-black text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          حفظ وربط الحساب
        </button>
      </div>

      {selectedCompany ? (
        <div className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-soft)] p-4">
          <p className="text-xs font-black text-[var(--fi-muted)]">الشركة المحددة</p>
          <p className="mt-1 text-lg font-black text-[var(--fi-ink)]">{selectedCompany.name}</p>
          <p className="mt-1 text-xs font-bold text-[var(--fi-muted)]">ID: {selectedCompany.id}</p>
        </div>
      ) : null}

      {companies.length === 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-7 text-amber-800">
          لا توجد شركات متاحة للاختيار. أنشئ شركة من لوحة Super Admin أولاً.
        </div>
      ) : null}
    </section>
  )
}
