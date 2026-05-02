import { redirect } from 'next/navigation'
import { Network, Target, TrendingUp, Users } from 'lucide-react'
import { createServerSupabaseClient } from '@/shared/supabase/server'
import { requireSession } from '@/shared/auth/session'
import { nullableUuid } from '@/lib/uuid'
import { BentoGrid, BentoKpiCard } from '@/components/dashboard/BentoDashboardLayout'
import { AnimatedCount } from '@/components/design-system/animated-count'
import { AddCellForm } from './AddCellForm'

export const dynamic = 'force-dynamic'

type CellRow = {
  id: string
  name_ar: string
  leader_id: string | null
  monthly_gmv_target: number | null
  monthly_leads_target: number | null
  conversion_target_pct: number | null
  status: string | null
  work_cell_members?: { id: string; user_id: string | null; role_in_cell: string | null; status: string | null }[] | null
}

type AgentRow = { id: string; full_name: string | null }

const MANAGER_ROLES = new Set([
  'super_admin',
  'platform_admin',
  'company_owner',
  'company_admin',
  'sales_director',
  'branch_manager',
  'team_leader',
  'admin',
  'company',
])

export default async function CellsPage() {
  const session = await requireSession()
  if (!MANAGER_ROLES.has(session.profile.role)) redirect('/dashboard')

  const companyId = nullableUuid(session.profile.company_id) ?? nullableUuid(session.profile.tenant_id)
  const supabase = await createServerSupabaseClient()

  if (!companyId) {
    return (
      <main className="space-y-6 p-4 sm:p-6" dir="rtl">
        <section className="ds-card p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--fi-emerald)]">FAST INVESTMENT OPERATIONS</p>
          <h1 className="mt-2 text-2xl font-black text-[var(--fi-ink)] sm:text-3xl">إدارة خلايا العمل</h1>
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-7 text-amber-800">
            حسابك الحالي غير مرتبط بشركة صالحة. اربط حساب المدير بشركة قبل إنشاء خلايا العمل.
          </div>
        </section>
      </main>
    )
  }

  const [cellsResult, agentsResult, snapshotResult] = await Promise.all([
    supabase
      .from('work_cells')
      .select('id, name_ar, leader_id, monthly_gmv_target, monthly_leads_target, conversion_target_pct, status, work_cell_members(id, user_id, role_in_cell, status)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('company_id', companyId)
      .in('role', ['agent', 'senior_agent', 'branch_manager', 'team_leader', 'sales_director'])
      .order('full_name'),
    supabase
      .from('cell_performance_snapshots')
      .select('cell_id, gmv, leads_count, closed_deals_count, conversion_rate_pct')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false }),
  ])

  const cells = (cellsResult.data ?? []) as unknown as CellRow[]
  const agents = (agentsResult.data ?? []) as AgentRow[]
  const snapshots = snapshotResult.data ?? []
  const totalMembers = cells.reduce((sum, cell) => sum + (cell.work_cell_members?.filter((member) => member.status === 'active').length ?? 0), 0)
  const totalTarget = cells.reduce((sum, cell) => sum + Number(cell.monthly_gmv_target ?? 0), 0)
  const totalGmv = snapshots.reduce((sum, item) => sum + Number(item.gmv ?? 0), 0)
  const pageError = cellsResult.error || agentsResult.error || snapshotResult.error

  return (
    <main className="space-y-6 p-4 sm:p-6" dir="rtl">
      <section className="ds-card p-5 sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--fi-emerald)]">FAST INVESTMENT OPERATIONS</p>
        <h1 className="mt-2 text-2xl font-black text-[var(--fi-ink)] sm:text-3xl">إدارة خلايا العمل</h1>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-7 text-[var(--fi-muted)]">
          تتبع كل خلية، قائدها، أعضائها، أهداف GMV، ومعدلات التحويل بشكل مستقل مع رؤية مركزية للإدارة.
        </p>
      </section>

      {pageError ? (
        <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          تعذر تحميل بيانات الخلايا: {pageError.message}
        </section>
      ) : null}

      <BentoGrid>
        <BentoKpiCard title="عدد الخلايا" value={<AnimatedCount value={cells.length} />} hint="نشطة ومؤرشفة" icon={<Network className="size-5" />} />
        <BentoKpiCard title="أعضاء الخلايا" value={<AnimatedCount value={totalMembers} />} hint="أعضاء نشطون" icon={<Users className="size-5" />} />
        <BentoKpiCard title="هدف GMV" value={<><AnimatedCount value={totalTarget} compact /> <span className="text-base">ج.م</span></>} hint="شهرياً" icon={<Target className="size-5" />} />
        <BentoKpiCard title="GMV فعلي" value={<><AnimatedCount value={totalGmv} compact /> <span className="text-base">ج.م</span></>} hint="من snapshots" icon={<TrendingUp className="size-5" />} />
      </BentoGrid>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <AddCellForm agents={agents} />

        <section className="ds-card overflow-hidden">
          <div className="border-b border-[var(--fi-line)] p-5">
            <h2 className="text-xl font-black text-[var(--fi-ink)]">الخلايا الحالية</h2>
            <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">
              كل خلية لها أهداف ومؤشرات وتحكم مستقل في بيانات العملاء.
            </p>
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-2">
            {cells.map((cell) => (
              <article key={cell.id} className="rounded-lg border border-[var(--fi-line)] bg-white p-4 dark:bg-white/5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-[var(--fi-ink)]">{cell.name_ar}</h3>
                    <p className="mt-1 text-xs font-bold text-[var(--fi-muted)]">
                      {cell.work_cell_members?.filter((member) => member.status === 'active').length ?? 0} أعضاء
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                    {cell.status === 'active' ? 'نشطة' : cell.status}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
                  <Metric label="GMV" value={`${Number(cell.monthly_gmv_target ?? 0).toLocaleString('ar-EG')} ج.م`} />
                  <Metric label="Leads" value={String(cell.monthly_leads_target ?? 0)} />
                  <Metric label="تحويل" value={`${cell.conversion_target_pct ?? 0}%`} />
                </div>
              </article>
            ))}
            {!cells.length ? (
              <div className="rounded-lg border border-dashed border-[var(--fi-line)] p-10 text-center text-sm font-bold text-[var(--fi-muted)] md:col-span-2">
                لا توجد خلايا حتى الآن. أنشئ أول خلية عمل من النموذج.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[var(--fi-soft)] p-3">
      <p className="text-[10px] font-black text-[var(--fi-muted)]">{label}</p>
      <p className="mt-1 truncate text-xs font-black text-[var(--fi-ink)]">{value}</p>
    </div>
  )
}
