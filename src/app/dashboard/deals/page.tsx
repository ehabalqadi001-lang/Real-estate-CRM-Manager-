import Link from 'next/link'
import { redirect } from 'next/navigation'
import AddDealButton from '@/components/deals/AddDealButton'
import { AnimatedCount } from '@/components/design-system/animated-count'
import { BentoKpiCard } from '@/components/dashboard/BentoDashboardLayout'
import { createServerSupabaseClient } from '@/shared/supabase/server'
import { requireSession } from '@/shared/auth/session'
import { getActiveCompanyContext } from '@/shared/company-context/server'
import { nullableUuid } from '@/lib/uuid'
import { isSuperAdmin } from '@/shared/auth/types'
import { getI18n } from '@/lib/i18n'
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Kanban,
  TrendingUp,
  Users,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 30

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

type DealRow = {
  id: string
  stage: string | null
  final_price: number | null
  created_at: string
  leads?: { client_name: string | null } | null
  profiles?: { full_name: string | null } | null
  commissions?: { amount: number | null; status: string | null }[] | null
}

type LeadOption = { id: string; client_name: string }
type TeamMemberOption = { id: string; full_name: string }

export default async function DealsPage({ searchParams }: PageProps) {
  const { t, dir, numLocale } = await getI18n()

  const STAGE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    Won:             { label: t('تم البيع', 'Won'),       color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
    Contracted:      { label: t('تعاقد', 'Contracted'),   color: 'text-teal-700',    bg: 'bg-teal-50 border-teal-100' },
    Registration:    { label: t('تسجيل', 'Registration'), color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-100' },
    Handover:        { label: t('تسليم', 'Handover'),     color: 'text-purple-700',  bg: 'bg-purple-50 border-purple-100' },
    contract_signed: { label: t('موقع', 'Signed'),        color: 'text-indigo-700',  bg: 'bg-indigo-50 border-indigo-100' },
    Negotiation:     { label: t('تفاوض', 'Negotiation'),  color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-100' },
    Lost:            { label: t('خسارة', 'Lost'),         color: 'text-red-700',     bg: 'bg-red-50 border-red-100' },
  }

  const session = await requireSession()
  if (session.profile.role === 'broker' || session.profile.role === 'freelancer') {
    redirect('/broker-portal/sales')
  }
  const supabase = await createServerSupabaseClient()
  const companyContext = await getActiveCompanyContext(session)
  const params = await searchParams
  const page = Math.max(1, parseInt(params?.page || '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  const targetCompanyId = nullableUuid(companyContext.companyId)
  const adminUser = isSuperAdmin(session.profile.role)
  const canQuery = adminUser || Boolean(targetCompanyId)

  const companyScope = adminUser
    ? (targetCompanyId ? `company_id.eq.${targetCompanyId},company_id.is.null` : null)
    : null

  const leadsBase = supabase.from('leads').select('id, client_name').neq('status', 'Won').order('created_at', { ascending: false })
  const teamBase  = supabase.from('profiles').select('id, full_name').in('role', ['agent', 'senior_agent', 'branch_manager', 'company_admin', 'company_owner', 'admin', 'company']).order('full_name')
  const dealsBase = supabase.from('deals').select('id, stage, final_price, created_at, leads(client_name), profiles!deals_agent_id_fkey(full_name), commissions(amount, status)', { count: 'exact' }).order('created_at', { ascending: false }).range(from, to)

  const [
    { data: activeLeads },
    { data: teamMembers },
    { data: deals, count: totalDealsCount },
  ] = await Promise.all([
    canQuery
      ? (companyScope ? leadsBase.or(companyScope) : !adminUser ? leadsBase.eq('company_id', targetCompanyId!) : leadsBase)
      : Promise.resolve({ data: [] as { id: string; client_name: string | null }[] }),
    canQuery
      ? (companyScope ? teamBase.or(companyScope) : !adminUser ? teamBase.eq('company_id', targetCompanyId!) : teamBase)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
    canQuery
      ? (companyScope ? dealsBase.or(companyScope) : !adminUser ? dealsBase.eq('company_id', targetCompanyId!) : dealsBase)
      : Promise.resolve({ data: [] as DealRow[], count: 0 }),
  ])

  const safeLeads = ((activeLeads ?? []) as unknown as LeadOption[]).filter((lead) => lead.id)
  const safeTeamMembers = ensureCurrentUserInTeam((teamMembers ?? []) as unknown as TeamMemberOption[], session.profile)
  const safeDeals = (deals ?? []) as unknown as DealRow[]
  const totalPages = Math.ceil((totalDealsCount ?? 0) / PAGE_SIZE)
  const totalRevenue = safeDeals.reduce((sum, deal) => sum + Number(deal.final_price || 0), 0)
  const totalCommissions = safeDeals.reduce((sum, deal) => sum + Number(deal.commissions?.[0]?.amount || 0), 0)

  return (
    <main className="min-h-screen space-y-5 p-4 sm:p-6">
      <section className="ds-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--fi-emerald)] shadow-lg shadow-[var(--fi-emerald)]/20">
            <Briefcase size={18} className="text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-black text-[var(--fi-ink)]">{t('إدارة الصفقات والعمولات', 'Deals & Commissions')}</h1>
            <p className="text-xs font-semibold leading-6 text-[var(--fi-muted)]">
              {t('توثيق العقود ومتابعة المستحقات المالية للوكلاء.', 'Track contracts and agent commissions.')}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/deals/kanban"
            className="flex min-h-11 items-center gap-2 rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] px-3 py-2 text-sm font-bold text-[var(--fi-ink)] transition-colors hover:bg-[var(--fi-soft)]"
          >
            <Kanban size={15} aria-hidden="true" />
            {t('عرض Kanban', 'Kanban View')}
          </Link>
          <AddDealButton activeLeads={safeLeads} teamMembers={safeTeamMembers} />
        </div>
      </section>

      {!targetCompanyId ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-7 text-amber-800">
          {t('اختر شركة نشطة من أعلى الصفحة أولاً حتى يمكن عرض العملاء والوكلاء وتوثيق الصفقات داخل نطاق شركة صحيح.', 'Select an active company at the top of the page first to view clients, agents, and log deals within the correct company scope.')}
        </section>
      ) : null}

      <section className="ds-bento-grid" aria-label={t('مؤشرات الصفقات', 'Deal KPIs')}>
        <BentoKpiCard
          title={t('إجمالي الصفقات', 'Total Deals')}
          value={<AnimatedCount value={totalDealsCount ?? 0} />}
          hint={t('كل العقود الموثقة', 'All documented contracts')}
          icon={<Briefcase className="size-5" />}
        />
        <BentoKpiCard
          title={t('إجمالي الإيرادات', 'Total Revenue')}
          value={<AnimatedCount value={totalRevenue} compact suffix={` ${t('ج.م', 'EGP')}`} />}
          hint={t('قيمة العقود في الصفحة الحالية', 'Contract value on current page')}
          icon={<CircleDollarSign className="size-5" />}
        />
        <BentoKpiCard
          title={t('العمولات المستحقة', 'Due Commissions')}
          value={<AnimatedCount value={totalCommissions} compact suffix={` ${t('ج.م', 'EGP')}`} />}
          hint={t('مرتبطة بالصفقات المعروضة', 'Linked to displayed deals')}
          icon={<TrendingUp className="size-5" />}
        />
        <BentoKpiCard
          title={t('فريق المبيعات', 'Sales Team')}
          value={<AnimatedCount value={safeTeamMembers.length} />}
          hint={t('وكلاء ومديرو الشركة', 'Agents and managers')}
          icon={<Users className="size-5" />}
        />
      </section>

      {safeDeals.length === 0 ? (
        <section className="ds-card border-dashed p-12 text-center">
          <Briefcase size={48} className="mx-auto mb-4 text-[var(--fi-line)]" aria-hidden="true" />
          <h3 className="text-xl font-black text-[var(--fi-ink)]">{t('لا توجد صفقات موثقة حتى الآن', 'No deals recorded yet')}</h3>
          <p className="mt-2 font-medium leading-7 text-[var(--fi-muted)]">
            {t('اضغط على "توثيق صفقة جديدة" لتحويل عميل إلى مشتري فعلي وحساب العمولة.', 'Click "Add Deal" to convert a lead into a buyer and calculate commission.')}
          </p>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {safeDeals.map((deal) => {
            const stage = STAGE_CONFIG[deal.stage ?? 'Won'] ?? STAGE_CONFIG.Won
            return (
              <article key={deal.id} className="ds-card ds-card-hover overflow-hidden">
                <div className="flex items-start justify-between border-b border-[var(--fi-line)] bg-[#0C1A2E] p-4 text-white">
                  <div>
                    <p className="text-[10px] font-bold text-white/50">{t('اسم العميل', 'Client Name')}</p>
                    <h3 className="mt-0.5 text-base font-black">{deal.leads?.client_name || t('عميل غير معروف', 'Unknown Client')}</h3>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold ${stage.bg} ${stage.color}`}>
                    <CheckCircle2 size={12} aria-hidden="true" />
                    {stage.label}
                  </span>
                </div>

                <div className="space-y-4 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-1 text-[10px] font-bold text-[var(--fi-muted)]">
                        <CircleDollarSign size={12} aria-hidden="true" />
                        {t('قيمة العقد', 'Contract Value')}
                      </p>
                      <p className="fi-tabular text-lg font-black text-[var(--fi-ink)]">
                        {Number(deal.final_price || 0).toLocaleString(numLocale)} {t('ج.م', 'EGP')}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="flex items-center justify-end gap-1 text-[10px] font-bold text-[var(--fi-muted)]">
                        <Calendar size={12} aria-hidden="true" />
                        {t('التاريخ', 'Date')}
                      </p>
                      <p className="text-sm font-bold text-[var(--fi-ink)]">
                        {new Date(deal.created_at).toLocaleDateString(numLocale)}
                      </p>
                    </div>
                  </div>

                  <div className="-mx-4 -mb-4 border-t border-[var(--fi-line)] bg-[var(--fi-soft)] px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="min-w-0 text-xs font-medium text-[var(--fi-muted)]">
                        {t('الوكيل:', 'Agent:')}{' '}
                        <span className="font-bold text-blue-600">{deal.profiles?.full_name || t('غير محدد', 'Unassigned')}</span>
                      </p>
                      <div className="text-left">
                        <p className="text-[10px] font-bold text-[var(--fi-emerald)]">{t('العمولة', 'Commission')}</p>
                        <p className="fi-tabular text-sm font-black text-[var(--fi-emerald)]">
                          {Number(deal.commissions?.[0]?.amount || 0).toLocaleString(numLocale)} {t('ج.م', 'EGP')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      )}

      {(totalDealsCount ?? 0) > PAGE_SIZE && (
        <section className="ds-card flex items-center justify-between px-5 py-3">
          <span className="text-xs font-medium text-[var(--fi-muted)]">
            {from + 1}-{Math.min(to + 1, totalDealsCount ?? 0)} {t('من', 'of')} {totalDealsCount} {t('صفقة', 'deals')}
          </span>
          <nav aria-label={t('ترقيم الصفحات', 'Pagination')} className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={`?page=${page - 1}`}
                className="flex min-h-8 items-center gap-1 rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] px-3 py-1.5 text-xs font-bold text-[var(--fi-ink)] transition-colors hover:bg-[var(--fi-soft)]"
              >
                <ChevronRight size={13} aria-hidden="true" />
                {t('السابق', 'Previous')}
              </Link>
            )}
            <span className="px-2 text-xs font-bold text-[var(--fi-muted)]">
              {page} / {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`?page=${page + 1}`}
                className="flex min-h-8 items-center gap-1 rounded-lg bg-[var(--fi-emerald)] px-3 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
              >
                {t('التالي', 'Next')}
                <ChevronLeft size={13} aria-hidden="true" />
              </Link>
            )}
          </nav>
        </section>
      )}
    </main>
  )
}

function ensureCurrentUserInTeam(teamMembers: TeamMemberOption[], profile: { id: string; full_name?: string | null; email?: string | null }) {
  if (teamMembers.some((member) => member.id === profile.id)) return teamMembers
  return [
    { id: profile.id, full_name: profile.full_name || profile.email || 'Current User' },
    ...teamMembers,
  ]
}
