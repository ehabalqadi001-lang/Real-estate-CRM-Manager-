import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, Mic2, Pencil, PhoneCall, UserRound } from 'lucide-react'
import { getClientDetail } from '@/domains/clients/queries'
import { WhatsAppButton } from '@/components/whatsapp/whatsapp-button'
import type { ClientCallSummary } from '@/domains/clients/types'

interface PageProps {
  params: Promise<{ id: string }>
}

const CSS_STYLES = `
  .profile-header { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 30px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; }
  .client-avatar { width: 80px; height: 80px; background: #EFF6FF; color: #185FA5; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 800; flex-shrink: 0; }
  .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 20px; }
  .info-item { display: flex; flex-direction: column; gap: 4px; }
  .info-label { font-size: 12px; color: #64748b; font-weight: 600; }
  .info-value { font-size: 15px; color: #0f172a; font-weight: 700; }
  .stats-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; margin-bottom: 24px; }
  .stat-card { background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center; }
  .stat-num { font-size: 24px; font-weight: 800; color: #185FA5; }
  .stat-label { font-size: 13px; color: #64748b; font-weight: 600; }
  .section-title { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
  .deal-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 15px; transition: 0.2s; border-right: 5px solid #185FA5; }
  .call-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 12px; border-right: 5px solid #27AE60; }
  .call-status { border-radius: 999px; padding: 6px 12px; font-size: 12px; font-weight: 900; white-space: nowrap; }
  .call-status.completed { background: #dcfce7; color: #166534; }
  .call-status.in_progress, .call-status.ringing { background: #dbeafe; color: #1d4ed8; }
  .call-status.queued { background: #fef9c3; color: #854d0e; }
  .call-status.failed, .call-status.no_answer, .call-status.busy { background: #fee2e2; color: #991b1b; }
  .btn-wa { background: #25D366; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; display: flex; align-items: center; gap: 8px; }
  .btn-edit { background: #fff; border: 1px solid #cbd5e1; color: #0f172a; padding: 10px 20px; border-radius: 8px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
  @media (max-width: 768px) {
    .profile-header { flex-direction: column; padding: 20px; }
    .stats-row { grid-template-columns: 1fr; }
  }
`

function getClientName(client: { name: string | null; full_name: string | null }) {
  return client.full_name || client.name || 'عميل'
}

function getDealValue(deal: { final_price: number | null; unit_value: number | null; amount: number | null; value: number | null }) {
  return Number(deal.final_price ?? deal.unit_value ?? deal.amount ?? deal.value ?? 0)
}

function normalizeWhatsAppPhone(phone: string | null) {
  if (!phone) return ''
  return phone.replace(/[^\d]/g, '')
}

