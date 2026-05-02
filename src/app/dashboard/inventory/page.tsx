import { Building2, CheckCircle2, Clock3, Hand, Home, WalletCards } from 'lucide-react'
import AddUnitButton from '@/components/inventory/AddUnitButton'
import { InventoryClient } from '@/components/inventory/inventory-client'
import type { InventoryDeveloper, InventoryStats, InventoryUnit, PaymentPlan, UnitStatus } from '@/components/inventory/inventory-types'
import { Card, CardContent } from '@/components/ui/card'
import { createTypedServerClient } from '@/lib/supabase/typed'
import { requirePermission } from '@/shared/rbac/require-permission'
import type { Database } from '@/lib/types/supabase.generated'

export const dynamic = 'force-dynamic'

type DeveloperRow = Database['public']['Tables']['developers']['Row']
type ProjectRow = Database['public']['Tables']['projects']['Row']
type UnitRow = Database['public']['Tables']['units']['Row']
type PaymentPlanRow = Database['public']['Tables']['payment_plans']['Row']

type UnitWithProject = UnitRow & {
  projects: (ProjectRow & {
    developers: DeveloperRow | null
  }) | null
}

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeStatus(status: string | null): UnitStatus {
  if (status === 'reserved' || status === 'sold' || status === 'held') return status
  return 'available'
}

function normalizeDeveloper(row: DeveloperRow): InventoryDeveloper {
  return {
    id: row.id,
    name: row.name,
    nameAr: row.name_ar ?? row.name,
    logoUrl: row.logo_url,
    tier: row.tier,
    active: row.active ?? true,
    phone: row.phone,
    email: row.email,
  }
}

function normalizePlan(row: PaymentPlanRow): PaymentPlan {
  return {
    id: row.id,
    unitId: row.unit_id ?? '',
    name: row.name,
    downPaymentPercentage: row.down_payment_percentage,
    installmentYears: row.installment_years,
    installmentFrequency: row.installment_frequency,
    maintenanceFeePercentage: row.maintenance_fee_percentage,
    description: row.description,
    active: row.active ?? true,
  }
}

function normalizeUnit(row: UnitWithProject, plans: PaymentPlan[]): InventoryUnit {
  const project = row.projects
  const developer = project?.developers
  const projectImages = project?.gallery_urls ?? project?.images ?? []
  const unitImages = row.images ?? []

  return {
    id: row.id,
    unitNumber: row.unit_number,
    projectId: row.project_id,
    projectName: project?.name ?? 'مشروع غير محدد',
    projectNameAr: project?.name_ar ?? project?.name ?? 'مشروع غير محدد',
    developerId: developer?.id ?? project?.developer_id ?? null,
    developerName: developer?.name ?? project?.developer_name ?? 'مطور غير محدد',
    developerNameAr: developer?.name_ar ?? developer?.name ?? project?.developer_name ?? 'مطور غير محدد',
    developerLogoUrl: developer?.logo_url ?? null,
    city: project?.city ?? 'القاهرة',
    location: project?.location ?? null,
    latitude: project?.latitude ?? project?.lat ?? null,
    longitude: project?.longitude ?? project?.lng ?? null,
    unitType: row.unit_type ?? 'apartment',
    areaSqm: toNumber(row.area_sqm),
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    floorNumber: row.floor_number ?? row.floor,
    building: row.building,
    finishing: row.finishing,
    view: row.view,
    price: toNumber(row.price),
    downPayment: row.down_payment,
    monthlyInstallment: row.monthly_installment,
    installmentYears: row.installment_years,
    status: normalizeStatus(row.status),
    heldUntil: row.held_until,
    coverImageUrl: unitImages[0] ?? project?.cover_image_url ?? project?.cover_image ?? null,
    galleryUrls: [...unitImages, ...projectImages],
    floorPlanUrl: row.floor_plan_url,
    virtualTourUrl: row.virtual_tour_url,
    features: row.features ?? project?.amenities ?? [],
    notes: row.notes,
    createdAt: row.created_at,
    paymentPlans: plans,
  }
}

