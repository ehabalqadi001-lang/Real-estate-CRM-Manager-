import { redirect } from 'next/navigation'
import { BarChart3, Building2, CalendarClock, Eye, PackageCheck, Users } from 'lucide-react'
import { createServerSupabaseClient } from '@/shared/supabase/server'
import { requireSession } from '@/shared/auth/session'
import { BentoGrid, BentoKpiCard } from '@/components/dashboard/BentoDashboardLayout'
import { AnimatedCount } from '@/components/design-system/animated-count'

export const dynamic = 'force-dynamic'

type DeveloperAccountRow = {
  developer_id: string
  role: string
  developers: { id: string; name: string | null; name_ar: string | null; logo_url: string | null } | null
}

type ProjectRow = {
  id: string
  developer_id: string | null
  name: string
  name_ar: string | null
  city: string | null
  location: string | null
  status: string | null
  total_units: number | null
  available_units: number | null
  min_price: number | null
  max_price: number | null
  trust_score: number | null
}

type UnitRow = {
  id: string
  project_id: string | null
  unit_number: string | null
  unit_type: string | null
  area_sqm: number | null
  price: number | null
  status: string | null
  last_synced_at: string | null
}

type EngagementRow = {
  project_id: string | null
  event_type: string
  event_count: number | null
  duration_seconds: number | null
}

type MeetingRow = {
  project_id: string | null
  status: string | null
}

const currency = new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 })

