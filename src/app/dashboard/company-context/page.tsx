import { redirect } from 'next/navigation'
import { requireSession } from '@/shared/auth/session'
import { isSuperAdmin } from '@/shared/auth/types'
import { getActiveCompanyContext } from '@/shared/company-context/server'
import { CompanyContextForm } from './CompanyContextForm'

export const dynamic = 'force-dynamic'

export default async function CompanyContextPage() {
  const session = await requireSession()
  if (!isSuperAdmin(session.profile.role)) redirect('/dashboard')

  const context = await getActiveCompanyContext(session)

  return (
    <main className="space-y-6 p-4 sm:p-6" dir="rtl">
      <section className="ds-card p-5 sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--fi-emerald)]">FAST INVESTMENT OS</p>
        <h1 className="mt-2 text-2xl font-black text-[var(--fi-ink)] sm:text-3xl">سياق الشركة النشطة</h1>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-7 text-[var(--fi-muted)]">
          اربط حساب Super Admin بشركة فعلية قبل تنفيذ العمليات التشغيلية حتى لا تعتمد الصفحات على معرف المستخدم كبديل للشركة.
        </p>
      </section>

      <CompanyContextForm activeCompanyId={context.companyId} companies={context.options} />
    </main>
  )
}
