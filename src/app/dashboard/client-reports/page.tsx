import { requirePermission } from '@/shared/rbac/require-permission'
import { createRawClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'
import { FileText, Send, Clock, CheckCheck } from 'lucide-react'
import { CreateReportForm, SendReportButton, DeleteReportButton, ReportPreview } from './ClientReportForms'

export const dynamic = 'force-dynamic'

const REPORT_TYPE_LABEL: Record<string, string> = {
  weekly_insight:      'تحليل أسبوعي',
  investment_forecast: 'توقعات استثمارية',
  market_update:       'تحديث السوق',
  custom:              'مخصص',
}

const STATUS_CLS: Record<string, string> = {
  draft:     'bg-slate-100 text-[var(--fi-muted)]',
  scheduled: 'bg-amber-50 text-amber-700',
  sent:      'bg-emerald-50 text-emerald-700',
  opened:    'bg-sky-50 text-sky-700',
  failed:    'bg-red-50 text-red-700',
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'مسودة', scheduled: 'مجدول', sent: 'أُرسل', opened: 'تم الفتح', failed: 'فشل',
}

export default async function ClientReportsPage() {
  await requirePermission('report.view.own')
  const { profile } = await requireSession()
  const supabase = await createRawClient()
  const companyId = profile.company_id ?? profile.id

  const [{ data: reportsRaw }, { data: clientsRaw }] = await Promise.all([
    supabase
      .from('client_reports')
      .select('id, title, report_type, status, delivery_channel, scheduled_for, sent_at, content_html, created_at, client_id')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('clients')
      .select('id, full_name, email')
      .eq('company_id', companyId)
      .limit(100),
  ])

  const reports = reportsRaw ?? []
  const clients = clientsRaw ?? []

  const draftCount     = reports.filter((r) => r.status === 'draft').length
  const scheduledCount = reports.filter((r) => r.status === 'scheduled').length
  const sentCount      = reports.filter((r) => r.status === 'sent' || r.status === 'opened').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-black text-[var(--fi-emerald)]">NEXUS Reports</p>
          <h1 className="mt-1 text-xl sm:text-3xl font-black text-[var(--fi-ink)]">تقارير العملاء</h1>
          <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">
            توليد وجدولة وإرسال تقارير استثمارية مخصصة لكل عميل عبر البريد أو واتساب.
          </p>
        </div>
        <CreateReportForm clients={clients} />
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: <FileText className="size-5" />, value: draftCount,     label: 'مسودة',  color: 'text-[var(--fi-muted)]' },
          { icon: <Clock className="size-5" />,    value: scheduledCount, label: 'مجدول',  color: 'text-[#C9964A]' },
          { icon: <CheckCheck className="size-5" />, value: sentCount,    label: 'أُرسل',  color: 'text-[var(--fi-emerald)]' },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4 shadow-sm">
            <div className={`mb-2 ${k.color}`}>{k.icon}</div>
            <p className="text-2xl font-black text-[var(--fi-ink)]">{k.value}</p>
            <p className="text-xs font-semibold text-[var(--fi-muted)]">{k.label}</p>
          </div>
        ))}
      </div>

      {reports.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--fi-line)] py-16 text-center">
          <Send className="size-10 text-[var(--fi-line)]" />
          <p className="font-bold text-[var(--fi-muted)]">لا توجد تقارير بعد</p>
          <p className="text-xs text-[var(--fi-muted)]">أنشئ أول تقرير لإرساله للعملاء</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="flex items-start gap-3 rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4 shadow-sm">
              <div className="mt-0.5 rounded-lg bg-[var(--fi-emerald)]/10 p-2 text-[var(--fi-emerald)]">
                <FileText className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-black text-[var(--fi-ink)]">{r.title}</p>
                  <span className={`rounded-lg px-2 py-0.5 text-xs font-bold ${STATUS_CLS[r.status] ?? STATUS_CLS.draft}`}>
                    {STATUS_LABEL[r.status] ?? r.status}
                  </span>
                  <span className="text-xs font-semibold text-[var(--fi-muted)]">
                    {REPORT_TYPE_LABEL[r.report_type] ?? r.report_type}
                  </span>
                  <span className="text-xs font-semibold text-[var(--fi-muted)]">
                    {r.delivery_channel === 'email' ? '📧' : r.delivery_channel === 'whatsapp' ? '💬' : '📧💬'}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-3 text-xs font-semibold text-[var(--fi-muted)]">
                  <span>{new Date(r.created_at).toLocaleDateString('ar-EG')}</span>
                  {r.scheduled_for && (
                    <span>مجدول: {new Date(r.scheduled_for).toLocaleString('ar-EG')}</span>
                  )}
                  {r.sent_at && (
                    <span className="text-[var(--fi-emerald)]">أُرسل: {new Date(r.sent_at).toLocaleString('ar-EG')}</span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {r.content_html && <ReportPreview content={r.content_html} />}
                {r.status === 'draft' && <SendReportButton reportId={r.id} />}
                <DeleteReportButton reportId={r.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
