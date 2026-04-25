import { Banknote, FileUp, Handshake, Landmark, type LucideIcon } from 'lucide-react'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requireSession } from '@/shared/auth/session'
import { submitBrokerSale } from '@/app/dashboard/partners/actions'
import { SaleFormFields } from './SaleFormFields'
import { BrokerSubmitButton } from './BrokerSubmitButton'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'رفع المبيعات | FAST INVESTMENT' }

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
  developer_commission_collected: 'تم تحصيل عمولة المطور',
  broker_payout_scheduled: 'تم تحديد موعد الصرف',
  broker_paid: 'تم الصرف',
  rejected: 'مرفوض',
}

const documentStatusLabels: Record<string, string> = {
  pending: 'قيد المراجعة',
  approved: 'معتمد',
  rejected: 'مرفوض',
}

type BrokerSaleDocumentRow = {
  id: string
  sale_submission_id: string
  name: string | null
  status: string | null
  rejection_reason: string | null
}

export default async function BrokerSalesPage() {
  const session = await requireSession()
  const service = createServiceRoleClient()

  const [{ data: brokerProfile }, { data: sales }, { data: developers }, { data: projects }, { data: rates }, { data: myExceptions }] = await Promise.all([
    service
      .from('broker_profiles')
      .select('id, verification_status, bank_name, bank_account_name, bank_account_number, bank_iban, developer_commission_rate, broker_commission_rate')
      .eq('profile_id', session.user.id)
      .maybeSingle(),
    service
      .from('broker_sales_submissions')
      .select('id, client_name, project_name, developer_name, unit_code, deal_value, broker_commission_amount, broker_commission_rate, stage, status, commission_lifecycle_stage, rejection_reason, broker_payout_due_date, created_at')
      .eq('broker_user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(100),
    service.from('developers').select('id, name, name_ar, region').eq('active', true).order('name'),
    service.from('projects').select('id, name, developer_id').eq('status', 'active').order('name'),
    service.from('commission_rates').select('developer_id, project_id, rate_percentage, agent_share_percentage').order('project_id', { ascending: false }),
    service
      .from('partner_commission_exceptions')
      .select('developer_id, project_id, developer_commission_rate, broker_commission_rate')
      .eq('profile_id', session.user.id),
  ])

  const rows = sales ?? []
  const saleIds = rows.map((row) => row.id)
  const { data: saleDocuments } = saleIds.length
    ? await service
        .from('broker_sale_documents')
        .select('id, sale_submission_id, name, status, rejection_reason')
        .in('sale_submission_id', saleIds)
        .order('created_at', { ascending: true })
    : { data: [] }
  const documentsBySale = ((saleDocuments ?? []) as BrokerSaleDocumentRow[]).reduce<Record<string, BrokerSaleDocumentRow[]>>((acc, document) => {
    acc[document.sale_submission_id] = [...(acc[document.sale_submission_id] ?? []), document]
    return acc
  }, {})

  const isVerified = brokerProfile?.verification_status === 'verified'
  const pending = rows.filter((row) => row.status === 'submitted' || row.status === 'under_review').length
  const approvedAmount = rows
    .filter((row) => row.status === 'approved')
    .reduce((sum, row) => sum + Number(row.broker_commission_amount ?? 0), 0)
  const paidAmount = rows
    .filter((row) => row.commission_lifecycle_stage === 'broker_paid')
    .reduce((sum, row) => sum + Number(row.broker_commission_amount ?? 0), 0)

  return (
    <div className="space-y-6" dir="rtl">
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--fi-emerald)]">BROKER SALES</p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">رفع المبيعات ومتابعة العمولات</h1>
        <p className="mt-1 text-sm text-gray-500">ارفع مبيعاتك بمراحل EOI / Reservation / Contract مع المستندات المطلوبة.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Kpi label="مبيعات قيد المراجعة" value={pending.toLocaleString('ar-EG')} icon={FileUp} />
        <Kpi label="عمولات معتمدة" value={`${money(approvedAmount)} ج.م`} icon={Handshake} />
        <Kpi label="عمولات مصروفة" value={`${money(paidAmount)} ج.م`} icon={Banknote} />
      </section>

      {!isVerified && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
          حسابك لم يتم اعتماده بعد. يمكنك متابعة الملف الشخصي، وسيتم فتح رفع المبيعات بعد موافقة الإدارة.
        </div>
      )}

      <section className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
        <form action={submitBrokerSale} className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900" encType="multipart/form-data">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">بيع جديد</h2>
            <p className="mt-1 text-xs font-semibold text-gray-500">يتم إرسال البيع للـ Account Manager للمراجعة قبل إنشاء العمولة.</p>
          </div>

          <fieldset disabled={!isVerified} className="space-y-4 disabled:opacity-55">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="اسم العميل">
                <input name="clientName" required className="field" />
              </Field>
              <Field label="رقم العميل">
                <input name="clientPhone" className="field text-left" dir="ltr" />
              </Field>

              {/* Developer + Project dependent selects with commission preview */}
              <SaleFormFields
                developers={(developers ?? []) as { id: string; name: string; name_ar: string | null; region: string | null }[]}
                projects={projects ?? []}
                rates={(rates ?? []) as { developer_id: string | null; project_id: string | null; rate_percentage: number; agent_share_percentage: number }[]}
                exception={null}
                allExceptions={(myExceptions ?? []) as { developer_id: string; project_id: string | null; developer_commission_rate: number; broker_commission_rate: number }[]}
              />

              <Field label="كود الوحدة">
                <input name="unitCode" className="field" />
              </Field>
              <Field label="نوع الوحدة">
                <input name="unitType" className="field" />
              </Field>
              <Field label="طريقة الصرف">
                <select name="payoutMethod" className="field">
                  <option value="bank_transfer">تحويل بنكي</option>
                  <option value="cash">كاش</option>
                  <option value="cheque">شيك</option>
                </select>
              </Field>
            </div>

            <textarea name="notes" rows={3} placeholder="ملاحظات إضافية" className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm font-semibold outline-none dark:border-gray-800 dark:bg-gray-950" />
            <BrokerSubmitButton />
          </fieldset>
        </form>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-100 p-5 dark:border-gray-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">سجل المبيعات</h2>
          </div>
          {rows.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-400">
              <Landmark className="mx-auto mb-3 size-10 text-gray-300" />
              لا توجد مبيعات مرفوعة حتى الآن.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.map((sale) => (
                <article key={sale.id} className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700">{stageLabels[sale.stage ?? 'eoi']}</span>
                    <span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-black text-green-700">{lifecycleLabels[sale.commission_lifecycle_stage ?? 'sale_submitted']}</span>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${
                      sale.status === 'approved' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' :
                      sale.status === 'rejected' ? 'border-red-200 bg-red-50 text-red-700' :
                      sale.status === 'under_review' ? 'border-blue-200 bg-blue-50 text-blue-700' :
                      'border-amber-200 bg-amber-50 text-amber-700'
                    }`}>{
                      sale.status === 'approved' ? 'معتمدة' :
                      sale.status === 'rejected' ? 'مرفوضة' :
                      sale.status === 'under_review' ? 'جارٍ المراجعة' :
                      'قيد المراجعة'
                    }</span>
                  </div>
                  <h3 className="mt-3 font-bold text-gray-900 dark:text-white">{sale.project_name}</h3>
                  <div className="mt-2 grid gap-1 text-xs text-gray-500 md:grid-cols-2">
                    <span>العميل: {sale.client_name}</span>
                    <span>الوحدة: {sale.unit_code || 'غير محدد'}</span>
                    <span>قيمة البيع: {money(sale.deal_value)} ج.م</span>
                    <span>نسبة عمولتك: {sale.broker_commission_rate ?? 2}%</span>
                    <span>عمولتك: {money(sale.broker_commission_amount)} ج.م</span>
                    {sale.broker_payout_due_date && <span>موعد الصرف: {sale.broker_payout_due_date}</span>}
                  </div>
                  {sale.rejection_reason && <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs font-bold text-red-700">{sale.rejection_reason}</p>}
                  <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950">
                    <p className="text-xs font-black text-gray-700 dark:text-gray-300">حالة المستندات</p>
                    {(documentsBySale[sale.id] ?? []).length === 0 ? (
                      <p className="mt-2 text-xs font-semibold text-gray-500">لا توجد مستندات مسجلة لهذا البيع.</p>
                    ) : (
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {(documentsBySale[sale.id] ?? []).map((document) => (
                          <div key={document.id} className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-xs font-black text-gray-900 dark:text-white">{document.name ?? 'مستند بيع'}</span>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                                document.status === 'approved'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : document.status === 'rejected'
                                    ? 'bg-red-50 text-red-700'
                                    : 'bg-amber-50 text-amber-700'
                              }`}>
                                {documentStatusLabels[document.status ?? 'pending'] ?? document.status}
                              </span>
                            </div>
                            {document.rejection_reason && (
                              <p className="mt-2 text-xs font-bold text-red-600">{document.rejection_reason}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
      <style>{`
        .field {
          height: 40px;
          width: 100%;
          border-radius: 8px;
          border: 1px solid rgb(229 231 235);
          background: rgb(249 250 251);
          padding: 0 12px;
          font-size: 14px;
          font-weight: 700;
          outline: none;
        }
        .field:focus {
          border-color: #00c27c;
          box-shadow: 0 0 0 3px rgb(0 194 124 / 14%);
        }
      `}</style>
    </div>
  )
}

function Kpi({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <Icon className="size-5 text-[var(--fi-emerald)]" />
      <p className="mt-3 text-xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="mt-1 text-xs font-semibold text-gray-500">{label}</p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-black text-gray-700 dark:text-gray-300">{label}</span>
      {children}
    </label>
  )
}
