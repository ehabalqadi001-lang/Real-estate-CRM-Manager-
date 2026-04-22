import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Activity, DatabaseZap, PlugZap, RefreshCw } from 'lucide-react'
import { requireSession } from '@/shared/auth/session'
import { createServerSupabaseClient } from '@/shared/supabase/server'
import { nullableUuid } from '@/lib/uuid'
import { BentoGrid, BentoKpiCard } from '@/components/dashboard/BentoDashboardLayout'
import { AnimatedCount } from '@/components/design-system/animated-count'
import { AddIntegrationForm } from './AddIntegrationForm'
import { InventoryImportForm } from './InventoryImportForm'
import { BatchProcessButton } from './BatchProcessButton'

export const dynamic = 'force-dynamic'

type IntegrationRow = {
  id: string
  name: string
  provider: string
  integration_type: string
  last_status: string | null
  sync_frequency_minutes: number | null
  active: boolean | null
  created_at: string
}

type BatchRow = {
  id: string
  source_name: string | null
  source_type: string
  status: string
  total_rows: number
  processed_rows: number
  failed_rows: number
  created_at: string
}

const ALLOWED = new Set([
  'super_admin',
  'platform_admin',
  'company_owner',
  'company_admin',
  'data_manager',
  'inventory_rep',
  'developer_relations_manager',
  'admin',
  'company',
])

