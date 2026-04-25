import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Star, Phone, Mail, Shield, Calendar, Briefcase, DollarSign,
  FileText, TrendingUp, User, PauseCircle, Settings, Building2,
  BadgeCheck, AlertTriangle,
} from 'lucide-react'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requireSession } from '@/shared/auth/session'
import { hasPermission } from '@/shared/rbac/permissions'
import {
  TabNav, HoldPanel, CommissionPanel, PasswordResetPanel, BackButton,
  type Tab,
} from './BrokerProfileClient'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | undefined>>
}

/* ─── helpers ──────────────────────────────────────────────────── */

const fmt = (n: number) =>
  new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(n)

const fmtMoney = (n: number) =>
  new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(n)

const fmtDate = (d: string | null) =>
  d ? new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium' }).format(new Date(d)) : '—'

const TIER_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  platinum: { label: 'بلاتينيوم', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  gold:     { label: 'ذهبي',      color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  silver:   { label: 'فضي',       color: 'text-slate-600',  bg: 'bg-slate-100', border: 'border-slate-200' },
  bronze:   { label: 'برونزي',    color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  verified:    { label: 'موثّق ومعتمد',   color: 'text-emerald-700', bg: 'bg-emerald-50' },
  pending:     { label: 'في انتظار المراجعة', color: 'text-amber-700',  bg: 'bg-amber-50' },
  under_review:{ label: 'قيد المراجعة',   color: 'text-blue-700',   bg: 'bg-blue-50' },
  rejected:    { label: 'مرفوض',          color: 'text-red-700',    bg: 'bg-red-50' },
  suspended:   { label: 'موقوف',          color: 'text-orange-700', bg: 'bg-orange-50' },
}

const SALE_STATUS: Record<string, { label: string; cls: string }> = {
  submitted:    { label: 'قيد المراجعة',  cls: 'bg-amber-50 text-amber-700' },
  under_review: { label: 'جارٍ المراجعة', cls: 'bg-blue-50 text-blue-700' },
  approved:     { label: 'معتمدة',        cls: 'bg-emerald-50 text-emerald-700' },
  rejected:     { label: 'مرفوضة',        cls: 'bg-red-50 text-red-600' },
}

const STAGE_LABELS: Record<string, string> = {
  eoi: 'EOI', reservation: 'حجز', contract: 'عقد',
}

const LIFECYCLE_LABELS: Record<string, string> = {
  sale_submitted: 'تم رفع البيع',
  sale_approved: 'تم اعتماد البيع',
  claim_submitted_to_developer: 'مطالبة المطور',
  developer_commission_collected: 'تم تحصيل عمولة المطور',
  broker_payout_scheduled: 'موعد الصرف محدد',
  broker_paid: 'تم الصرف للشريك',
  rejected: 'مرفوض',
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--fi-line)] bg-white shadow-sm dark:bg-gray-900">
      <div className="flex items-center gap-2.5 border-b border-[var(--fi-line)] px-5 py-4">
        <span className="flex size-7 items-center justify-center rounded-lg bg-[var(--fi-emerald)]/10">
          <Icon className="size-4 text-[var(--fi-emerald)]" />
        </span>
        <h2 className="text-sm font-black text-[var(--fi-ink)]">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function InfoItem({ label, value, dir: d }: { label: string; value: string | null | undefined; dir?: 'rtl' | 'ltr' }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--fi-muted)]">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-[var(--fi-ink)]" dir={d}>{value || '—'}</p>
    </div>
  )
}

/* ─── Page ─────────────────────────────────────────────────────── */

