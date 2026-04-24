import Link from 'next/link'
import { Banknote, CheckCircle2, Clock, Download, ExternalLink, FileCheck2, FileSpreadsheet, Handshake, UserCheck, XCircle, ChevronRight, ChevronLeft, type LucideIcon } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'
import { isManagerRole, isSuperAdmin } from '@/shared/auth/types'
import {
  reviewBrokerSale,
  reviewPartnerApplication,
  updateBrokerSaleLifecycle,
} from './actions'
import AccountManagerAssignmentForm from './AccountManagerAssignmentForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'إدارة الشركاء | FAST INVESTMENT' }

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

const money = (value: number | null | undefined) =>
  new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(Number(value ?? 0))

const applicationStatus: Record<string, string> = {
  pending: 'قيد المراجعة',
  needs_info: 'مطلوب استكمال',
  approved: 'معتمد',
  rejected: 'مرفوض',
}

const saleStage: Record<string, string> = {
  eoi: 'EOI',
  reservation: 'Reservation',
  contract: 'Contract',
}

const lifecycleLabels: Record<string, string> = {
  sale_submitted: 'تم رفع البيع',
  sale_approved: 'تم اعتماد البيع',
  claim_submitted_to_developer: 'تم تقديم المطالبة للمطور',
  developer_commission_collected: 'تم تحصيل العمولة من المطور',
  broker_payout_scheduled: 'تم تحديد موعد صرف الشريك',
  broker_paid: 'تم صرف عمولة الشريك',
  rejected: 'مرفوض',
}

function exportHref(format: 'pdf' | 'excel', params: Record<string, string>) {
  const query = new URLSearchParams({ format })
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value)
  })
  return `/api/brm/export?${query.toString()}`
}

type PartnerDocument = {
  name: string
  path: string
  type?: string
  signedUrl?: string | null
}

function collectPartnerDocuments(value: unknown): PartnerDocument[] {
  if (!value || typeof value !== 'object') return []
  const documents = value as Record<string, unknown>
  const rows: PartnerDocument[] = []

  const add = (label: string, item: unknown) => {
    if (!item || typeof item !== 'object') return
    const record = item as Record<string, unknown>
    const path = String(record.path ?? '').trim()
    if (!path) return
    rows.push({
      name: String(record.name ?? label),
      path,
      type: String(record.type ?? label),
      signedUrl: `/api/documents/download?path=${encodeURIComponent(path)}`
    })
  }

  const addMany = (label: string, items: unknown) => {
    if (!Array.isArray(items)) return
    items.forEach((item, index) => add(`${label} ${index + 1}`, item))
  }

  add('صورة البطاقة وجه', documents.idFront)
  add('صورة البطاقة ظهر', documents.idBack)
  add('صورة بطاقة قديمة', documents.legacyId)
  add('البطاقة الضريبية', documents.taxCard)
  add('بطاقة صاحب الشركة', documents.ownerId)
  add('شهادة القيمة المضافة', documents.vatCertificate)
  add('رخصة/سجل قديم', documents.legacyLicense)
  addMany('السجل التجاري', documents.commercialRegister)

  return rows
}