function calculateStats(units: InventoryUnit[]): InventoryStats {
  const availableUnits = units.filter((unit) => unit.status === 'available')
  const totalValue = availableUnits.reduce((sum, unit) => sum + unit.price, 0)

  return {
    total: units.length,
    available: availableUnits.length,
    reserved: units.filter((unit) => unit.status === 'reserved').length,
    held: units.filter((unit) => unit.status === 'held').length,
    sold: units.filter((unit) => unit.status === 'sold').length,
    totalValue,
    averagePrice: availableUnits.length ? totalValue / availableUnits.length : 0,
  }
}

function formatEgp(value: number) {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(value)
}

export default async function InventoryPage({
  searchParams,
}: {
  searchParams?: Promise<{ developer?: string | string[] }>
}) {
  await requirePermission('unit.view')
  const params = await searchParams
  const initialDeveloperIds = Array.isArray(params?.developer)
    ? params.developer
    : params?.developer
      ? [params.developer]
      : []
  const supabase = await createTypedServerClient()

  const [developersResult, unitsResult, plansResult] = await Promise.all([
    supabase.from('developers').select('*').order('name'),
    supabase
      .from('units')
      .select('*, projects(*, developers(*))')
      .order('created_at', { ascending: false }),
    supabase.from('payment_plans').select('*').eq('active', true),
  ])

  const error = developersResult.error ?? unitsResult.error ?? plansResult.error

  const developers = (developersResult.data ?? []).map(normalizeDeveloper)
  const plansByUnit = new Map<string, PaymentPlan[]>()
  ;(plansResult.data ?? []).map(normalizePlan).forEach((plan) => {
    if (!plansByUnit.has(plan.unitId)) plansByUnit.set(plan.unitId, [])
    plansByUnit.get(plan.unitId)?.push(plan)
  })

  const units = ((unitsResult.data ?? []) as UnitWithProject[]).map((unit) => normalizeUnit(unit, plansByUnit.get(unit.id) ?? []))
  const stats = calculateStats(units)

  return (
    <main className="space-y-5 p-4 sm:p-6">
      <header className="ds-card-hover flex flex-col gap-4 rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--fi-emerald)] text-white">
            <Building2 className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-[var(--fi-ink)]">إدارة المخزون العقاري</h1>
            <p className="text-sm text-[var(--fi-muted)]">
              {developers.length} مطور · {units.length} وحدة · بيانات متصلة مباشرة بـ Supabase
            </p>
          </div>
        </div>
        <AddUnitButton />
      </header>

      {error ? (
        <div className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] p-10 text-center">
          <p className="font-black text-[var(--fi-ink)]">تعذر تحميل المخزون</p>
          <p className="mt-2 text-sm text-[var(--fi-muted)]">{error.message}</p>
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 xs:grid-cols-2 gap-3 lg:grid-cols-6">
            <StatCard label="إجمالي الوحدات" value={stats.total.toLocaleString('ar-EG')} icon={Home} />
            <StatCard label="متاح" value={stats.available.toLocaleString('ar-EG')} icon={CheckCircle2} />
            <StatCard label="محتجز" value={stats.held.toLocaleString('ar-EG')} icon={Hand} />
            <StatCard label="محجوز" value={stats.reserved.toLocaleString('ar-EG')} icon={Clock3} />
            <StatCard label="القيمة المتاحة" value={formatEgp(stats.totalValue)} icon={WalletCards} />
            <StatCard label="متوسط السعر" value={formatEgp(stats.averagePrice)} icon={WalletCards} />
          </section>

          <InventoryClient units={units} developers={developers} initialDeveloperIds={initialDeveloperIds} />
        </>
      )}
    </main>
  )
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Home }) {
  return (
    <Card className="ds-card-hover border-[var(--fi-line)] bg-[var(--fi-paper)]">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex size-9 items-center justify-center rounded-lg bg-[var(--fi-soft)] text-[var(--fi-emerald)]">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-[var(--fi-muted)]">{label}</p>
          <p className="truncate font-black text-[var(--fi-ink)]">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