export default async function IntegrationsPage() {
  const session = await requireSession()
  if (!ALLOWED.has(session.profile.role)) redirect('/dashboard')

  const companyId = nullableUuid(session.profile.company_id) ?? nullableUuid(session.profile.tenant_id)
  const supabase = await createServerSupabaseClient()

  const integrationsQuery = supabase.from('api_integrations').select('*').order('created_at', { ascending: false })
  const eventsQuery = supabase.from('inventory_feed_events').select('id, status, event_type').limit(200)
  const batchesQuery = supabase
    .from('inventory_ingestion_batches')
    .select('id, source_name, source_type, status, total_rows, processed_rows, failed_rows, created_at')
    .order('created_at', { ascending: false })
    .limit(8)

  if (companyId) {
    integrationsQuery.eq('company_id', companyId)
    eventsQuery.eq('company_id', companyId)
    batchesQuery.eq('company_id', companyId)
  }

  const [integrationsResult, developersResult, eventsResult, batchesResult] = await Promise.all([
    integrationsQuery,
    supabase.from('developers').select('id, name, name_ar').order('name_ar'),
    eventsQuery,
    batchesQuery,
  ])

  const integrations = (integrationsResult.data ?? []) as IntegrationRow[]
  const developers = developersResult.data ?? []
  const events = eventsResult.data ?? []
  const batches = (batchesResult.data ?? []) as BatchRow[]
  const failedEvents = events.filter((event) => event.status === 'failed').length
  const pageError = integrationsResult.error || developersResult.error || eventsResult.error || batchesResult.error

  return (
    <main className="space-y-6 p-4 sm:p-6" dir="rtl">
      <section className="ds-card p-5 sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--fi-emerald)]">API-FIRST DEVELOPER GATEWAY</p>
        <h1 className="mt-2 text-2xl font-black text-[var(--fi-ink)] sm:text-3xl">تكاملات المطورين والمخزون</h1>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-7 text-[var(--fi-muted)]">
          نقطة دخول موحدة لتحديثات الوحدات، الأسعار، التوافر، وخطط السداد من قواعد بيانات المطورين.
        </p>
      </section>

      {pageError ? (
        <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          تعذر تحميل التكاملات: {pageError.message}
        </section>
      ) : null}

      <BentoGrid>
        <BentoKpiCard title="التكاملات" value={<AnimatedCount value={integrations.length} />} hint="مصادر بيانات" icon={<PlugZap className="size-5" />} />
        <BentoKpiCard title="النشطة" value={<AnimatedCount value={integrations.filter((item) => item.active).length} />} hint="جاهزة للمزامنة" icon={<RefreshCw className="size-5" />} />
        <BentoKpiCard title="Feed Events" value={<AnimatedCount value={events.length} />} hint="آخر 200 حدث" icon={<DatabaseZap className="size-5" />} />
        <BentoKpiCard title="أخطاء المزامنة" value={<AnimatedCount value={failedEvents} />} hint="تحتاج مراجعة" icon={<Activity className="size-5" />} />
      </BentoGrid>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="space-y-6">
          <AddIntegrationForm developers={developers} />
          <InventoryImportForm developers={developers} />
        </div>
        <section className="ds-card overflow-hidden">
          <div className="border-b border-[var(--fi-line)] p-5">
            <h2 className="text-xl font-black text-[var(--fi-ink)]">مصادر البيانات</h2>
          </div>
          <div className="divide-y divide-[var(--fi-line)]">
            {integrations.map((integration) => (
              <div key={integration.id} className="grid gap-3 p-5 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <h3 className="font-black text-[var(--fi-ink)]">{integration.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">
                    {integration.provider} · {labelIntegrationType(integration.integration_type)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${integration.last_status === 'failed' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {labelStatus(integration.last_status)}
                  </span>
                  <span className="rounded-full bg-[var(--fi-soft)] px-3 py-1 text-xs font-black text-[var(--fi-muted)]">
                    كل {integration.sync_frequency_minutes ?? 60} دقيقة
                  </span>
                </div>
              </div>
            ))}
            {!integrations.length ? (
              <div className="p-10 text-center text-sm font-bold text-[var(--fi-muted)]">
                لا توجد تكاملات حتى الآن.
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <section className="ds-card overflow-hidden">
        <div className="border-b border-[var(--fi-line)] p-5">
          <h2 className="text-xl font-black text-[var(--fi-ink)]">آخر ملفات الاستيراد</h2>
          <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">كل ملف يمر عبر batch مستقل قبل تطبيقه على المخزون.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="bg-[var(--fi-soft)] text-xs font-black text-[var(--fi-muted)]">
                <th className="px-4 py-3 text-right">الملف</th>
                <th className="px-4 py-3 text-right">المصدر</th>
                <th className="px-4 py-3 text-right">الحالة</th>
                <th className="px-4 py-3 text-right">الصفوف</th>
                <th className="px-4 py-3 text-right">المعالج</th>
                <th className="px-4 py-3 text-right">الأخطاء</th>
                <th className="px-4 py-3 text-right">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--fi-line)]">
              {batches.map((batch) => (
                <tr key={batch.id}>
                  <td className="px-4 py-3 font-black text-[var(--fi-ink)]">{batch.source_name ?? batch.id}</td>
                  <td className="px-4 py-3 font-bold text-[var(--fi-muted)]">{batch.source_type}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-[var(--fi-soft)] px-3 py-1 text-xs font-black text-[var(--fi-emerald)]">
                      {labelBatchStatus(batch.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold">{batch.total_rows}</td>
                  <td className="px-4 py-3 font-bold text-emerald-700">{batch.processed_rows}</td>
                  <td className="px-4 py-3 font-bold text-red-700">{batch.failed_rows}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/dashboard/integrations/batches/${batch.id}`}
                        className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[var(--fi-line)] bg-white px-3 text-xs font-black text-[var(--fi-ink)] transition hover:border-[var(--fi-emerald)] dark:bg-white/5"
                      >
                        مراجعة
                      </Link>
                      <BatchProcessButton batchId={batch.id} />
                    </div>
                  </td>
                </tr>
              ))}
              {!batches.length ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm font-bold text-[var(--fi-muted)]">
                    لا توجد ملفات استيراد حتى الآن.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

function labelIntegrationType(type: string) {
  const labels: Record<string, string> = {
    inventory: 'المخزون',
    prices: 'الأسعار',
    payment_plans: 'خطط السداد',
    availability: 'التوافر',
    leads: 'العملاء',
    webhook: 'Webhook',
  }

  return labels[type] ?? type
}

function labelStatus(status: string | null) {
  const labels: Record<string, string> = {
    pending: 'بانتظار أول مزامنة',
    success: 'ناجح',
    failed: 'فشل',
    disabled: 'معطل',
  }

  return labels[status ?? 'pending'] ?? 'بانتظار أول مزامنة'
}

function labelBatchStatus(status: string) {
  const labels: Record<string, string> = {
    pending: 'بانتظار المعالجة',
    processing: 'قيد المعالجة',
    completed: 'مكتمل',
    failed: 'فشل',
    partially_completed: 'مكتمل جزئياً',
  }

  return labels[status] ?? status
}
