import { Building2, CircleDollarSign, HandCoins, TrendingUp, Users } from 'lucide-react'
import { AdminDashboardCharts } from '@/components/admin/admin-dashboard-charts'
import { Card, CardContent } from '@/components/ui/card'
import { createTypedServerClient } from '@/lib/supabase/typed'
import { requirePermission } from '@/shared/rbac/require-permission'

export const dynamic = 'force-dynamic'

const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
const thirtyDaysAgo = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)

function money(value: number) {
  return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(value)
}

function dealValue(deal: { value: number | null; amount: number | null; final_price: number | null; unit_value: number | null }) {
  return Number(deal.value ?? deal.amount ?? deal.final_price ?? deal.unit_value ?? 0)
}

export default async function SuperAdminDashboardPage() {
  await requirePermission('admin.view')
  const supabase = await createTypedServerClient()

  const [companies, users, agents, deals, commissions] = await Promise.all([
    supabase.from('companies').select('id, name, active, is_suspended, created_at'),
    supabase.from('user_profiles').select('id, role, status, created_at, company_id'),
    supabase.from('agents').select('id, company_id'),
    supabase.from('deals').select('id, company_id, stage, status, city:project_name, created_at, value, amount, final_price, unit_value').gte('created_at', monthStart),
    supabase.from('commissions').select('id, status, company_amount, gross_deal_value, deal_value, created_at'),
  ])

  const companyRows = companies.data ?? []
  const userRows = users.data ?? []
  const agentRows = agents.data ?? []
  const dealRows = deals.data ?? []
  const commissionRows = commissions.data ?? []

  const closedDeals = dealRows.filter((deal) => ['closed', 'won', 'Contracted', 'Registration'].includes(deal.stage ?? deal.status ?? ''))
  const gmv = closedDeals.reduce((sum, deal) => sum + dealValue(deal), 0)
  const platformRevenue = commissionRows
    .filter((commission) => commission.status === 'paid')
    .reduce((sum, commission) => sum + Number(commission.company_amount ?? 0), 0)

  const signups = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(thirtyDaysAgo)
    date.setDate(thirtyDaysAgo.getDate() + index)
    const key = date.toISOString().slice(0, 10)
    return {
      day: date.toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit' }),
      users: userRows.filter((user) => (user.created_at ?? '').slice(0, 10) === key).length,
    }
  })

  const cityMap = new Map<string, number>()
  closedDeals.forEach((deal) => {
    const city = deal.city ?? 'غير محدد'
    cityMap.set(city, (cityMap.get(city) ?? 0) + dealValue(deal))
  })

  const companyMap = new Map<string, number>()
  closedDeals.forEach((deal) => {
    const companyName = companyRows.find((company) => company.id === deal.company_id)?.name ?? 'شركة غير محددة'
    companyMap.set(companyName, (companyMap.get(companyName) ?? 0) + dealValue(deal))
  })

  return (
    <main className="space-y-6 p-4 sm:p-6" dir="rtl">
      <section className="rounded-lg border border-[var(--fi-line)] bg-[#050816] p-6 text-white shadow-xl">
        <p className="text-xs font-black text-[var(--fi-emerald)]">منصة Fast Investment CRM</p>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">لوحة تحكم المالك</h1>
        <p className="mt-2 text-sm text-white/60">مؤشرات مركزية لكل الشركات والوكلاء والصفقات والعمولات.</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi icon={Building2} label="الشركات" value={`${companyRows.length.toLocaleString('ar-EG')} / ${companyRows.filter((c) => c.active && !c.is_suspended).length.toLocaleString('ar-EG')} نشطة`} />
        <Kpi icon={Users} label="الوكلاء النشطون" value={agentRows.length.toLocaleString('ar-EG')} />
        <Kpi icon={TrendingUp} label="صفقات هذا الشهر" value={dealRows.length.toLocaleString('ar-EG')} />
        <Kpi icon={HandCoins} label="عمولات المنصة" value={money(platformRevenue)} />
        <Kpi icon={CircleDollarSign} label="GMV مغلق" value={money(gmv)} />
      </section>

      <AdminDashboardCharts
        signups={signups}
        citySales={Array.from(cityMap, ([city, value]) => ({ city, gmv: value })).sort((a, b) => b.gmv - a.gmv)}
        companyGmv={Array.from(companyMap, ([company, value]) => ({ company, gmv: value })).sort((a, b) => b.gmv - a.gmv).slice(0, 10)}
      />
    </main>
  )
}

function Kpi({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string }) {
  return (
    <Card className="border-[var(--fi-line)] bg-[var(--fi-paper)]">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--fi-soft)] text-[var(--fi-emerald)]">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-[var(--fi-muted)]">{label}</p>
          <p className="truncate text-lg font-black text-[var(--fi-ink)]">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