export default async function DeveloperPortalPage() {
  const session = await requireSession()
  const supabase = await createServerSupabaseClient()

  const [{ data: developerAccounts, error: accountsError }, { data: allDevelopers }] = await Promise.all([
    supabase
      .from('developer_accounts')
      .select('developer_id, role, developers(id, name, name_ar, logo_url)')
      .eq('user_id', session.user.id)
      .eq('status', 'active'),
    session.profile.role === 'super_admin' || session.profile.role === 'platform_admin'
      ? supabase.from('developers').select('id, name, name_ar, logo_url').eq('active', true).limit(50)
      : Promise.resolve({ data: null }),
  ])

  if (accountsError && accountsError.code !== '42P01') {
    throw new Error(accountsError.message)
  }

  const accountRows = ((developerAccounts ?? []) as unknown as DeveloperAccountRow[])
  const platformDeveloperRows = (allDevelopers ?? []).map((developer) => ({
    developer_id: developer.id,
    role: 'platform_viewer',
    developers: developer,
  })) as DeveloperAccountRow[]

  const developerRows = accountRows.length ? accountRows : platformDeveloperRows
  const developerIds = developerRows.map((account) => account.developer_id)

  if (!developerIds.length) {
    if (session.profile.role !== 'developer_relations_manager') {
      return <NoDeveloperAccess />
    }
    redirect('/dashboard/developers')
  }

  const { data: projectsData, error: projectsError } = await supabase
    .from('projects')
    .select('id, developer_id, name, name_ar, city, location, status, total_units, available_units, min_price, max_price, trust_score')
    .in('developer_id', developerIds)
    .order('created_at', { ascending: false })

  if (projectsError) throw new Error(projectsError.message)

  const projects = (projectsData ?? []) as ProjectRow[]
  const projectIds = projects.map((project) => project.id)

  const [unitsResult, engagementResult, meetingsResult] = projectIds.length
    ? await Promise.all([
        supabase
          .from('units')
          .select('id, project_id, unit_number, unit_type, area_sqm, price, status, last_synced_at')
          .in('project_id', projectIds)
          .order('created_at', { ascending: false })
          .limit(250),
        supabase
          .from('engagement_events')
          .select('project_id, event_type, event_count, duration_seconds')
          .in('project_id', projectIds)
          .limit(1000),
        supabase
          .from('meeting_bookings')
          .select('project_id, status')
          .in('project_id', projectIds)
          .limit(500),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }]

  const units = (unitsResult.data ?? []) as UnitRow[]
  const engagements = (engagementResult.data ?? []) as EngagementRow[]
  const meetings = (meetingsResult.data ?? []) as MeetingRow[]

  const availableUnits = units.filter((unit) => unit.status === 'available').length
  const reservedUnits = units.filter((unit) => unit.status === 'reserved' || unit.status === 'held').length
  const soldUnits = units.filter((unit) => unit.status === 'sold').length
  const totalInterest = engagements.reduce((sum, event) => sum + Number(event.event_count ?? 1), 0)
  const bookedMeetings = meetings.filter((meeting) => meeting.status === 'scheduled' || meeting.status === 'confirmed').length
  const totalAvailableValue = units
    .filter((unit) => unit.status !== 'sold')
    .reduce((sum, unit) => sum + Number(unit.price ?? 0), 0)

  return (
    <main className="min-h-screen bg-[var(--fi-bg)] p-4 sm:p-6" dir="rtl">
      <section className="mx-auto max-w-7xl space-y-6">
        <header className="ds-card p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--fi-emerald)]">FAST INVESTMENT DEVELOPER HUB</p>
              <h1 className="mt-2 text-2xl font-black text-[var(--fi-ink)] sm:text-3xl">بوابة المطور العقاري</h1>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-7 text-[var(--fi-muted)]">
                متابعة المخزون، اهتمام العملاء، الاجتماعات، وأداء المشاريع من واجهة واحدة آمنة.
              </p>
            </div>
            <div className="rounded-xl bg-[var(--fi-soft)] px-4 py-3 text-sm font-black text-[var(--fi-emerald)]">
              {developerRows.map((row) => row.developers?.name_ar ?? row.developers?.name).filter(Boolean).join(' · ')}
            </div>
          </div>
        </header>

        <BentoGrid>
          <BentoKpiCard title="المشاريع" value={<AnimatedCount value={projects.length} />} hint="مرتبطة بالحساب" icon={<Building2 className="size-5" />} />
          <BentoKpiCard title="وحدات متاحة" value={<AnimatedCount value={availableUnits} />} hint={`${reservedUnits} محجوزة / محتجزة`} icon={<PackageCheck className="size-5" />} />
          <BentoKpiCard title="اهتمام العملاء" value={<AnimatedCount value={totalInterest} />} hint="مشاهدات وتفاعلات" icon={<Eye className="size-5" />} />
          <BentoKpiCard title="اجتماعات نشطة" value={<AnimatedCount value={bookedMeetings} />} hint="مجدولة أو مؤكدة" icon={<CalendarClock className="size-5" />} />
        </BentoGrid>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="ds-card overflow-hidden">
            <div className="border-b border-[var(--fi-line)] p-5">
              <h2 className="text-xl font-black text-[var(--fi-ink)]">مشاريع المطور</h2>
              <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">
                مؤشرات المخزون والاهتمام تساعد فريق المبيعات على التدخل في الوقت المناسب.
              </p>
            </div>
            <div className="divide-y divide-[var(--fi-line)]">
              {projects.map((project) => {
                const projectUnits = units.filter((unit) => unit.project_id === project.id)
                const projectEngagement = engagements
                  .filter((event) => event.project_id === project.id)
                  .reduce((sum, event) => sum + Number(event.event_count ?? 1), 0)
                const projectMeetings = meetings.filter((meeting) => meeting.project_id === project.id).length

                return (
                  <article key={project.id} className="grid gap-4 p-5 xl:grid-cols-[1.2fr_1fr]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-black text-[var(--fi-ink)]">{project.name_ar ?? project.name}</h3>
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                          {labelStatus(project.status)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-[var(--fi-muted)]">
                        {project.city ?? 'مدينة غير محددة'} · {project.location ?? 'موقع غير محدد'}
                      </p>
                      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <MiniMetric label="الوحدات" value={String(projectUnits.length || project.total_units || 0)} />
                        <MiniMetric label="المتاح" value={String(projectUnits.filter((unit) => unit.status === 'available').length || project.available_units || 0)} />
                        <MiniMetric label="الاهتمام" value={String(projectEngagement)} />
                        <MiniMetric label="المواعيد" value={String(projectMeetings)} />
                      </div>
                    </div>
                    <div className="rounded-xl bg-[var(--fi-soft)] p-4">
                      <div className="flex items-center gap-2 text-sm font-black text-[var(--fi-ink)]">
                        <BarChart3 className="size-4 text-[var(--fi-emerald)]" />
                        نطاق السعر
                      </div>
                      <p className="mt-3 text-xl font-black text-[var(--fi-ink)]">
                        {currency.format(Number(project.min_price ?? 0))} - {currency.format(Number(project.max_price ?? 0))} ج.م
                      </p>
                      <p className="mt-2 text-xs font-bold text-[var(--fi-muted)]">
                        قيمة المخزون المتاح الكلية: {currency.format(totalAvailableValue)} ج.م
                      </p>
                    </div>
                  </article>
                )
              })}
              {!projects.length ? (
                <div className="p-10 text-center text-sm font-bold text-[var(--fi-muted)]">
                  لا توجد مشاريع مرتبطة بهذا المطور حتى الآن.
                </div>
              ) : null}
            </div>
          </div>

          <aside className="space-y-4">
            <section className="ds-card p-5">
              <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-[var(--fi-soft)] text-[var(--fi-emerald)]">
                <Users className="size-5" />
              </div>
              <h2 className="text-lg font-black text-[var(--fi-ink)]">أحدث الوحدات</h2>
              <div className="mt-4 space-y-3">
                {units.slice(0, 8).map((unit) => (
                  <div key={unit.id} className="rounded-lg border border-[var(--fi-line)] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-black text-[var(--fi-ink)]">{unit.unit_number ?? 'بدون رقم'}</p>
                      <span className="rounded-full bg-[var(--fi-soft)] px-2 py-1 text-[10px] font-black text-[var(--fi-muted)]">
                        {labelUnitStatus(unit.status)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-bold text-[var(--fi-muted)]">
                      {unit.unit_type ?? 'وحدة'} · {unit.area_sqm ?? '-'} م² · {currency.format(Number(unit.price ?? 0))} ج.م
                    </p>
                  </div>
                ))}
                {!units.length ? (
                  <p className="rounded-lg border border-dashed border-[var(--fi-line)] p-6 text-center text-sm font-bold text-[var(--fi-muted)]">
                    لا توجد وحدات مستوردة بعد.
                  </p>
                ) : null}
              </div>
            </section>
          </aside>
        </section>
      </section>
    </main>
  )
}

function NoDeveloperAccess() {
  return (
    <main className="min-h-screen bg-[var(--fi-bg)] p-4 sm:p-6" dir="rtl">
      <section className="mx-auto max-w-3xl rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
        <h1 className="text-2xl font-black text-amber-900">لا توجد صلاحية مطور مرتبطة بحسابك</h1>
        <p className="mt-3 text-sm font-bold leading-7 text-amber-800">
          يجب ربط حسابك بجدول developer_accounts من خلال مدير المنصة قبل استخدام بوابة المطور.
        </p>
      </section>
    </main>
  )
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[var(--fi-soft)] p-3">
      <p className="text-[10px] font-black text-[var(--fi-muted)]">{label}</p>
      <p className="mt-1 text-sm font-black text-[var(--fi-ink)]">{value}</p>
    </div>
  )
}

function labelStatus(status: string | null) {
  const labels: Record<string, string> = {
    pre_launch: 'قبل الإطلاق',
    active: 'نشط',
    sold_out: 'مباع بالكامل',
    delivered: 'تم التسليم',
  }

  return labels[status ?? 'active'] ?? 'نشط'
}

function labelUnitStatus(status: string | null) {
  const labels: Record<string, string> = {
    available: 'متاحة',
    reserved: 'محجوزة',
    sold: 'مباعة',
    held: 'محتجزة',
  }

  return labels[status ?? 'available'] ?? 'متاحة'
}
