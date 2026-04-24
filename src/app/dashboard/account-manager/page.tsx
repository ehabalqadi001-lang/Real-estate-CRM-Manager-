import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireSession } from '@/shared/auth/session'
import { hasPermission } from '@/shared/rbac/permissions'
import { createServiceRoleClient } from '@/lib/supabase/service'
import {
  Users, Banknote, Clock, CheckCircle2, TrendingUp, ExternalLink,
  UserCheck, FileCheck2, AlertTriangle, type LucideIcon,
} from 'lucide-react'
import { reviewBrokerSale, updateBrokerSaleLifecycle } from '@/app/dashboard/partners/actions'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'لوحة Account Manager | FAST INVESTMENT' }

const money = (v: number | null | undefined) =>
  new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(Number(v ?? 0))

const lifecycleLabels: Record<string, string> = {
  sale_submitted: 'تم رفع البيع',
  sale_approved: 'تم اعتماد البيع',
  claim_submitted_to_developer: 'تقديم المطالبة للمطور',
  developer_commission_collected: 'تم تحصيل العمولة',
  broker_payout_scheduled: 'موعد الصرف محدد',
  broker_paid: 'تم الصرف',
  rejected: 'مرفوض',
}

const stageLabels: Record<string, string> = {
  eoi: 'EOI', reservation: 'Reservation', contract: 'Contract',
}

const statusColors: Record<string, string> = {
  submitted: 'bg-amber-50 text-amber-700',
  under_review: 'bg-blue-50 text-blue-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-600',
}

