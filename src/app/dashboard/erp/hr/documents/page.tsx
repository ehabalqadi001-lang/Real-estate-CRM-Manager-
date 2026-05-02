import { getI18n } from '@/lib/i18n'
import { redirect } from 'next/navigation'
import { FileText, ShieldCheck, AlertTriangle, Upload } from 'lucide-react'
import { createRawClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'
import type { AppRole } from '@/shared/auth/types'
import { nullableUuid } from '@/lib/uuid'
import { BentoGrid, BentoKpiCard } from '@/components/dashboard/BentoDashboardLayout'
import { AnimatedCount } from '@/components/design-system/animated-count'
import { UploadDocumentForm, VerifyDocButton, DeleteDocButton } from './DocumentControls'

export const dynamic = 'force-dynamic'

const HR_ROLES: AppRole[] = ['super_admin', 'platform_admin', 'hr_manager', 'hr_staff', 'hr_officer', 'finance_manager']
const HR_WRITE_ROLES: AppRole[] = ['super_admin', 'platform_admin', 'hr_manager', 'hr_staff', 'hr_officer']

type Doc = {
  id: string
  employee_id: string
  doc_type: string
  title: string
  file_path: string | null
  file_name: string | null
  file_size_bytes: number | null
  mime_type: string | null
  notes: string | null
  expiry_date: string | null
  verified: boolean
  created_at: string
  profiles: { full_name: string | null } | null
}

const docTypeLabel: Record<string, string> = {
  id_card:      'بطاقة هوية',
  contract:     'عقد عمل',
  offer_letter: 'خطاب عرض',
  certificate:  'شهادة',
  bank:         'بيانات بنكية',
  medical:      'تقرير طبي',
  other:        'أخرى',
}

const docTypeColor: Record<string, string> = {
  id_card:      'bg-blue-50 text-blue-700',
  contract:     'bg-emerald-50 text-emerald-700',
  offer_letter: 'bg-violet-50 text-violet-700',
  certificate:  'bg-amber-50 text-amber-700',
  bank:         'bg-teal-50 text-teal-700',
  medical:      'bg-pink-50 text-pink-700',
  other:        'bg-slate-100 text-slate-600',
}

function formatBytes(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default async function DocumentsPage() {
  const { dir } = await getI18n()
  const session = await requireSession()
  const { profile } = session
  if (!HR_ROLES.includes(profile.role)) redirect('/dashboard')

  const supabase = await createRawClient()
  const companyId = nullableUuid(profile.company_id) ?? nullableUuid(profile.tenant_id)

  let docsQuery = supabase
    .from('employee_documents')
    .select(`
      id, employee_id, doc_type, title, file_path, file_name, file_size_bytes,
      mime_type, notes, expiry_date, verified, created_at,
      profiles!employee_documents_employee_id_fkey(full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(300)
  if (companyId) docsQuery = docsQuery.eq('company_id', companyId)

  let empQuery = supabase
    .from('employees')
    .select('id, profiles!employees_id_fkey(full_name)')
    .eq('status', 'active')
  if (companyId) empQuery = empQuery.eq('company_id', companyId)

  const [docsResult, empResult] = await Promise.all([docsQuery, empQuery])

  const docs = ((docsResult.data ?? []) as unknown as Doc[]).map((d) => ({
    ...d,
    profiles: Array.isArray(d.profiles) ? d.profiles[0] : d.profiles,
  }))

  const employees = ((empResult.data ?? []) as unknown as Array<{
    id: string
    profiles: { full_name: string | null } | { full_name: string | null }[] | null
  }>).map((e) => ({
    id: e.id,
    name: (Array.isArray(e.profiles) ? e.profiles[0] : e.profiles)?.full_name ?? 'موظف',
  }))

  const canWrite    = HR_WRITE_ROLES.includes(profile.role)
  const today       = new Date().toISOString().slice(0, 10)
  const in30Days    = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const verifiedCount  = docs.filter((d) => d.verified).length
  const pendingVerify  = docs.filter((d) => !d.verified).length
  const expiringDocs   = docs.filter((d) => d.expiry_date && d.expiry_date >= today && d.expiry_date <= in30Days)
  const expiredDocs    = docs.filter((d) => d.expiry_date && d.expiry_date < today)

  // Group by employee
  const byEmployee = Object.values(
    docs.reduce<Record<string, { name: string; docs: Doc[] }>>((acc, d) => {
      if (!acc[d.employee_id]) {
        acc[d.employee_id] = { name: d.profiles?.full_name ?? 'موظف', docs: [] }
      }
      acc[d.employee_id].docs.push(d)
      return acc
    }, {}),
  ).sort((a, b) => a.name.localeCompare(b.name, 'ar'))

  return (
    <main className="space-y-6 p-4 sm:p-6">
      <section className="ds-card p-5">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--fi-emerald)]">DOCUMENT VAULT</p>
        <h1 className="mt-2 text-2xl font-black text-[var(--fi-ink)] sm:text-3xl">وثائق الموظفين</h1>
        <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">
          رفع وإدارة عقود العمل، الهويات، الشهادات، وكل وثائق الموظفين.
        </p>
      </section>

      <BentoGrid>
        <BentoKpiCard title="إجمالي الوثائق"    value={<AnimatedCount value={docs.length} />}          hint="مرفوعة"              icon={<FileText className="size-5" />} />
        <BentoKpiCard title="موثّقة ومُتحقق منها" value={<AnimatedCount value={verifiedCount} />}        hint="verified"            icon={<ShieldCheck className="size-5" />} />
        <BentoKpiCard title="بانتظار التحقق"     value={<AnimatedCount value={pendingVerify} />}         hint="لم تُتحقق بعد"       icon={<Upload className="size-5" />} />
        <BentoKpiCard title="تنتهي خلال 30 يوم"  value={<AnimatedCount value={expiringDocs.length} />}   hint="تحتاج تجديد"         icon={<AlertTriangle className="size-5" />} />
      </BentoGrid>

      {/* Expiry alerts */}
      {(expiredDocs.length > 0 || expiringDocs.length > 0) && (
        <section className="ds-card overflow-hidden border-2 border-red-200">
          <div className="border-b border-red-200 bg-red-50 p-5">
            <h2 className="text-xl font-black text-red-800">
              تنبيهات الوثائق ({expiredDocs.length} منتهية + {expiringDocs.length} قريبة)
            </h2>
          </div>
          <div className="divide-y divide-[var(--fi-line)]">
            {[...expiredDocs, ...expiringDocs].map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div>
                  <p className="text-sm font-black text-[var(--fi-ink)]">{d.profiles?.full_name ?? '—'} — {d.title}</p>
                  <p className="mt-0.5 text-xs font-bold text-[var(--fi-muted)]">
                    {docTypeLabel[d.doc_type] ?? d.doc_type} · تنتهي:{' '}
                    {d.expiry_date ? new Intl.DateTimeFormat('ar-EG', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d.expiry_date)) : '—'}
                  </p>
                </div>
                <span className={`text-xs font-black ${d.expiry_date && d.expiry_date < today ? 'text-red-600' : 'text-amber-600'}`}>
                  {d.expiry_date && d.expiry_date < today ? 'منتهية' : 'قريباً'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {canWrite && <UploadDocumentForm employees={employees} />}

      {/* Documents grouped by employee */}
      {byEmployee.length > 0 ? (
        <div className="space-y-4">
          {byEmployee.map(({ name, docs: empDocs }) => (
            <section key={name} className="ds-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-[var(--fi-line)] px-5 py-3">
                <p className="font-black text-[var(--fi-ink)]">{name}</p>
                <span className="text-xs font-bold text-[var(--fi-muted)]">{empDocs.length} وثيقة</span>
              </div>
              <div className="divide-y divide-[var(--fi-line)]">
                {empDocs.map((d) => {
                  const isExpired  = d.expiry_date && d.expiry_date < today
                  const isExpiring = d.expiry_date && d.expiry_date >= today && d.expiry_date <= in30Days
                  return (
                    <div key={d.id} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <span className={`mt-0.5 rounded-full px-2.5 py-1 text-xs font-black ${docTypeColor[d.doc_type] ?? 'bg-slate-100 text-slate-600'}`}>
                          {docTypeLabel[d.doc_type] ?? d.doc_type}
                        </span>
                        <div>
                          <p className="text-sm font-black text-[var(--fi-ink)]">{d.title}</p>
                          <p className="mt-0.5 text-xs text-[var(--fi-muted)]">
                            {d.file_name && `${d.file_name} · `}
                            {formatBytes(d.file_size_bytes)}
                            {d.expiry_date && (
                              <span className={`mr-2 ${isExpired ? 'text-red-500' : isExpiring ? 'text-amber-500' : ''}`}>
                                · ينتهي: {new Intl.DateTimeFormat('ar-EG', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d.expiry_date))}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {d.verified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
                            <ShieldCheck className="size-3" /> موثّقة
                          </span>
                        ) : canWrite ? (
                          <VerifyDocButton docId={d.id} />
                        ) : (
                          <span className="text-xs font-bold text-amber-600">لم تُتحقق</span>
                        )}
                        {d.file_path && (
                          <a
                            href={`/api/erp/documents/${encodeURIComponent(d.file_path)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--fi-line)] bg-white px-2.5 py-1.5 text-xs font-black text-[var(--fi-ink)] transition hover:border-[var(--fi-emerald)] dark:bg-white/5"
                          >
                            عرض
                          </a>
                        )}
                        {canWrite && <DeleteDocButton docId={d.id} filePath={d.file_path} />}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <section className="ds-card border-2 border-dashed border-[var(--fi-line)] p-10 text-center">
          <FileText className="mx-auto mb-3 size-10 text-[var(--fi-muted)]" />
          <p className="font-black text-[var(--fi-ink)]">لا توجد وثائق مرفوعة بعد</p>
          <p className="mt-1 text-sm font-bold text-[var(--fi-muted)]">
            استخدم نموذج الرفع لإضافة وثائق الموظفين.
          </p>
        </section>
      )}
    </main>
  )
}
