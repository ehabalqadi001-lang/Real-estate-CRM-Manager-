import { getI18n } from '@/lib/i18n'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Building2, CheckCircle2, Home, WalletCards } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createTypedServerClient } from '@/lib/supabase/typed'
import { requirePermission } from '@/shared/rbac/require-permission'

export const dynamic = 'force-dynamic'

function formatEgp(value: number) {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(value)
}

export default async function InventoryDevelopersPage() {
  const { dir } = await getI18n()
  await requirePermission('developer.view')
  const supabase = await createTypedServerClient()

  const [developersResult, projectsResult, unitsResult] = await Promise.all([
    supabase.from('developers').select('*').order('name'),
    supabase.from('projects').select('id, developer_id'),
    supabase.from('units').select('id, project_id, status, price'),
  ])

  const error = developersResult.error ?? projectsResult.error ?? unitsResult.error
  const projects = projectsResult.data ?? []
  const units = unitsResult.data ?? []

  return (
    <main className="space-y-5 p-4 sm:p-6">
      <header className="ds-card-hover rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--fi-emerald)] text-white">
            <Building2 className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-[var(--fi-ink)]">مطورو المخزون</h1>
            <p className="text-sm text-[var(--fi-muted)]">إحصائيات المطورين وربط مباشر بفلاتر المخزون.</p>
          </div>
        </div>
      </header>

      {error ? (
        <div className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] p-10 text-center">
          <p className="font-black text-[var(--fi-ink)]">تعذر تحميل المطورين</p>
          <p className="mt-2 text-sm text-[var(--fi-muted)]">{error.message}</p>
        </div>
      ) : developersResult.data?.length ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {developersResult.data.map((developer) => {
            const developerProjects = projects.filter((project) => project.developer_id === developer.id)
            const projectIds = new Set(developerProjects.map((project) => project.id))
            const developerUnits = units.filter((unit) => unit.project_id && projectIds.has(unit.project_id))
            const availableUnits = developerUnits.filter((unit) => unit.status === 'available')
            const totalValue = availableUnits.reduce((sum, unit) => sum + Number(unit.price ?? 0), 0)

            return (
              <Link key={developer.id} href={`/dashboard/inventory?developer=${developer.id}`}>
                <Card className="ds-card-hover h-full border-[var(--fi-line)] bg-[var(--fi-paper)] transition hover:shadow-md">
                  <CardContent className="space-y-5 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {developer.logo_url ? (
                          <Image
                            src={developer.logo_url}
                            alt={developer.name_ar ?? developer.name}
                            width={48}
                            height={48}
                            className="size-12 rounded-lg border border-[var(--fi-line)] object-contain"
                          />
                        ) : (
                          <div className="flex size-12 items-center justify-center rounded-lg border border-[var(--fi-line)] bg-[var(--fi-soft)] font-black text-[var(--fi-muted)]">
                            {(developer.name_ar ?? developer.name).slice(0, 2)}
                          </div>
                        )}
                        <div>
                          <h2 className="font-black text-[var(--fi-ink)]">{developer.name_ar ?? developer.name}</h2>
                          <p className="text-sm text-[var(--fi-muted)]">{developer.city ?? developer.region ?? 'مصر'}</p>
                        </div>
                      </div>
                      <Badge className="border border-[var(--fi-line)] bg-[var(--fi-soft)] text-[var(--fi-ink)]">
                        {developer.tier === 'premium' ? 'مميز' : developer.tier === 'basic' ? 'أساسي' : 'قياسي'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Metric icon={Building2} label="مشاريع" value={developerProjects.length.toLocaleString('ar-EG')} />
                      <Metric icon={Home} label="وحدات" value={developerUnits.length.toLocaleString('ar-EG')} />
                      <Metric icon={CheckCircle2} label="متاح" value={availableUnits.length.toLocaleString('ar-EG')} />
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-[var(--fi-soft)] p-3">
                      <div>
                        <p className="text-xs text-[var(--fi-muted)]">قيمة المتاح</p>
                        <p className="font-black text-[var(--fi-ink)]">{formatEgp(totalValue)}</p>
                      </div>
                      <ArrowLeft className="size-4 text-[var(--fi-muted)]" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </section>
      ) : (
        <div className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] p-10 text-center">
          <WalletCards className="mx-auto mb-3 size-10 text-[var(--fi-muted)]" />
          <p className="font-black text-[var(--fi-ink)]">لا يوجد مطورون مسجلون</p>
          <p className="mt-2 text-sm text-[var(--fi-muted)]">أضف المطورين أولاً حتى تظهر كروت الإحصائيات.</p>
        </div>
      )}
    </main>
  )
}

function Metric({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--fi-line)] p-3">
      <Icon className="mb-2 size-4 text-[var(--fi-muted)]" />
      <p className="text-xs text-[var(--fi-muted)]">{label}</p>
      <p className="font-black text-[var(--fi-ink)]">{value}</p>
    </div>
  )
}