export default async function AccountManagerDashboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await requireSession()

  if (!hasPermission(session.profile.role, 'account_manager.view_portfolio')) {
    redirect('/dashboard')
  }

  const service = createServiceRoleClient()
  const amId = session.user.id
  const isAdmin = session.profile.role === 'super_admin' || session.profile.role === 'company_admin' || session.profile.role === 'platform_admin'

  const sp = (await searchParams) as Record<string, string>
  const filterStatus = sp.status ?? ''
  const filterLifecycle = sp.lifecycle ?? ''

  // 1. Brokers assigned to this AM (or all if admin)
  let brokersQuery = service
    .from('broker_profiles')
    .select('profile_id, display_name, verification_status, account_manager_id')
    .order('display_name')

  if (!isAdmin) brokersQuery = brokersQuery.eq('account_manager_id', amId)

  const { data: myBrokers } = await brokersQuery

  const brokerIds = (myBrokers ?? []).map((b) => b.profile_id)

  if (brokerIds.length === 0 && !isAdmin) {
    return (
      <div className="space-y-6 p-4 sm:p-6" dir="rtl">
        <PageHeader amName={session.profile.full_name} isAdmin={isAdmin} />
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <UserCheck className="mx-auto mb-3 size-10 text-amber-400" />
          <p className="font-black text-amber-800">لم يتم تعيين أي شركاء لك بعد</p>
          <p className="mt-1 text-sm font-semibold text-amber-700">تواصل مع قسم الـ HR لتعيين الشركاء المسؤول عنهم.</p>
        </div>
      </div>
    )
  }

  // 2. Sales from my brokers
  let salesQuery = service
    .from('broker_sales_submissions')
    .select('id, broker_user_id, client_name, project_name, developer_name, unit_code, deal_value, gross_commission, broker_commission_amount, stage, status, commission_lifecycle_stage, rejection_reason, broker_payout_due_date, assigned_account_manager_id, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  if (!isAdmin) salesQuery = salesQuery.eq('assigned_account_manager_id', amId)
  if (filterStatus) salesQuery = salesQuery.eq('status', filterStatus)
  if (filterLifecycle) salesQuery = salesQuery.eq('commission_lifecycle_stage', filterLifecycle)

  // 3. KPI query (unfiltered by status/lifecycle for totals)
  let kpiQuery = service
    .from('broker_sales_submissions')
    .select('status, commission_lifecycle_stage, broker_commission_amount')

  if (!isAdmin) kpiQuery = kpiQuery.eq('assigned_account_manager_id', amId)

  const [{ data: sales }, { data: kpiSales }] = await Promise.all([salesQuery, kpiQuery])

  const kpi = kpiSales ?? []
  const pendingSales = kpi.filter((s) => s.status === 'submitted' || s.status === 'under_review').length
  const approvedSales = kpi.filter((s) => s.status === 'approved').length
  const totalCommission = kpi
    .filter((s) => s.status === 'approved')
    .reduce((sum, s) => sum + Number(s.broker_commission_amount ?? 0), 0)
  const paidCommission = kpi
    .filter((s) => s.commission_lifecycle_stage === 'broker_paid')
    .reduce((sum, s) => sum + Number(s.broker_commission_amount ?? 0), 0)

  const verifiedBrokers = (myBrokers ?? []).filter((b) => b.verification_status === 'verified').length

  return (
    <div className="space-y-6 p-4 sm:p-6" dir="rtl">
      <PageHeader amName={session.profile.full_name} isAdmin={isAdmin} />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi icon={Users} label="شركاء معيَّنون" value={String(brokerIds.length)} accent="blue" />
        <Kpi icon={UserCheck} label="شركاء معتمدون" value={String(verifiedBrokers)} accent="emerald" />
        <Kpi icon={Clock} label="مبيعات للمراجعة" value={String(pendingSales)} accent="amber" />
        <Kpi icon={CheckCircle2} label="مبيعات معتمدة" value={String(approvedSales)} accent="emerald" />
        <Kpi icon={Banknote} label="إجمالي العمولات" value={`${money(totalCommission)} ج.م`} accent="blue" sub={`مصروف: ${money(paidCommission)} ج.م`} />
      </div>

      {/* Pending sales alert */}
      {pendingSales > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <AlertTriangle className="size-5 shrink-0 text-amber-500" />
          <p className="text-sm font-black text-amber-800">
            {pendingSales} مبيعة تحتاج مراجعتك — يُرجى إتمام المراجعة لضمان سير دورة العمولة
          </p>
        </div>
      )}

      {/* My Brokers Summary */}
      <section className="rounded-2xl border border-[var(--fi-line)] bg-white shadow-sm dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-[var(--fi-line)] px-5 py-4">
          <div>
            <h2 className="font-black text-[var(--fi-ink)] dark:text-white">الشركاء المعيَّنون لي</h2>
            <p className="mt-0.5 text-xs font-semibold text-[var(--fi-muted)]">{brokerIds.length} شريك في محفظتك</p>
          </div>
          <Link
            href="/dashboard/partners"
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-[var(--fi-line)] px-3 text-xs font-black text-[var(--fi-ink)] hover:bg-[var(--fi-soft)]"
          >
            إدارة الشركاء الكاملة <ExternalLink className="size-3.5" />
          </Link>
        </div>
        {(myBrokers ?? []).length === 0 ? (
          <p className="p-6 text-sm font-semibold text-[var(--fi-muted)]">لا يوجد شركاء</p>
        ) : (
          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {(myBrokers ?? []).slice(0, 12).map((broker) => (
              <div key={broker.profile_id} className="flex items-center justify-between rounded-xl border border-[var(--fi-line)] bg-[var(--fi-soft)] px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-[var(--fi-ink)] dark:text-white">
                    {broker.display_name ?? broker.profile_id.slice(0, 8)}
                  </p>
                </div>
                <span className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-black ${broker.verification_status === 'verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {broker.verification_status === 'verified' ? 'معتمد' : broker.verification_status}
                </span>
              </div>
            ))}
            {(myBrokers ?? []).length > 12 && (
              <p className="col-span-full text-center text-xs font-bold text-[var(--fi-muted)]">
                + {(myBrokers ?? []).length - 12} شريك آخر
              </p>
            )}
          </div>
        )}
      </section>

      {/* Sales Section */}
      <section className="rounded-2xl border border-[var(--fi-line)] bg-white shadow-sm dark:bg-gray-900">
        <div className="border-b border-[var(--fi-line)] p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="font-black text-[var(--fi-ink)] dark:text-white">مبيعات الشركاء</h2>
              <p className="mt-0.5 text-xs font-semibold text-[var(--fi-muted)]">مراجعة وإدارة دورة عمولات شركائك</p>
            </div>
            <Link
              href="/dashboard/partners"
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-[var(--fi-line)] px-3 text-xs font-black text-[var(--fi-ink)] hover:bg-[var(--fi-soft)]"
            >
              <TrendingUp className="size-3.5" /> عرض الكل
            </Link>
          </div>

          {/* Filter */}
          <form action="/dashboard/account-manager" className="mt-4 flex flex-wrap gap-2">
            <select name="status" defaultValue={filterStatus} className="h-9 rounded-lg border border-[var(--fi-line)] bg-[var(--fi-soft)] px-3 text-xs font-semibold outline-none focus:border-[var(--fi-emerald)]">
              <option value="">كل الحالات</option>
              <option value="submitted">قيد المراجعة</option>
              <option value="approved">معتمد</option>
              <option value="rejected">مرفوض</option>
            </select>
            <select name="lifecycle" defaultValue={filterLifecycle} className="h-9 rounded-lg border border-[var(--fi-line)] bg-[var(--fi-soft)] px-3 text-xs font-semibold outline-none focus:border-[var(--fi-emerald)]">
              <option value="">كل المراحل</option>
              <option value="sale_approved">اعتمدت</option>
              <option value="claim_submitted_to_developer">مطالبة المطور</option>
              <option value="developer_commission_collected">تم التحصيل</option>
              <option value="broker_payout_scheduled">موعد الصرف</option>
              <option value="broker_paid">مصروف</option>
            </select>
            <button className="h-9 rounded-xl bg-[var(--fi-emerald)] px-4 text-xs font-black text-white hover:opacity-90">فلترة</button>
            {(filterStatus || filterLifecycle) && (
              <Link href="/dashboard/account-manager" className="inline-flex h-9 items-center rounded-lg border border-[var(--fi-line)] px-3 text-xs font-black text-[var(--fi-muted)] hover:bg-[var(--fi-soft)]">
                إلغاء الفلاتر
              </Link>
            )}
          </form>
        </div>

        <div className="divide-y divide-[var(--fi-line)]">
          {(sales ?? []).length === 0 ? (
            <div className="flex flex-col items-center p-12 text-center">
              <FileCheck2 className="mb-3 size-10 text-gray-200" />
              <p className="text-sm font-bold text-[var(--fi-muted)]">لا توجد مبيعات مطابقة</p>
            </div>
          ) : (
            (sales ?? []).map((sale) => (
              <article key={sale.id} className="grid gap-4 p-4 sm:p-5 xl:grid-cols-[1fr_400px]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700">
                      {stageLabels[sale.stage ?? 'eoi']}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${statusColors[sale.status ?? 'submitted'] ?? 'bg-gray-50 text-gray-500'}`}>
                      {sale.status}
                    </span>
                    <span className="rounded-full border border-[var(--fi-line)] px-2.5 py-1 text-[11px] font-black text-[var(--fi-muted)]">
                      {lifecycleLabels[sale.commission_lifecycle_stage ?? 'sale_submitted']}
                    </span>
                  </div>
                  <h3 className="mt-3 font-black text-[var(--fi-ink)] dark:text-white">{sale.project_name}</h3>
                  <div className="mt-2 grid gap-1.5 text-xs font-semibold text-[var(--fi-muted)] sm:grid-cols-2">
                    <span>العميل: {sale.client_name}</span>
                    <span>المطور: {sale.developer_name || '—'}</span>
                    <span>الوحدة: {sale.unit_code || '—'}</span>
                    <span>قيمة البيع: {money(sale.deal_value)} ج.م</span>
                    <span>عمولة الشريك: {money(sale.broker_commission_amount)} ج.م</span>
                    {sale.broker_payout_due_date && <span>موعد الصرف: {sale.broker_payout_due_date}</span>}
                  </div>
                  {sale.rejection_reason && (
                    <p className="mt-3 rounded-lg bg-red-50 p-2 text-xs font-bold text-red-700">{sale.rejection_reason}</p>
                  )}
                  <Link
                    href={`/dashboard/partners/sales/${sale.id}`}
                    className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--fi-line)] px-3 text-xs font-black text-[var(--fi-ink)] hover:bg-[var(--fi-soft)]"
                  >
                    تفاصيل ومستندات <ExternalLink className="size-3" />
                  </Link>
                </div>

                <div className="space-y-2">
                  {(sale.status === 'submitted' || sale.status === 'under_review') && (
                    <ReviewSaleForm saleId={sale.id} />
                  )}
                  {sale.status === 'approved' && (
                    <LifecycleForm saleId={sale.id} current={sale.commission_lifecycle_stage ?? 'sale_approved'} />
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  )
}

function PageHeader({ amName, isAdmin }: { amName: string | null; isAdmin: boolean }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#0a1628] to-[#0d2d44] p-5 sm:p-6 text-white">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-300">ACCOUNT MANAGER PORTAL</p>
      <h1 className="mt-2 text-2xl font-black sm:text-3xl">
        {isAdmin ? 'لوحة تحكم مديري الحسابات' : `أهلاً، ${amName ?? 'Account Manager'}`}
      </h1>
      <p className="mt-2 text-sm font-semibold text-blue-200">
        {isAdmin
          ? 'عرض شامل لمحافظ جميع مديري الحسابات ومبيعاتهم'
          : 'محفظة شركائك، مبيعاتهم، ودورة عمولاتهم في مكان واحد'}
      </p>
    </div>
  )
}

function Kpi({ icon: Icon, label, value, accent, sub }: {
  icon: LucideIcon; label: string; value: string; accent: 'blue' | 'amber' | 'emerald'; sub?: string
}) {
  const colors = {
    blue: 'text-blue-600 bg-blue-50',
    amber: 'text-amber-600 bg-amber-50',
    emerald: 'text-[var(--fi-emerald)] bg-[var(--fi-soft)]',
  }
  return (
    <div className="rounded-2xl border border-[var(--fi-line)] bg-white p-4 shadow-sm dark:bg-gray-900">
      <div className={`inline-flex size-9 items-center justify-center rounded-lg ${colors[accent]}`}>
        <Icon className="size-5" />
      </div>
      <p className="mt-3 text-xl font-black text-[var(--fi-ink)] dark:text-white">{value}</p>
      <p className="text-xs font-semibold text-[var(--fi-muted)]">{label}</p>
      {sub && <p className="mt-1 text-[11px] font-semibold text-[var(--fi-muted)]">{sub}</p>}
    </div>
  )
}

function ReviewSaleForm({ saleId }: { saleId: string }) {
  return (
    <form action={reviewBrokerSale} className="space-y-2 rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-soft)] p-3">
      <input type="hidden" name="saleId" value={saleId} />
      <textarea name="reason" rows={2} placeholder="سبب الرفض إن وجد" className="w-full rounded-lg border border-[var(--fi-line)] bg-white p-2.5 text-sm font-semibold outline-none resize-none" />
      <div className="grid grid-cols-2 gap-2">
        <button name="decision" value="approved" className="rounded-xl bg-[var(--fi-emerald)] py-2 text-xs font-black text-white hover:opacity-90">
          اعتماد البيع
        </button>
        <button name="decision" value="rejected" className="rounded-lg bg-red-600 py-2 text-xs font-black text-white hover:opacity-90">
          رفض البيع
        </button>
      </div>
    </form>
  )
}

function LifecycleForm({ saleId, current }: { saleId: string; current: string }) {
  return (
    <form action={updateBrokerSaleLifecycle} className="space-y-2 rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-soft)] p-3">
      <input type="hidden" name="saleId" value={saleId} />
      <select name="lifecycle" defaultValue={current} className="h-9 w-full rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-bold outline-none">
        <option value="claim_submitted_to_developer">تقديم المطالبة للمطور</option>
        <option value="developer_commission_collected">تحصيل العمولة من المطور</option>
        <option value="broker_payout_scheduled">تحديد موعد الصرف</option>
        <option value="broker_paid">صرف عمولة الشريك</option>
      </select>
      <div className="grid gap-2 sm:grid-cols-3">
        <input name="collectedAmount" type="number" placeholder="المبلغ المحصل" className="h-9 rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-semibold outline-none" />
        <input name="brokerPayoutDueDate" type="date" className="h-9 rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-semibold outline-none" />
        <input name="paymentReference" placeholder="مرجع الدفع" className="h-9 rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-semibold outline-none" />
      </div>
      <button className="w-full rounded-xl bg-blue-600 py-2 text-xs font-black text-white hover:opacity-90">
        تحديث مرحلة العمولة
      </button>
    </form>
  )
}
