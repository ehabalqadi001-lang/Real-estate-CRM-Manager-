import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, CheckCircle2, FileSpreadsheet } from 'lucide-react'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requireSession } from '@/shared/auth/session'
import { hasPermission } from '@/shared/rbac/permissions'
import { nullableUuid } from '@/lib/uuid'
import { BatchProcessButton } from '../../BatchProcessButton'
import { MappingReviewForm } from './MappingReviewForm'

export const dynamic = 'force-dynamic'

type RouteProps = {
  params: Promise<{ batchId: string }>
}

type BatchRow = {
  id: string
  source_name: string | null
  source_type: string
  status: string
  total_rows: number
  processed_rows: number
  failed_rows: number
  mapping_payload: Record<string, unknown>
  created_at: string
}

type IngestionRow = {
  id: string
  row_number: number
  raw_payload: Record<string, unknown>
  mapped_payload: Record<string, unknown>
  status: string
  error_message: string | null
}

export default async function InventoryBatchReviewPage({ params }: RouteProps) {
  const session = await requireSession()
  if (!hasPermission(session.profile.role, 'inventory.import')) redirect('/dashboard')

  const { batchId: rawBatchId } = await params
  const batchId = nullableUuid(rawBatchId)
  if (!batchId) redirect('/dashboard/integrations')

  const service = createServiceRoleClient()
  const [batchResult, rowsResult] = await Promise.all([
    service
      .from('inventory_ingestion_batches')
      .select('id, source_name, source_type, status, total_rows, processed_rows, failed_rows, mapping_payload, created_at')
      .eq('id', batchId)
      .maybeSingle(),
    service
      .from('inventory_ingestion_rows')
      .select('id, row_number, raw_payload, mapped_payload, status, error_message')
      .eq('batch_id', batchId)
      .order('row_number')
      .limit(50),
  ])

  if (batchResult.error || rowsResult.error) {
    const message = batchResult.error?.message ?? rowsResult.error?.message ?? 'تعذر تحميل ملف الاستيراد.'
    return <ErrorState message={message} />
  }

  const batch = batchResult.data as BatchRow | null
  if (!batch) redirect('/dashboard/integrations')

  const rows = (rowsResult.data ?? []) as IngestionRow[]
  const mappingPayload = batch.mapping_payload ?? {}
  const headers = Array.isArray(mappingPayload.headers) ? mappingPayload.headers.map(String) : Object.keys(rows[0]?.raw_payload ?? {})
  const mapping = ((mappingPayload.detected_mapping ?? {}) as Record<string, string>) ?? {}

  return (
    <main className="space-y-6 p-4 sm:p-6" dir="rtl">
      <section className="ds-card p-5 sm:p-6">
        <Link href="/dashboard/integrations" className="mb-4 inline-flex items-center gap-2 text-sm font-black text-[var(--fi-emerald)]">
          <ArrowRight className="size-4" aria-hidden="true" />
          العودة للتكاملات
        </Link>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[var(--fi-soft)] text-[var(--fi-emerald)]">
              <FileSpreadsheet className="size-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--fi-emerald)]">SMART CSV / EXCEL REVIEW</p>
              <h1 className="mt-2 text-2xl font-black text-[var(--fi-ink)]">{batch.source_name ?? 'ملف استيراد'}</h1>
              <p className="mt-2 text-sm font-semibold text-[var(--fi-muted)]">
                {labelSource(batch.source_type)} · {batch.total_rows} صف · الحالة: {labelStatus(batch.status)}
              </p>
            </div>
          </div>
          <BatchProcessButton batchId={batch.id} />
        </div>
      </section>

      <MappingReviewForm batchId={batch.id} headers={headers} mapping={mapping} />

      <section className="ds-card overflow-hidden">
        <div className="border-b border-[var(--fi-line)] p-5">
          <h2 className="text-xl font-black text-[var(--fi-ink)]">معاينة الصفوف</h2>
          <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">أول 50 صف بعد تطبيق mapping الحالي.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="bg-[var(--fi-soft)] text-xs font-black text-[var(--fi-muted)]">
                <th className="px-4 py-3 text-right">#</th>
                <th className="px-4 py-3 text-right">المشروع</th>
                <th className="px-4 py-3 text-right">الوحدة</th>
                <th className="px-4 py-3 text-right">النوع</th>
                <th className="px-4 py-3 text-right">المساحة</th>
                <th className="px-4 py-3 text-right">السعر</th>
                <th className="px-4 py-3 text-right">الحالة</th>
                <th className="px-4 py-3 text-right">المراجعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--fi-line)]">
              {rows.map((row) => {
                const mapped = row.mapped_payload ?? {}
                const valid = Boolean(mapped.project_name && mapped.unit_number && mapped.price)
                return (
                  <tr key={row.id}>
                    <td className="px-4 py-3 font-bold text-[var(--fi-muted)]">{row.row_number}</td>
                    <td className="px-4 py-3 font-black text-[var(--fi-ink)]">{String(mapped.project_name ?? '-')}</td>
                    <td className="px-4 py-3 font-bold">{String(mapped.unit_number ?? '-')}</td>
                    <td className="px-4 py-3 font-bold">{String(mapped.unit_type ?? '-')}</td>
                    <td className="px-4 py-3 font-bold">{String(mapped.area_sqm ?? '-')}</td>
                    <td className="px-4 py-3 font-black">{Number(mapped.price ?? 0).toLocaleString('ar-EG')} ج.م</td>
                    <td className="px-4 py-3 font-bold">{String(mapped.status ?? '-')}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black ${valid ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {valid ? <CheckCircle2 className="size-3" aria-hidden="true" /> : null}
                        {valid ? 'جاهز' : row.error_message ?? 'ناقص'}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {!rows.length ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm font-bold text-[var(--fi-muted)]">
                    لا توجد صفوف داخل هذا الملف.
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

function ErrorState({ message }: { message: string }) {
  return (
    <main className="p-6" dir="rtl">
      <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{message}</section>
    </main>
  )
}

function labelSource(source: string) {
  return source === 'excel' ? 'Excel' : source.toUpperCase()
}

function labelStatus(status: string) {
  const labels: Record<string, string> = {
    pending: 'بانتظار المراجعة',
    processing: 'قيد المعالجة',
    completed: 'مكتمل',
    failed: 'فشل',
    partially_completed: 'مكتمل جزئياً',
  }

  return labels[status] ?? status
}
