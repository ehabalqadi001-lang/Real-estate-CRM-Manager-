import Link from 'next/link'
import { ArrowRight, Banknote, CheckCircle2, FileText, XCircle } from 'lucide-react'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requireSession } from '@/shared/auth/session'
import { isManagerRole, isSuperAdmin } from '@/shared/auth/types'
import { reviewBrokerSale, reviewBrokerSaleDocument, updateBrokerSaleLifecycle } from '../../actions'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

const money = (value: number | null | undefined) =>
  new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(Number(value ?? 0))

const stageLabels: Record<string, string> = {
  eoi: 'EOI',
  reservation: 'Reservation',
  contract: 'Contract',
}

const lifecycleLabels: Record<string, string> = {
  sale_submitted: 'تم رفع البيع',
  sale_approved: 'تم اعتماد البيع',
  claim_submitted_to_developer: 'تم تقديم المطالبة للمطور',
  developer_commission_collected: 'تم تحصيل العمولة من المطور',
  broker_payout_scheduled: 'تم تحديد موعد صرف الشريك',
  broker_paid: 'تم صرف عمولة الشريك',
  rejected: 'مرفوض',
}

export default async function BrokerSaleDetailPage({ params }: PageProps) {
  const session = await requireSession()
  if (!isManagerRole(session.profile.role) && !isSuperAdmin(session.profile.role) && session.profile.role !== 'account_manager') {
    return (
      <main className="p-6" dir="rtl">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 sm:p-6 text-sm font-black text-red-700">
          غير مصرح لك بمراجعة مبيعات الشركاء.
        </div>
      </main>
    )
  }

  const { id } = await params
  const service = createServiceRoleClient()
  const [{ data: sale }, { data: documents }] = await Promise.all([
    service
      .from('broker_sales_submissions')
      .select('*')
      .eq('id', id)
      .maybeSingle(),
    service
      .from('broker_sale_documents')
      .select('*')
      .eq('sale_submission_id', id)
      .order('created_at', { ascending: true }),
  ])

  if (!sale) {
    return (
      <main className="p-6" dir="rtl">
        <Link href="/dashboard/partners" className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-[var(--fi-muted)]">
          <ArrowRight className="size-4" /> العودة لإدارة الشركاء
        </Link>
        <div className="rounded-2xl border border-[var(--fi-line)] bg-white p-4 sm:p-8 text-center text-sm font-bold text-[var(--fi-muted)]">
          طلب البيع غير موجود.
        </div>
      </main>
    )
  }

  const docs = await Promise.all((documents ?? []).map(async (document) => {
    const { data } = await service.storage.from('documents').createSignedUrl(document.url, 60 * 10)
    return { ...document, signedUrl: data?.signedUrl ?? null }
  }))
  const approvedDocs = docs.filter((doc) => doc.status === 'approved').length
  const rejectedDocs = docs.filter((doc) => doc.status === 'rejected').length

  return (
    <main className="space-y-5 p-4 sm:p-6" dir="rtl">
      <Link href="/dashboard/partners" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--fi-muted)] hover:text-[var(--fi-ink)]">
        <ArrowRight className="size-4" /> العودة لإدارة الشركاء
      </Link>

      <section className="rounded-2xl border border-[var(--fi-line)] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--fi-emerald)]">SALE REVIEW</p>
            <h1 className="mt-2 text-2xl font-black text-[var(--fi-ink)]">{sale.project_name}</h1>
            <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">
              {sale.client_name} - {sale.developer_name || 'مطور غير محدد'} - {stageLabels[sale.stage ?? 'eoi']}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>{sale.status}</Badge>
            <Badge>{lifecycleLabels[sale.commission_lifecycle_stage ?? 'sale_submitted']}</Badge>
            <Badge>المستندات: {sale.documents_review_status ?? 'pending'}</Badge>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <Kpi label="قيمة البيع" value={`${money(sale.deal_value)} ج.م`} />
        <Kpi label="إجمالي العمولة" value={`${money(sale.gross_commission)} ج.م`} />
        <Kpi label="عمولة الشريك" value={`${money(sale.broker_commission_amount)} ج.م`} />
        <Kpi label="مستندات معتمدة / مرفوضة" value={`${approvedDocs}/${rejectedDocs}`} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-[var(--fi-line)] bg-white shadow-sm">
            <div className="border-b border-[var(--fi-line)] p-5">
              <h2 className="text-lg font-black text-[var(--fi-ink)]">مراجعة المستندات</h2>
              <p className="mt-1 text-xs font-bold text-[var(--fi-muted)]">
                يتم اعتماد أو رفض كل مستند على حدة مع تسجيل سبب الرفض.
              </p>
            </div>
            <div className="divide-y divide-[var(--fi-line)]">
              {docs.length === 0 ? (
                <div className="p-8 text-center text-sm font-bold text-[var(--fi-muted)]">لا توجد مستندات مرفوعة لهذا البيع.</div>
              ) : docs.map((document) => (
                <article key={document.id} className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_360px]">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText className="size-5 text-[var(--fi-emerald)]" />
                      <h3 className="truncate text-sm font-black text-[var(--fi-ink)]">{document.name}</h3>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-[var(--fi-muted)]">
                      <span>{document.mime_type || 'ملف'}</span>
                      <span>{Number(document.file_size ?? 0).toLocaleString('ar-EG')} bytes</span>
                      <span className="rounded-full border border-[var(--fi-line)] px-2 py-0.5">{document.status}</span>
                    </div>
                    {document.rejection_reason && (
                      <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs font-bold text-red-700">{document.rejection_reason}</p>
                    )}
                    <a href={document.signedUrl ?? '#'} target="_blank" rel="noreferrer" className="mt-3 inline-flex h-8 items-center rounded-lg border border-[var(--fi-line)] px-3 text-xs font-black text-[var(--fi-ink)] hover:bg-[var(--fi-soft)]">
                      فتح المستند
                    </a>
                  </div>
                  <form action={reviewBrokerSaleDocument} className="space-y-2 rounded-xl bg-[var(--fi-soft)] p-3">
                    <input type="hidden" name="saleId" value={id} />
                    <input type="hidden" name="documentId" value={document.id} />
                    <textarea name="reason" rows={2} placeholder="سبب الرفض إن وجد" className="w-full rounded-lg border border-[var(--fi-line)] bg-white p-3 text-xs font-bold outline-none" />
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                      <button name="decision" value="approved" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--fi-emerald)] px-3 py-2 text-xs font-black text-white">
                        <CheckCircle2 className="size-4" /> اعتماد
                      </button>
                      <button name="decision" value="rejected" className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-black text-white">
                        <XCircle className="size-4" /> رفض
                      </button>
                    </div>
                  </form>
                </article>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-[var(--fi-line)] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-[var(--fi-ink)]">بيانات البيع</h2>
            <div className="mt-4 space-y-3 text-sm">
              <Info label="العميل" value={sale.client_name} />
              <Info label="رقم العميل" value={sale.client_phone || 'غير محدد'} />
              <Info label="المشروع" value={sale.project_name} />
              <Info label="المطور" value={sale.developer_name || 'غير محدد'} />
              <Info label="الوحدة" value={sale.unit_code || 'غير محدد'} />
              <Info label="موعد الصرف" value={sale.broker_payout_due_date || 'لم يحدد'} />
            </div>
          </div>

          {(sale.status === 'submitted' || sale.status === 'under_review') && (
            <form action={reviewBrokerSale} className="space-y-2 rounded-2xl border border-[var(--fi-line)] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black text-[var(--fi-ink)]">قرار البيع</h2>
              <input type="hidden" name="saleId" value={id} />
              <textarea name="reason" rows={3} placeholder="سبب الرفض إن وجد" className="w-full rounded-lg border border-[var(--fi-line)] bg-white p-3 text-sm font-semibold outline-none" />
              <button name="decision" value="approved" className="w-full rounded-lg bg-[var(--fi-emerald)] px-3 py-2 text-xs font-black text-white">اعتماد البيع وإنشاء العمولة</button>
              <button name="decision" value="rejected" className="w-full rounded-lg bg-red-600 px-3 py-2 text-xs font-black text-white">رفض البيع</button>
            </form>
          )}

          {sale.status === 'approved' && (
            <form action={updateBrokerSaleLifecycle} className="space-y-3 rounded-2xl border border-[var(--fi-line)] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black text-[var(--fi-ink)]">دورة العمولة</h2>
              <input type="hidden" name="saleId" value={id} />
              <select name="lifecycle" defaultValue={sale.commission_lifecycle_stage ?? 'sale_approved'} className="h-10 w-full rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-bold">
                <option value="claim_submitted_to_developer">تقديم المطالبة للمطور</option>
                <option value="developer_commission_collected">تحصيل العمولة من المطور</option>
                <option value="broker_payout_scheduled">تحديد موعد صرف الشريك</option>
                <option value="broker_paid">صرف عمولة الشريك</option>
              </select>
              <input name="collectedAmount" type="number" placeholder="المبلغ المحصل" className="h-10 w-full rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-semibold" />
              <input name="brokerPayoutDueDate" type="date" className="h-10 w-full rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-semibold" />
              <input name="paymentReference" placeholder="مرجع الدفع" className="h-10 w-full rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-semibold" />
              <button className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0C1A2E] px-3 py-2 text-xs font-black text-white">
                <Banknote className="size-4" /> تحديث المرحلة
              </button>
            </form>
          )}
        </aside>
      </section>
    </main>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-[var(--fi-line)] px-3 py-1 text-xs font-black text-[var(--fi-muted)]">{children}</span>
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--fi-line)] bg-white p-4 shadow-sm">
      <p className="text-xl font-black text-[var(--fi-ink)]">{value}</p>
      <p className="mt-1 text-xs font-bold text-[var(--fi-muted)]">{label}</p>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--fi-line)] pb-2 last:border-0">
      <span className="text-[var(--fi-muted)]">{label}</span>
      <span className="text-left font-black text-[var(--fi-ink)]">{value}</span>
    </div>
  )
}