export default async function ClientProfilePage({ params }: PageProps) {
  const { id } = await params
  const { client, deals, calls, error } = await getClientDetail(id)

  if (!client && !error) notFound()

  if (error || !client) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 text-center" dir="rtl">
        <div className="mx-auto max-w-xl rounded-2xl border border-red-100 bg-white p-8 text-red-700 shadow-sm">
          <p className="font-black">تعذر تحميل ملف العميل</p>
          <p className="mt-2 text-sm">{error ?? 'العميل غير موجود'}</p>
          <Link href="/dashboard/clients" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">
            <ArrowRight size={16} /> العودة للعملاء
          </Link>
        </div>
      </div>
    )
  }

  const name = getClientName(client)
  const phone = client.phone ?? ''
  const whatsappPhone = normalizeWhatsAppPhone(phone)
  const totalInvestment = deals.reduce((sum, deal) => sum + getDealValue(deal), 0)
  const completedDeals = deals.filter((deal) => ['Handover', 'Registration', 'Contracted', 'closed', 'won'].includes(deal.stage ?? deal.status ?? '')).length

  return (
    <div className="dashboard-container min-h-screen bg-slate-50 p-8" dir="rtl">
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />

      <div className="mb-5">
        <Link href="/dashboard/clients" className="inline-flex items-center gap-2 text-sm font-bold text-[#185FA5]">
          <ArrowRight size={16} /> العودة لدليل العملاء
        </Link>
      </div>

      <div className="profile-header">
        <div className="flex flex-col gap-5 sm:flex-row">
          <div className="client-avatar">{name.charAt(0)}</div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">{name}</h1>
            <div className="mt-1 text-sm font-bold text-slate-500">
              {client.client_type === 'Buyer' ? 'مشتري' : 'مستثمر'} · كود العميل: #{client.id.substring(0, 6)}
            </div>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">رقم الهاتف</span>
                <span className="info-value" dir="ltr">{phone || 'غير مسجل'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">الرقم القومي</span>
                <span className="info-value">{client.national_id || 'غير مسجل'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">مصدر العميل</span>
                <span className="info-value">{client.source || 'غير محدد'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">العنوان</span>
                <span className="info-value">{client.address || 'غير محدد'}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {whatsappPhone && (
            <WhatsAppButton phone={whatsappPhone} clientName={name} context="follow_up" />
          )}
          <button type="button" className="btn-edit">
            <Pencil size={16} /> تعديل البيانات
          </button>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-num">{deals.length}</div>
          <div className="stat-label">إجمالي الصفقات</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{totalInvestment.toLocaleString('ar-EG')} EGP</div>
          <div className="stat-label">قيمة الاستثمارات</div>
        </div>
        <div className="stat-card">
          <div className="stat-num text-emerald-600">{completedDeals}</div>
          <div className="stat-label">صفقات مكتملة</div>
        </div>
      </div>

      <div className="section-title">
        <UserRound size={20} />
        سجل الصفقات والمشتريات
      </div>

      {deals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          لم يقم هذا العميل بأي عمليات شراء حتى الآن.
        </div>
      ) : (
        deals.map((deal) => {
          const value = getDealValue(deal)
          const developerName = deal.developer_name ?? deal.developer ?? 'غير محدد'
          return (
            <div key={deal.id} className="deal-card">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <div className="text-base font-black text-[#185FA5]">{deal.title ?? deal.compound ?? 'صفقة'}</div>
                  <div className="mt-1 text-sm text-slate-500">
                    المطور: {developerName} · نوع الوحدة: {deal.property_type ?? 'غير محدد'}
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-lg font-black text-slate-900">{value.toLocaleString('ar-EG')} EGP</div>
                  <div className="inline-block rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{deal.stage ?? deal.status ?? 'غير محدد'}</div>
                </div>
              </div>
            </div>
          )
        })
      )}

      <div className="section-title mt-8">
        <PhoneCall size={20} />
        سجل المكالمات المموهة
      </div>

      {calls.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          لا توجد مكالمات مسجلة لهذا العميل حتى الآن. ستظهر هنا حالة المكالمة ورابط التسجيل بعد تفعيل Twilio وإجراء مكالمة فعلية.
        </div>
      ) : (
        calls.map((call) => <CallHistoryCard key={call.id} call={call} />)
      )}
    </div>
  )
}

function CallHistoryCard({ call }: { call: ClientCallSummary }) {
  return (
    <div className="call-card">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`call-status ${call.status}`}>{labelCallStatus(call.status)}</span>
            <span className="text-xs font-bold text-slate-500">{labelCallDirection(call.direction)}</span>
          </div>
          <div className="mt-3 grid gap-2 text-sm font-bold text-slate-600 sm:grid-cols-2">
            <span>بدأت: {formatDateTime(call.started_at ?? call.created_at)}</span>
            <span>المدة: {formatDuration(call.duration_seconds)}</span>
            <span>حالة التسجيل: {labelRecordingStatus(call.recording_status)}</span>
            <span dir="ltr">SID: {call.provider_call_sid ?? 'غير متاح'}</span>
          </div>
        </div>
        {call.recording_url ? (
          <a
            href={call.recording_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white"
          >
            <Mic2 size={16} />
            فتح التسجيل
          </a>
        ) : (
          <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-500">لا يوجد تسجيل بعد</span>
        )}
      </div>
    </div>
  )
}

function labelCallStatus(status: string) {
  const labels: Record<string, string> = {
    queued: 'في الانتظار',
    ringing: 'يرن',
    in_progress: 'جارية',
    completed: 'مكتملة',
    failed: 'فشلت',
    no_answer: 'لم يتم الرد',
    busy: 'مشغول',
  }
  return labels[status] ?? status
}

function labelCallDirection(direction: string) {
  const labels: Record<string, string> = {
    agent_to_client: 'من الوكيل إلى العميل',
    developer_to_client: 'من المطور إلى العميل',
    client_to_agent: 'من العميل إلى الوكيل',
    client_to_developer: 'من العميل إلى المطور',
  }
  return labels[direction] ?? direction
}

function labelRecordingStatus(status: string | null) {
  const labels: Record<string, string> = {
    none: 'لا يوجد',
    processing: 'قيد المعالجة',
    available: 'متاح',
    failed: 'فشل التسجيل',
  }
  return labels[status ?? 'none'] ?? 'لا يوجد'
}

function formatDateTime(value: string | null) {
  if (!value) return 'غير محدد'
  return new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatDuration(seconds: number | null) {
  const total = Number(seconds ?? 0)
  if (!total) return 'لم تبدأ'
  const minutes = Math.floor(total / 60)
  const remainingSeconds = total % 60
  return `${minutes}د ${remainingSeconds}ث`
}