export default async function BrokerProfilePage({ params, searchParams }: PageProps) {
  const [{ id }, sp, session] = await Promise.all([params, searchParams, requireSession()])

  if (!hasPermission(session.profile.role, 'broker.view.company') && !hasPermission(session.profile.role, 'account_manager.view_portfolio')) {
    redirect('/dashboard')
  }

  const canManage = hasPermission(session.profile.role, 'broker.manage') || hasPermission(session.profile.role, 'account_manager.manage_portfolio')
  const tab = (sp.tab as Tab) || 'profile'
  const service = createServiceRoleClient()

  // Load broker profile
  const { data: broker, error } = await service
    .from('broker_profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error || !broker) notFound()

  const brokerCode = `BR-${broker.id.substring(0, 6).toUpperCase()}`
  const initials = (broker.full_name ?? broker.display_name ?? 'BR').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const tier = TIER_CFG[broker.tier] ?? TIER_CFG.bronze
  const vstatus = STATUS_CFG[broker.verification_status] ?? STATUS_CFG.pending
  const isHeld = broker.verification_status === 'suspended'
  const profileId = broker.profile_id as string | null

  // Fetch account manager name
  let amName: string | null = null
  if (broker.account_manager_id) {
    const { data: am } = await service
      .from('profiles')
      .select('full_name, email')
      .eq('id', broker.account_manager_id)
      .maybeSingle()
    amName = am?.full_name ?? am?.email ?? null
  }

  // Fetch sales if needed (profile, sales, commission tabs)
  let sales: Record<string, unknown>[] = []
  if (profileId && ['profile', 'sales', 'commission'].includes(tab)) {
    const { data } = await service
      .from('broker_sales_submissions')
      .select('id, status, lifecycle_stage, client_name, client_phone, stage, deal_value, unit_value, agent_amount, commission_rate, project_id, developer_id, rejection_reason, documents, created_at')
      .eq('broker_user_id', profileId)
      .order('created_at', { ascending: false })
      .limit(200)
    sales = (data ?? []) as Record<string, unknown>[]
  }

  // Fetch documents if needed
  let brokerDocs: Record<string, unknown>[] = []
  if (['profile', 'documents'].includes(tab)) {
    const { data } = await service
      .from('broker_documents')
      .select('id, type, name, status, url, created_at')
      .eq('broker_profile_id', broker.id)
      .order('created_at', { ascending: false })
    brokerDocs = (data ?? []) as Record<string, unknown>[]
  }

  // KPI
  const totalSales = sales.reduce((s, sale) => s + Number(sale.deal_value ?? sale.unit_value ?? 0), 0)
  const approvedSales = sales.filter((s) => s.status === 'approved')
  const pendingCommission = approvedSales.reduce((s, sale) => s + Number(sale.agent_amount ?? 0), 0)
  const brokerTotalDeals = Number(broker.total_deals ?? 0)
  const brokerTotalSales = Number(broker.total_sales ?? 0)

  return (
    <div className="min-h-screen space-y-5 p-4 sm:p-6" dir="rtl">
      <BackButton />

      {/* ── Profile header ── */}
      <div className="rounded-2xl border border-[var(--fi-line)] bg-white p-5 shadow-sm dark:bg-gray-900">
        {isHeld && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-800">
            <AlertTriangle className="size-4 shrink-0" />
            هذا الحساب موقوف — {broker.hold_reason ?? ''}
          </div>
        )}

        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="relative flex size-16 shrink-0 items-center justify-center rounded-2xl text-xl font-black text-white shadow-lg"
              style={{ background: 'linear-gradient(135deg, #00c27c 0%, #0081cc 100%)' }}>
              {initials}
              {isHeld && (
                <span className="absolute -bottom-1 -left-1 flex size-5 items-center justify-center rounded-full bg-orange-500">
                  <PauseCircle className="size-3 text-white" />
                </span>
              )}
            </div>
            <div>
              <h1 className="text-xl font-black text-[var(--fi-ink)]">{broker.full_name ?? broker.display_name ?? '—'}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1 rounded-md bg-[var(--fi-soft)] px-2 py-1 text-xs font-black text-[var(--fi-muted)]">
                  <BadgeCheck className="size-3.5 text-[var(--fi-emerald)]" />
                  {brokerCode}
                </span>
                <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-black ${tier.bg} ${tier.color} ${tier.border}`}>
                  <Star className="mr-0.5 inline size-2.5" />
                  {tier.label}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-black ${vstatus.bg} ${vstatus.color}`}>
                  {vstatus.label}
                </span>
              </div>
              {amName && (
                <p className="mt-1 text-xs text-[var(--fi-muted)]">Account Manager: <strong>{amName}</strong></p>
              )}
            </div>
          </div>

          {/* Quick contacts */}
          <div className="flex flex-wrap gap-2 text-sm">
            {broker.phone && (
              <a href={`tel:${broker.phone}`} className="flex items-center gap-1.5 rounded-xl border border-[var(--fi-line)] px-3 py-2 font-bold text-[var(--fi-muted)] transition hover:bg-[var(--fi-soft)]" dir="ltr">
                <Phone className="size-4 text-[var(--fi-emerald)]" />{broker.phone}
              </a>
            )}
            {broker.email && (
              <a href={`mailto:${broker.email}`} className="flex items-center gap-1.5 rounded-xl border border-[var(--fi-line)] px-3 py-2 font-bold text-[var(--fi-muted)] transition hover:bg-[var(--fi-soft)]">
                <Mail className="size-4 text-[var(--fi-emerald)]" />{broker.email}
              </a>
            )}
          </div>
        </div>

        {/* KPI strip */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'إجمالي الصفقات', value: fmt(brokerTotalDeals), icon: Briefcase },
            { label: 'إجمالي المبيعات', value: brokerTotalSales > 0 ? fmtMoney(brokerTotalSales) : fmt(totalSales) + ' ج.م', icon: DollarSign },
            { label: 'عمولة معلقة', value: fmtMoney(pendingCommission), icon: TrendingUp },
            { label: 'وثائق مرفوعة', value: fmt(brokerDocs.length), icon: FileText },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-xl border border-[var(--fi-line)] bg-[var(--fi-soft)] p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="size-3.5 text-[var(--fi-emerald)]" />
                <p className="text-[11px] font-bold text-[var(--fi-muted)]">{label}</p>
              </div>
              <p className="text-sm font-black text-[var(--fi-ink)]">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab nav ── */}
      <TabNav active={tab} />

      {/* ── Tab content ── */}

      {/* ── PROFILE TAB ── */}
      {tab === 'profile' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <SectionCard title="البيانات الشخصية" icon={User}>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="الاسم الكامل" value={broker.full_name} />
              <InfoItem label="اسم العرض" value={broker.display_name} />
              <InfoItem label="رقم الهاتف" value={broker.phone} dir="ltr" />
              <InfoItem label="البريد الإلكتروني" value={broker.email} dir="ltr" />
              <InfoItem label="الرقم القومي" value={broker.national_id} />
              <InfoItem label="تاريخ الانضمام" value={fmtDate(broker.join_date ?? broker.created_at)} />
            </div>
          </SectionCard>

          <SectionCard title="بيانات الأعمال" icon={Building2}>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="كود الشريك" value={brokerCode} />
              <InfoItem label="المستوى" value={tier.label} />
              <InfoItem label="نسبة العمولة" value={`${broker.broker_commission_rate ?? broker.commission_rate ?? 0}%`} />
              <InfoItem label="نسبة المطور" value={`${broker.developer_commission_rate ?? 0}%`} />
              <InfoItem label="البنك" value={broker.bank_name} />
              <InfoItem label="IBAN" value={broker.bank_iban} dir="ltr" />
            </div>
            {broker.specialties?.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[var(--fi-muted)]">التخصصات</p>
                <div className="flex flex-wrap gap-1.5">
                  {broker.specialties.map((s: string) => (
                    <span key={s} className="rounded-lg bg-[var(--fi-emerald)]/10 px-2.5 py-1 text-xs font-bold text-[var(--fi-emerald)]">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>

          {/* Recent sales preview */}
          <div className="lg:col-span-2">
            <SectionCard title={`آخر المبيعات (${sales.slice(0, 5).length})`} icon={Briefcase}>
              {sales.length === 0 ? (
                <p className="py-4 text-center text-sm text-[var(--fi-muted)]">لا توجد مبيعات مسجلة بعد</p>
              ) : (
                <div className="space-y-2">
                  {sales.slice(0, 5).map((sale) => {
                    const saleCode = `SL-${String(sale.id).substring(0, 6).toUpperCase()}`
                    const st = SALE_STATUS[String(sale.status)] ?? { label: String(sale.status), cls: 'bg-slate-100 text-slate-500' }
                    return (
                      <div key={String(sale.id)} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--fi-line)] px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="font-black text-xs text-[var(--fi-emerald)]">{saleCode}</span>
                          <span className="text-sm font-bold text-[var(--fi-ink)]">{String(sale.client_name ?? '—')}</span>
                          <span className="text-xs text-[var(--fi-muted)]">{STAGE_LABELS[String(sale.stage)] ?? String(sale.stage)}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-black text-[var(--fi-ink)]">{fmtMoney(Number(sale.deal_value ?? sale.unit_value ?? 0))}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${st.cls}`}>{st.label}</span>
                        </div>
                      </div>
                    )
                  })}
                  {sales.length > 5 && (
                    <Link href="?tab=sales" className="block pt-2 text-center text-xs font-bold text-[var(--fi-emerald)]">
                      عرض جميع المبيعات ({sales.length}) ←
                    </Link>
                  )}
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      )}

      {/* ── SALES TAB ── */}
      {tab === 'sales' && (
        <SectionCard title={`جميع المبيعات (${sales.length})`} icon={Briefcase}>
          {sales.length === 0 ? (
            <p className="py-10 text-center text-sm text-[var(--fi-muted)]">لا توجد مبيعات مسجلة لهذا الشريك</p>
          ) : (
            <>
              {/* Summary strip */}
              <div className="mb-5 grid grid-cols-4 gap-3">
                {[
                  { label: 'إجمالي', value: sales.length },
                  { label: 'معتمدة', value: sales.filter(s => s.status === 'approved').length },
                  { label: 'قيد المراجعة', value: sales.filter(s => s.status === 'submitted' || s.status === 'under_review').length },
                  { label: 'مرفوضة', value: sales.filter(s => s.status === 'rejected').length },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl border border-[var(--fi-line)] bg-[var(--fi-soft)] p-3 text-center">
                    <p className="text-lg font-black text-[var(--fi-ink)]">{value}</p>
                    <p className="text-xs font-bold text-[var(--fi-muted)]">{label}</p>
                  </div>
                ))}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-right text-sm">
                  <thead className="bg-[var(--fi-soft)]">
                    <tr>
                      {['كود البيعة', 'اسم العميل', 'المرحلة', 'قيمة الصفقة', 'عمولة الشريك', 'الحالة', 'مسار العملية', 'التاريخ'].map(h => (
                        <th key={h} className="px-4 py-3 text-right text-xs font-black text-[var(--fi-muted)] uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--fi-line)]">
                    {sales.map((sale) => {
                      const saleCode = `SL-${String(sale.id).substring(0, 6).toUpperCase()}`
                      const st = SALE_STATUS[String(sale.status)] ?? { label: String(sale.status), cls: 'bg-slate-100 text-slate-500' }
                      const lifecycle = LIFECYCLE_LABELS[String(sale.lifecycle_stage)] ?? String(sale.lifecycle_stage ?? '—')
                      return (
                        <tr key={String(sale.id)} className="hover:bg-[var(--fi-soft)] transition-colors">
                          <td className="px-4 py-3 font-black text-[var(--fi-emerald)]">{saleCode}</td>
                          <td className="px-4 py-3 font-bold text-[var(--fi-ink)]">
                            <div>{String(sale.client_name ?? '—')}</div>
                            {sale.client_phone ? <div className="text-xs text-[var(--fi-muted)]" dir="ltr">{String(sale.client_phone)}</div> : null}
                          </td>
                          <td className="px-4 py-3 text-[var(--fi-muted)]">{STAGE_LABELS[String(sale.stage)] ?? String(sale.stage ?? '—')}</td>
                          <td className="px-4 py-3 font-bold text-[var(--fi-ink)]">{fmtMoney(Number(sale.deal_value ?? sale.unit_value ?? 0))}</td>
                          <td className="px-4 py-3 font-bold text-[var(--fi-emerald)]">{fmtMoney(Number(sale.agent_amount ?? 0))}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${st.cls}`}>{st.label}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-[var(--fi-muted)]">{lifecycle}</td>
                          <td className="px-4 py-3 text-xs text-[var(--fi-muted)]">{fmtDate(String(sale.created_at ?? ''))}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </SectionCard>
      )}

      {/* ── DOCUMENTS TAB ── */}
      {tab === 'documents' && (
        <SectionCard title={`وثائق الشريك (${brokerDocs.length})`} icon={FileText}>
          {brokerDocs.length === 0 ? (
            <p className="py-10 text-center text-sm text-[var(--fi-muted)]">لا توجد وثائق مرفوعة لهذا الشريك</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {brokerDocs.map((doc) => {
                const docStatus = String(doc.status ?? 'pending')
                const statusCls = docStatus === 'approved' ? 'text-emerald-700 bg-emerald-50' : docStatus === 'rejected' ? 'text-red-600 bg-red-50' : 'text-amber-700 bg-amber-50'
                const statusLabel = docStatus === 'approved' ? 'معتمد' : docStatus === 'rejected' ? 'مرفوض' : 'قيد المراجعة'
                return (
                  <div key={String(doc.id)} className="flex items-center justify-between rounded-xl border border-[var(--fi-line)] p-4">
                    <div className="flex items-center gap-3">
                      <FileText className="size-4 text-[var(--fi-muted)]" />
                      <div>
                        <p className="text-sm font-bold text-[var(--fi-ink)]">{String(doc.name ?? doc.type ?? '—')}</p>
                        <p className="text-xs text-[var(--fi-muted)]">{fmtDate(String(doc.created_at ?? ''))}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${statusCls}`}>{statusLabel}</span>
                      {doc.url ? (
                        <a href={String(doc.url)} target="_blank" rel="noreferrer"
                          className="rounded-lg border border-[var(--fi-line)] px-2 py-1 text-xs font-bold text-[var(--fi-muted)] transition hover:bg-[var(--fi-soft)]">
                          عرض
                        </a>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </SectionCard>
      )}

      {/* ── COMMISSION TAB ── */}
      {tab === 'commission' && (
        <div className="space-y-5">
          <SectionCard title="لوحة تحكم العمولة" icon={TrendingUp}>
            {canManage ? (
              <CommissionPanel
                brokerId={broker.id}
                currentDeveloperRate={Number(broker.developer_commission_rate ?? 4)}
                currentBrokerRate={Number(broker.broker_commission_rate ?? broker.commission_rate ?? 2)}
              />
            ) : (
              <div className="py-6 text-center text-sm text-[var(--fi-muted)]">لا تملك صلاحية تعديل العمولة</div>
            )}
          </SectionCard>

          <SectionCard title="تاريخ العمولات" icon={DollarSign}>
            {sales.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--fi-muted)]">لا توجد مبيعات مسجلة</p>
            ) : (
              <>
                <div className="mb-4 grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-[var(--fi-line)] bg-[var(--fi-soft)] p-4 text-center">
                    <p className="text-lg font-black text-[var(--fi-emerald)]">{fmtMoney(approvedSales.reduce((s, sale) => s + Number(sale.agent_amount ?? 0), 0))}</p>
                    <p className="text-xs font-bold text-[var(--fi-muted)]">عمولة معتمدة</p>
                  </div>
                  <div className="rounded-xl border border-[var(--fi-line)] bg-[var(--fi-soft)] p-4 text-center">
                    <p className="text-lg font-black text-amber-600">{fmtMoney(sales.filter(s => s.status === 'submitted' || s.status === 'under_review').reduce((s, sale) => s + Number(sale.agent_amount ?? 0), 0))}</p>
                    <p className="text-xs font-bold text-[var(--fi-muted)]">عمولة معلقة</p>
                  </div>
                  <div className="rounded-xl border border-[var(--fi-line)] bg-[var(--fi-soft)] p-4 text-center">
                    <p className="text-lg font-black text-[var(--fi-ink)]">{fmtMoney(sales.filter(s => s.lifecycle_stage === 'broker_paid').reduce((s, sale) => s + Number(sale.agent_amount ?? 0), 0))}</p>
                    <p className="text-xs font-bold text-[var(--fi-muted)]">تم صرفها</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
                    <thead className="bg-[var(--fi-soft)]">
                      <tr>
                        {['كود البيعة', 'العميل', 'قيمة الصفقة', 'نسبة العمولة', 'مبلغ العمولة', 'حالة الصرف'].map(h => (
                          <th key={h} className="px-4 py-3 text-right text-xs font-black text-[var(--fi-muted)]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--fi-line)]">
                      {sales.filter(s => s.status === 'approved').map((sale) => (
                        <tr key={String(sale.id)} className="hover:bg-[var(--fi-soft)]">
                          <td className="px-4 py-3 font-black text-[var(--fi-emerald)]">{`SL-${String(sale.id).substring(0, 6).toUpperCase()}`}</td>
                          <td className="px-4 py-3 font-bold text-[var(--fi-ink)]">{String(sale.client_name ?? '—')}</td>
                          <td className="px-4 py-3">{fmtMoney(Number(sale.deal_value ?? sale.unit_value ?? 0))}</td>
                          <td className="px-4 py-3">{String(Number(sale.commission_rate ?? 0))}%</td>
                          <td className="px-4 py-3 font-bold text-[var(--fi-emerald)]">{fmtMoney(Number(sale.agent_amount ?? 0))}</td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-[var(--fi-soft)] px-2 py-0.5 text-[10px] font-black text-[var(--fi-muted)]">
                              {String(LIFECYCLE_LABELS[String(sale.lifecycle_stage)] ?? sale.lifecycle_stage ?? '—')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </SectionCard>
        </div>
      )}

      {/* ── SETTINGS TAB ── */}
      {tab === 'settings' && (
        <div className="grid gap-5 lg:grid-cols-2">
          {canManage && (
            <>
              <SectionCard title="تعليق الحساب / رفع التعليق" icon={PauseCircle}>
                <HoldPanel brokerId={broker.id} isHeld={isHeld} holdReason={broker.hold_reason} />
              </SectionCard>

              {broker.email && (
                <SectionCard title="إعادة تعيين كلمة المرور" icon={Settings}>
                  <PasswordResetPanel brokerEmail={broker.email} />
                </SectionCard>
              )}
            </>
          )}

          <SectionCard title="معلومات الحساب" icon={Shield}>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="كود الشريك" value={brokerCode} />
              <InfoItem label="معرّف النظام (ID)" value={broker.id} dir="ltr" />
              <InfoItem label="Profile ID" value={profileId ?? '—'} dir="ltr" />
              <InfoItem label="تاريخ الإنشاء" value={fmtDate(broker.created_at)} />
              <InfoItem label="آخر تعديل" value={fmtDate(broker.updated_at)} />
              {broker.held_at && <InfoItem label="تاريخ التعليق" value={fmtDate(broker.held_at)} />}
            </div>
          </SectionCard>

          {isHeld && (
            <SectionCard title="معلومات التعليق" icon={AlertTriangle}>
              <div className="space-y-3">
                <InfoItem label="سبب التعليق" value={broker.hold_reason} />
                <InfoItem label="تاريخ التعليق" value={fmtDate(broker.held_at)} />
                <p className="text-xs text-[var(--fi-muted)]">جميع بيانات الشريك محفوظة ولن تُحذف</p>
              </div>
            </SectionCard>
          )}
        </div>
      )}
    </div>
  )
}