export default async function PartnersManagementPage({ searchParams }: PageProps) {
  const session = await requireSession()
  
  const getParam = (val: string | string[] | undefined): string => Array.isArray(val) ? val[0] : val || ''
  const currentParams: Record<string, string> = {
    status: getParam(searchParams.status),
    stage: getParam(searchParams.stage),
    lifecycle: getParam(searchParams.lifecycle),
    developer: getParam(searchParams.developer),
    accountManager: getParam(searchParams.accountManager),
    payoutDate: getParam(searchParams.payoutDate),
    appPage: getParam(searchParams.appPage) || '1',
    salePage: getParam(searchParams.salePage) || '1',
  }

  const pdfExportHref = exportHref('pdf', currentParams)
  const excelExportHref = exportHref('excel', currentParams)

  if (!isManagerRole(session.profile.role) && !isSuperAdmin(session.profile.role) && session.profile.role !== 'account_manager') {
    return (
      <main className="p-6" dir="rtl">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm font-black text-red-700">
          غير مصرح لك بفتح إدارة الشركاء.
        </div>
      </main>
    )
  }

  const supabase = await createServerClient()

  const APP_PAGE_SIZE = 10
  const SALE_PAGE_SIZE = 20
  const appPage = parseInt(currentParams.appPage, 10)
  const salePage = parseInt(currentParams.salePage, 10)

  const applyFilters = (query: any) => {
    let q = query
    if (currentParams.status) q = q.eq('status', currentParams.status)
    if (currentParams.stage) q = q.eq('stage', currentParams.stage)
    if (currentParams.lifecycle) q = q.eq('commission_lifecycle_stage', currentParams.lifecycle)
    if (currentParams.accountManager) q = q.eq('assigned_account_manager_id', currentParams.accountManager)
    if (currentParams.payoutDate) q = q.eq('broker_payout_due_date', currentParams.payoutDate)
    if (currentParams.developer) q = q.ilike('developer_name', `%${currentParams.developer}%`)
    return q
  }

  let salesQuery = supabase
    .from('broker_sales_submissions')
    .select('id, broker_user_id, client_name, client_phone, project_name, developer_name, unit_code, deal_value, gross_commission, broker_commission_amount, company_commission_amount, stage, status, documents_review_status, commission_lifecycle_stage, rejection_reason, broker_payout_due_date, commission_id, assigned_account_manager_id, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((salePage - 1) * SALE_PAGE_SIZE, salePage * SALE_PAGE_SIZE - 1)

  salesQuery = applyFilters(salesQuery)
  const kpiSalesQuery = applyFilters(supabase.from('broker_sales_submissions').select('status, commission_lifecycle_stage, broker_commission_amount'))

  const [
    { data: applications, count: applicationsCount },
    { data: sales, count: salesCount },
    { data: accountManagers },
    { data: kpiSales },
    { count: pendingApplicationsCount }
  ] = await Promise.all([
    supabase
      .from('partner_applications')
      .select('id, profile_id, applicant_type, status, full_name, email, phone, company_name, manager_name, manager_phone, owner_phone, facebook_url, review_reason, assigned_account_manager_id, documents, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((appPage - 1) * APP_PAGE_SIZE, appPage * APP_PAGE_SIZE - 1),
    salesQuery,
    supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .in('role', ['account_manager', 'users_am', 'am_supervisor', 'company_admin', 'branch_manager']),
    kpiSalesQuery,
    supabase.from('partner_applications').select('id', { count: 'exact', head: true }).in('status', ['pending', 'needs_info'])
  ])

  const managerById = new Map((accountManagers ?? []).map((m) => [m.id, m.full_name || m.email || 'Account Manager']))

  const appRows = (applications ?? []).map((application) => ({
    ...application,
    reviewDocuments: collectPartnerDocuments(application.documents),
    assignedManagerName: application.assigned_account_manager_id
      ? (managerById.get(application.assigned_account_manager_id) ?? null)
      : null,
  }))
  const saleRows = sales ?? []
  const pendingApplications = pendingApplicationsCount ?? 0
  const submittedSales = (kpiSales ?? []).filter((item: { status: string | null }) => item.status === 'submitted' || item.status === 'under_review').length
  const approvedSales = (kpiSales ?? []).filter((item: { status: string | null }) => item.status === 'approved').length
  const payable = (kpiSales ?? [])
    .filter((item: { commission_lifecycle_stage: string | null }) => item.commission_lifecycle_stage === 'broker_payout_scheduled')
    .reduce((sum: number, item: { broker_commission_amount: number | null }) => sum + Number(item.broker_commission_amount ?? 0), 0)

  return (
    <main className="sales-command space-y-5 p-4 sm:p-6" dir="rtl">
      <section className="sales-hero rounded-3xl p-5 sm:p-6">
        <div className="relative z-10 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-100">FAST INVESTMENT COMMAND CENTER</p>
            <h1 className="mt-3 text-2xl font-black text-white sm:text-4xl">Sale Claims & Partner Growth Desk</h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-7 text-blue-100">
              Real-time BRM control for EOI, reservations, contracts, developer claims, commission collection and partner payouts.
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 text-sm font-black text-white backdrop-blur">
            Every approved claim moves revenue forward.
          </div>
        </div>
        <PaginationControls total={applicationsCount ?? 0} page={appPage} pageSize={APP_PAGE_SIZE} paramName="appPage" searchParams={currentParams} />
      </section>

      <section className="sales-card rounded-3xl border border-[var(--fi-line)] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--fi-emerald)]">BROKER RELATIONSHIP MANAGEMENT</p>
            <h1 className="mt-2 text-2xl font-black text-[var(--fi-ink)]">إدارة علاقات الشركاء</h1>
            <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">
              مراجعة طلبات الشركاء، اعتماد مبيعاتهم، وتتبع دورة العمولات حتى الصرف.
            </p>
          </div>
          <div className="rounded-xl bg-[var(--fi-soft)] px-4 py-3 text-sm font-black text-[var(--fi-emerald)]">
            FAST INVESTMENT
          </div>
        </div>
        <PaginationControls total={salesCount ?? 0} page={salePage} pageSize={SALE_PAGE_SIZE} paramName="salePage" searchParams={currentParams} />
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <Kpi label="طلبات قيد المراجعة" value={pendingApplications.toLocaleString('ar-EG')} icon={Clock} />
        <Kpi label="مبيعات تحتاج اعتماد" value={submittedSales.toLocaleString('ar-EG')} icon={FileCheck2} />
        <Kpi label="مبيعات معتمدة" value={approvedSales.toLocaleString('ar-EG')} icon={CheckCircle2} />
        <Kpi label="جاهز لتحديد الصرف" value={`${money(payable)} ج.م`} icon={Banknote} />
      </section>

      <section className="sales-card rounded-3xl border border-[var(--fi-line)] bg-white shadow-sm">
        <div className="border-b border-[var(--fi-line)] p-5">
          <h2 className="text-lg font-black text-[var(--fi-ink)]">طلبات إنشاء حساب الشركاء</h2>
          <p className="mt-1 text-xs font-bold text-[var(--fi-muted)]">اعتماد أو رفض الحسابات مع تعيين Account Manager.</p>
        </div>
        <div className="divide-y divide-[var(--fi-line)]">
          {appRows.length === 0 ? (
            <EmptyState label="لا توجد طلبات شركاء حتى الآن" />
          ) : appRows.map((application) => (
            <article key={application.id} className="grid gap-4 p-5 transition hover:bg-white/60 xl:grid-cols-[minmax(0,1fr)_420px]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[var(--fi-soft)] px-3 py-1 text-xs font-black text-[var(--fi-emerald)]">
                    {application.applicant_type === 'company' ? 'شركة' : 'Broker / Freelancer'}
                  </span>
                  <span className="rounded-full border border-[var(--fi-line)] px-3 py-1 text-xs font-black text-[var(--fi-muted)]">
                    {applicationStatus[application.status ?? 'pending'] ?? application.status}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-black text-[var(--fi-ink)]">
                  {application.company_name || application.full_name || application.email}
                </h3>
                <div className="mt-2 grid gap-2 text-xs font-semibold text-[var(--fi-muted)] md:grid-cols-2">
                  <span>الإيميل: {application.email}</span>
                  <span>الهاتف: {application.phone || application.manager_phone || 'غير محدد'}</span>
                  <span>مدير الشركة: {application.manager_name || 'غير محدد'}</span>
                  <span>المالك: {application.owner_phone || 'غير محدد'}</span>
                  <span className={`col-span-2 flex items-center gap-1 ${application.assignedManagerName ? 'text-[var(--fi-emerald)]' : ''}`}>
                    Account Manager:{' '}
                    <strong>{application.assignedManagerName ?? 'غير مُعيَّن'}</strong>
                  </span>
                </div>
                {application.review_reason && (
                  <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs font-bold text-amber-700">{application.review_reason}</p>
                )}
                <div className="mt-4 rounded-xl border border-[var(--fi-line)] bg-[var(--fi-soft)] p-3">
                  <p className="text-xs font-black text-[var(--fi-ink)]">مستندات الاعتماد</p>
                  {application.reviewDocuments.length === 0 ? (
                    <p className="mt-2 text-xs font-bold text-[var(--fi-muted)]">لا توجد مستندات مرفوعة لهذا الطلب.</p>
                  ) : (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {application.reviewDocuments.map((document) => (
                        <a
                          key={`${application.id}-${document.path}`}
                          href={document.signedUrl ?? '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="flex min-h-10 items-center justify-between gap-2 rounded-lg border border-[var(--fi-line)] bg-white px-3 text-xs font-black text-[var(--fi-ink)] hover:border-[var(--fi-emerald)]"
                        >
                          <span className="truncate">{document.name}</span>
                          <ExternalLink className="size-3.5 shrink-0 text-[var(--fi-emerald)]" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <AccountManagerAssignmentForm
                  applicationId={application.id}
                  assignedAccountManagerId={application.assigned_account_manager_id}
                  accountManagers={accountManagers ?? []}
                />
                {application.status === 'pending' || application.status === 'needs_info' ? (
                  <ReviewApplicationForm applicationId={application.id} />
                ) : (
                  <div className="rounded-xl border border-[var(--fi-line)] bg-[var(--fi-soft)] p-4 text-center text-sm font-black text-[var(--fi-muted)]">
                    تمت مراجعة الطلب: {applicationStatus[application.status ?? 'pending'] ?? application.status}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="sales-card rounded-3xl border border-[var(--fi-line)] bg-white shadow-sm">
        <div className="border-b border-[var(--fi-line)] p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-lg font-black text-[var(--fi-ink)]">مبيعات الشركاء ودورة العمولات</h2>
              <p className="mt-1 text-xs font-bold text-[var(--fi-muted)]">فلترة حسب Account Manager، المطور، المرحلة، وموعد الصرف.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={pdfExportHref} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--fi-line)] bg-white px-3 text-xs font-black text-[var(--fi-ink)] hover:bg-[var(--fi-soft)]">
                <Download className="size-4" /> PDF
              </a>
              <a href={excelExportHref} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--fi-line)] bg-white px-3 text-xs font-black text-[var(--fi-ink)] hover:bg-[var(--fi-soft)]">
                <FileSpreadsheet className="size-4" /> Excel
              </a>
            </div>
          </div>
          <form className="mt-4 grid gap-2 md:grid-cols-6" action="/dashboard/partners">
            <select name="status" defaultValue={currentParams.status} className="h-10 rounded-lg border border-[var(--fi-line)] bg-white px-3 text-xs font-bold">
              <option value="">كل الحالات</option>
              <option value="submitted">قيد المراجعة</option>
              <option value="approved">معتمد</option>
              <option value="rejected">مرفوض</option>
            </select>
            <select name="stage" defaultValue={currentParams.stage} className="h-10 rounded-lg border border-[var(--fi-line)] bg-white px-3 text-xs font-bold">
              <option value="">كل المراحل</option>
              <option value="eoi">EOI</option>
              <option value="reservation">Reservation</option>
              <option value="contract">Contract</option>
            </select>
            <select name="lifecycle" defaultValue={currentParams.lifecycle} className="h-10 rounded-lg border border-[var(--fi-line)] bg-white px-3 text-xs font-bold">
              <option value="">كل دورات العمولة</option>
              <option value="sale_approved">اعتماد البيع</option>
              <option value="claim_submitted_to_developer">مطالبة المطور</option>
              <option value="developer_commission_collected">تم التحصيل</option>
              <option value="broker_payout_scheduled">موعد صرف</option>
              <option value="broker_paid">مصروف</option>
            </select>
            <select name="accountManager" defaultValue={currentParams.accountManager} className="h-10 rounded-lg border border-[var(--fi-line)] bg-white px-3 text-xs font-bold">
              <option value="">كل Account Managers</option>
              {(accountManagers ?? []).map((manager) => (
                <option key={manager.id} value={manager.id}>{manager.full_name || manager.email}</option>
              ))}
            </select>
            <input name="developer" defaultValue={currentParams.developer} placeholder="بحث بالمطور" className="h-10 rounded-lg border border-[var(--fi-line)] bg-white px-3 text-xs font-bold" />
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <input name="payoutDate" defaultValue={currentParams.payoutDate} type="date" className="h-10 rounded-lg border border-[var(--fi-line)] bg-white px-3 text-xs font-bold" />
              <button className="sales-primary h-10 rounded-xl px-3 text-xs font-black text-white">فلترة</button>
            </div>
          </form>
        </div>
        <div className="divide-y divide-[var(--fi-line)]">
          {saleRows.length === 0 ? (
            <EmptyState label="لا توجد مبيعات مطابقة للفلاتر الحالية" />
          ) : saleRows.map((sale) => (
            <article key={sale.id} className="grid gap-4 p-5 transition hover:bg-white/60 xl:grid-cols-[minmax(0,1fr)_460px]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{saleStage[sale.stage ?? 'eoi']}</span>
                  <span className="rounded-full bg-[var(--fi-soft)] px-3 py-1 text-xs font-black text-[var(--fi-emerald)]">
                    {lifecycleLabels[sale.commission_lifecycle_stage ?? 'sale_submitted']}
                  </span>
                  <span className="rounded-full border border-[var(--fi-line)] px-3 py-1 text-xs font-black text-[var(--fi-muted)]">{sale.status}</span>
                  <span className="rounded-full border border-[var(--fi-line)] px-3 py-1 text-xs font-black text-[var(--fi-muted)]">المستندات: {sale.documents_review_status ?? 'pending'}</span>
                </div>
                <h3 className="mt-3 text-base font-black text-[var(--fi-ink)]">{sale.project_name}</h3>
                <div className="mt-2 grid gap-2 text-xs font-semibold text-[var(--fi-muted)] md:grid-cols-2">
                  <span>العميل: {sale.client_name}</span>
                  <span>المطور: {sale.developer_name || 'غير محدد'}</span>
                  <span>الوحدة: {sale.unit_code || 'غير محدد'}</span>
                  <span>قيمة البيع: {money(sale.deal_value)} ج.م</span>
                  <span>إجمالي العمولة: {money(sale.gross_commission)} ج.م</span>
                  <span>عمولة الشريك: {money(sale.broker_commission_amount)} ج.م</span>
                </div>
                {sale.rejection_reason && <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs font-bold text-red-700">{sale.rejection_reason}</p>}
                <Link href={`/dashboard/partners/sales/${sale.id}`} className="mt-3 inline-flex h-9 items-center justify-center rounded-lg border border-[var(--fi-line)] px-3 text-xs font-black text-[var(--fi-ink)] hover:bg-[var(--fi-soft)]">
                  تفاصيل ومراجعة المستندات
                </Link>
              </div>

              <div className="space-y-3">
                {(sale.status === 'submitted' || sale.status === 'under_review') && <ReviewSaleForm saleId={sale.id} />}
                {sale.status === 'approved' && <LifecycleForm saleId={sale.id} current={sale.commission_lifecycle_stage ?? 'sale_approved'} />}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

function PaginationControls({ total, page, pageSize, paramName, searchParams }: { total: number, page: number, pageSize: number, paramName: string, searchParams: Record<string, string> }) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null

  const buildUrl = (p: number) => {
    const query = new URLSearchParams(searchParams)
    query.set(paramName, p.toString())
    return `?${query.toString()}`
  }

  return (
    <div className="flex items-center justify-between border-t border-[var(--fi-line)] p-4 bg-white rounded-b-3xl">
      <p className="text-xs text-[var(--fi-muted)] font-bold">
        عرض {((page - 1) * pageSize) + 1} إلى {Math.min(page * pageSize, total)} من {total}
      </p>
      <div className="flex gap-2">
        {page > 1 && <Link href={buildUrl(page - 1)} className="inline-flex h-8 items-center justify-center rounded-lg border border-[var(--fi-line)] px-3 text-xs font-black text-[var(--fi-ink)] hover:bg-[var(--fi-soft)]"><ChevronRight className="size-4 ml-1" /> السابق</Link>}
        {page < totalPages && <Link href={buildUrl(page + 1)} className="inline-flex h-8 items-center justify-center rounded-lg border border-[var(--fi-line)] px-3 text-xs font-black text-[var(--fi-ink)] hover:bg-[var(--fi-soft)]">التالي <ChevronLeft className="size-4 mr-1" /></Link>}
      </div>
    </div>
  )
}

function Kpi({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className="sales-kpi rounded-3xl border border-[var(--fi-line)] bg-white p-4 shadow-sm">
      <Icon className="size-5 text-[var(--sales-blue)]" />
      <p className="mt-3 text-xl font-black text-[var(--fi-ink)]">{value}</p>
      <p className="mt-1 text-xs font-bold text-[var(--fi-muted)]">{label}</p>
    </div>
  )
}

function ReviewApplicationForm({ applicationId }: { applicationId: string }) {
  return (
    <form action={reviewPartnerApplication} className="space-y-2 rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-soft)]/70 p-3">
      <input type="hidden" name="applicationId" value={applicationId} />
      <textarea name="reason" rows={2} placeholder="سبب الرفض أو طلب الاستكمال" className="w-full rounded-lg border border-[var(--fi-line)] bg-white p-3 text-sm font-semibold outline-none" />
      <div className="grid grid-cols-3 gap-2">
        <button name="decision" value="approved" className="sales-success inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-black text-white"><UserCheck className="size-4" /> اعتماد</button>
        <button name="decision" value="needs_info" className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-xs font-black text-white"><Clock className="size-4" /> استكمال</button>
        <button name="decision" value="rejected" className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-black text-white"><XCircle className="size-4" /> رفض</button>
      </div>
    </form>
  )
}

function ReviewSaleForm({ saleId }: { saleId: string }) {
  return (
    <form action={reviewBrokerSale} className="space-y-2 rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-soft)]/70 p-3">
      <input type="hidden" name="saleId" value={saleId} />
      <textarea name="reason" rows={2} placeholder="سبب الرفض إن وجد" className="w-full rounded-lg border border-[var(--fi-line)] bg-white p-3 text-sm font-semibold outline-none" />
      <div className="grid grid-cols-2 gap-2">
        <button name="decision" value="approved" className="sales-success rounded-xl px-3 py-2 text-xs font-black text-white">اعتماد البيع وإنشاء العمولة</button>
        <button name="decision" value="rejected" className="rounded-lg bg-red-600 px-3 py-2 text-xs font-black text-white">رفض البيع</button>
      </div>
    </form>
  )
}

function LifecycleForm({ saleId, current }: { saleId: string; current: string }) {
  return (
    <form action={updateBrokerSaleLifecycle} className="space-y-2 rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-soft)]/70 p-3">
      <input type="hidden" name="saleId" value={saleId} />
      <select name="lifecycle" defaultValue={current} className="h-10 w-full rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-bold">
        <option value="claim_submitted_to_developer">تقديم المطالبة للمطور</option>
        <option value="developer_commission_collected">تحصيل العمولة من المطور</option>
        <option value="broker_payout_scheduled">تحديد موعد صرف الشريك</option>
        <option value="broker_paid">صرف عمولة الشريك</option>
      </select>
      <div className="grid gap-2 sm:grid-cols-3">
        <input name="collectedAmount" type="number" placeholder="المبلغ المحصل" className="h-10 rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-semibold" />
        <input name="brokerPayoutDueDate" type="date" className="h-10 rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-semibold" />
        <input name="paymentReference" placeholder="مرجع الدفع" className="h-10 rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-semibold" />
      </div>
      <button className="sales-primary w-full rounded-xl px-3 py-2 text-xs font-black text-white">تحديث مرحلة العمولة</button>
    </form>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="p-10 text-center">
      <Handshake className="mx-auto mb-3 size-9 text-slate-200" />
      <p className="text-sm font-bold text-[var(--fi-muted)]">{label}</p>
    </div>
  )
}
