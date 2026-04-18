import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import AddDealButton from '@/components/deals/AddDealButton'
import { Briefcase, DollarSign, Calendar, CheckCircle2, ChevronLeft, ChevronRight, Kanban, TrendingUp, Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 30

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

const STAGE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  'Won':            { label: 'تم البيع',    color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
  'Contracted':     { label: 'تعاقد',       color: 'text-teal-700',    bg: 'bg-teal-50 border-teal-100' },
  'Registration':   { label: 'تسجيل',       color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-100' },
  'Handover':       { label: 'تسليم',       color: 'text-purple-700',  bg: 'bg-purple-50 border-purple-100' },
  'contract_signed':{ label: 'موقع',        color: 'text-indigo-700',  bg: 'bg-indigo-50 border-indigo-100' },
  'Negotiation':    { label: 'تفاوض',       color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-100' },
  'Lost':           { label: 'خسارة',       color: 'text-red-700',     bg: 'bg-red-50 border-red-100' },
}

export default async function DealsPage({ searchParams }: PageProps) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const params = await searchParams
  const page = Math.max(1, parseInt(params?.page || '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('company_id, role').eq('id', user?.id).single()
  const targetCompanyId = profile?.company_id || user?.id

  const [
    { data: activeLeads },
    { data: teamMembers },
    { data: deals, count: totalDealsCount },
  ] = await Promise.all([
    supabase.from('leads').select('id, client_name').eq('company_id', targetCompanyId).neq('status', 'Won'),
    supabase.from('profiles').select('id, full_name').eq('company_id', targetCompanyId).eq('role', 'agent'),
    supabase.from('deals')
      .select('*, leads(client_name), profiles!deals_agent_id_fkey(full_name), commissions(amount, status)', { count: 'exact' })
      .eq('company_id', targetCompanyId)
      .order('created_at', { ascending: false })
      .range(from, to),
  ])

  const totalPages = Math.ceil((totalDealsCount ?? 0) / PAGE_SIZE)
  const totalRevenue = (deals ?? []).reduce((sum, d) => sum + Number(d.final_price || 0), 0)
  const totalCommissions = (deals ?? []).reduce((sum, d) => sum + Number(d.commissions?.[0]?.amount || 0), 0)

  const fmt = (n: number) => new Intl.NumberFormat('ar-EG', { notation: 'compact', maximumFractionDigits: 1 }).format(n)

  return (
    <div className="min-h-screen space-y-5 p-4 sm:p-6" dir="rtl">

      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--fi-emerald)] shadow-lg shadow-[var(--fi-emerald)]/20">
            <Briefcase size={18} className="text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-black text-[var(--fi-ink)]">إدارة الصفقات والعمولات</h1>
            <p className="text-xs text-[var(--fi-muted)]">توثيق العقود ومتابعة المستحقات المالية للوكلاء</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/deals/kanban"
            className="flex min-h-9 items-center gap-2 rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] px-3 py-2 text-sm font-bold text-[var(--fi-ink)] transition-colors hover:bg-[var(--fi-soft)] cursor-pointer"
          >
            <Kanban size={15} aria-hidden="true" /> عرض Kanban
          </Link>
          <AddDealButton activeLeads={activeLeads || []} teamMembers={teamMembers || []} />
        </div>
      </div>

      {/* Summary KPIs */}
      {deals && deals.length > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'إجمالي الصفقات',    value: fmt(totalDealsCount ?? 0), icon: Briefcase,  color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { label: 'إجمالي الإيرادات',  value: `${fmt(totalRevenue)} ج.م`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
            { label: 'العمولات المستحقة', value: `${fmt(totalCommissions)} ج.م`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
            { label: 'فريق المبيعات',     value: fmt(teamMembers?.length ?? 0), icon: Users,      color: 'text-amber-600',  bg: 'bg-amber-50 dark:bg-amber-900/20' },
          ].map(k => {
            const Icon = k.icon
            return (
              <div key={k.label} className="flex items-center gap-3 rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4 shadow-sm">
                <div className={`${k.bg} flex size-10 shrink-0 items-center justify-center rounded-lg`}>
                  <Icon size={18} className={k.color} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[var(--fi-muted)]">{k.label}</p>
                  <p className={`fi-tabular text-lg font-black ${k.color}`}>{k.value}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Deals grid */}
      {(!deals || deals.length === 0) ? (
        <div className="rounded-2xl border border-dashed border-[var(--fi-line)] bg-[var(--fi-paper)] p-12 text-center shadow-sm">
          <Briefcase size={48} className="mx-auto mb-4 text-[var(--fi-line)]" aria-hidden="true" />
          <h3 className="text-xl font-black text-[var(--fi-ink)]">لا توجد صفقات موثقة حتى الآن</h3>
          <p className="mt-2 font-medium text-[var(--fi-muted)]">اضغط على &ldquo;توثيق صفقة جديدة&rdquo; لتحويل عميل إلى مشتري فعلي.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {deals.map((deal) => {
            const stage = STAGE_CONFIG[deal.stage ?? 'Won'] ?? STAGE_CONFIG['Won']
            return (
              <div
                key={deal.id}
                className="fi-card-hover overflow-hidden rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-paper)] shadow-sm"
              >
                {/* Card header */}
                <div className="flex items-start justify-between border-b border-[var(--fi-line)] bg-[#0C1A2E] p-4 text-white">
                  <div>
                    <p className="text-[10px] font-bold text-white/40">اسم العميل</p>
                    <h3 className="mt-0.5 text-base font-black">{deal.leads?.client_name || 'عميل غير معروف'}</h3>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold ${stage.bg} ${stage.color}`}>
                    <CheckCircle2 size={12} aria-hidden="true" /> {stage.label}
                  </span>
                </div>

                {/* Card body */}
                <div className="space-y-4 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="flex items-center gap-1 text-[10px] font-bold text-[var(--fi-muted)]">
                        <DollarSign size={12} aria-hidden="true" /> قيمة العقد
                      </p>
                      <p className="fi-tabular text-lg font-black text-[var(--fi-ink)]">
                        {Number(deal.final_price).toLocaleString('ar-EG')} ج.م
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="flex items-center justify-end gap-1 text-[10px] font-bold text-[var(--fi-muted)]">
                        <Calendar size={12} aria-hidden="true" /> التاريخ
                      </p>
                      <p className="text-sm font-bold text-[var(--fi-ink)]">
                        {new Date(deal.created_at).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="-mx-4 -mb-4 border-t border-[var(--fi-line)] bg-[var(--fi-soft)] px-4 py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-[var(--fi-muted)]">
                        الوكيل:{' '}
                        <span className="font-bold text-blue-600">{deal.profiles?.full_name || '—'}</span>
                      </p>
                      <div className="text-left">
                        <p className="text-[10px] font-bold text-[var(--fi-emerald)]">العمولة</p>
                        <p className="fi-tabular text-sm font-black text-[var(--fi-emerald)]">
                          {Number(deal.commissions?.[0]?.amount || 0).toLocaleString('ar-EG')} ج.م
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {(totalDealsCount ?? 0) > PAGE_SIZE && (
        <div className="flex items-center justify-between rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-paper)] px-5 py-3 shadow-sm">
          <span className="text-xs font-medium text-[var(--fi-muted)]">
            {from + 1}–{Math.min(to + 1, totalDealsCount ?? 0)} من {totalDealsCount} صفقة
          </span>
          <nav aria-label="ترقيم الصفحات" className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={`?page=${page - 1}`}
                className="flex min-h-8 items-center gap-1 rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] px-3 py-1.5 text-xs font-bold text-[var(--fi-ink)] transition-colors hover:bg-[var(--fi-soft)] cursor-pointer"
              >
                <ChevronRight size={13} aria-hidden="true" /> السابق
              </Link>
            )}
            <span className="px-2 text-xs font-bold text-[var(--fi-muted)]">
              {page} / {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`?page=${page + 1}`}
                className="flex min-h-8 items-center gap-1 rounded-xl bg-[var(--fi-emerald)] px-3 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90 cursor-pointer"
              >
                التالي <ChevronLeft size={13} aria-hidden="true" />
              </Link>
            )}
          </nav>
        </div>
      )}
    </div>
  )
}
