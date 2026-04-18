import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Kanban, List, Plus, Sparkles } from 'lucide-react'
import KanbanBoard from '@/components/deals/KanbanBoard'
import { updateDealStage } from './actions'

export const dynamic = 'force-dynamic'

export default async function DealsKanbanPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).maybeSingle()
  const targetCompanyId = profile?.company_id || user.id

  const { data: deals } = await supabase
    .from('deals')
    .select('id, title, stage, unit_value, buyer_name, compound')
    .eq('company_id', targetCompanyId)
    .order('created_at', { ascending: false })

  const totalValue = (deals ?? []).reduce((sum, deal) => sum + Number(deal.unit_value ?? 0), 0)

  return (
    <div className="min-h-screen space-y-4 px-3 py-4 sm:px-4 lg:px-6" dir="rtl">
      <section className="fi-card overflow-hidden p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex size-10 items-center justify-center rounded-lg bg-[var(--fi-soft)] text-[var(--fi-emerald)]">
                <Kanban size={20} />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--fi-emerald)]">FAST PIPELINE</p>
                <h1 className="mt-1 text-xl font-black text-[var(--fi-ink)] sm:text-2xl">لوحة الصفقات</h1>
              </div>
            </div>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-[var(--fi-muted)]">
              حرّك الصفقات بين المراحل على سطح المكتب، واستخدم أزرار النقل السريع أو تبويبات المراحل على الموبايل لتجربة لمس أوضح.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Link
              href="/dashboard/deals"
              className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-black text-[var(--fi-muted)] transition hover:border-[var(--fi-emerald)] hover:text-[var(--fi-ink)]"
            >
              <List size={16} />
              عرض القائمة
            </Link>
            <Link
              href="/dashboard/deals"
              className="fi-primary-button flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-black"
            >
              <Plus size={16} />
              صفقة جديدة
            </Link>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <PipelineMetric label="إجمالي الصفقات" value={(deals ?? []).length.toLocaleString('ar-EG')} />
          <PipelineMetric label="قيمة pipeline" value={`${new Intl.NumberFormat('ar-EG', { notation: 'compact', maximumFractionDigits: 1 }).format(totalValue)} ج.م`} />
          <PipelineMetric label="تجربة الموبايل" value="Touch Ready" icon={Sparkles} />
        </div>
      </section>

      <KanbanBoard initialDeals={deals ?? []} onStageChange={updateDealStage} />
    </div>
  )
}

function PipelineMetric({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof Sparkles }) {
  return (
    <div className="rounded-lg border border-[var(--fi-line)] bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black text-[var(--fi-muted)]">{label}</p>
        {Icon && <Icon className="size-4 text-[var(--fi-emerald)]" />}
      </div>
      <p className="fi-tabular mt-2 text-lg font-black text-[var(--fi-ink)]">{value}</p>
    </div>
  )
}
