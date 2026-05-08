import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, Briefcase, Mic2, PhoneCall, TrendingUp, User, Phone, Globe, MapPin, BadgeCheck } from 'lucide-react'
import { getClientDetail } from '@/domains/clients/queries'
import { getI18n } from '@/lib/i18n'
import { WhatsAppButton } from '@/components/whatsapp/whatsapp-button'
import type { ClientCallSummary } from '@/domains/clients/types'

interface PageProps {
  params: Promise<{ id: string }>
}

function getClientName(client: { name: string | null; full_name: string | null }) {
  return client.full_name || client.name || 'عميل'
}

function getDealValue(deal: { final_price: number | null; unit_value: number | null; amount: number | null; value: number | null }) {
  return Number(deal.final_price ?? deal.unit_value ?? deal.amount ?? deal.value ?? 0)
}

function normalizePhone(phone: string | null) {
  if (!phone) return ''
  return phone.replace(/[^\d]/g, '')
}

function formatMoney(n: number) {
  return n.toLocaleString('ar-EG') + ' EGP'
}

function InfoItem({ label, value, dir: d }: { label: string; value: string | null | undefined; dir?: 'rtl' | 'ltr' }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--fi-muted)]">{label}</span>
      <span className="text-sm font-bold text-[var(--fi-ink)]" dir={d}>{value || '—'}</span>
    </div>
  )
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--fi-line)] bg-white shadow-sm dark:bg-gray-900">
      <div className="flex items-center gap-2.5 border-b border-[var(--fi-line)] px-5 py-4">
        <span className="flex size-7 items-center justify-center rounded-lg bg-[var(--fi-emerald)]/10">
          <Icon className="size-4 text-[var(--fi-emerald)]" />
        </span>
        <h2 className="text-sm font-black text-[var(--fi-ink)]">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

export default async function ClientProfilePage({ params }: PageProps) {
  const { id } = await params
  const [{ client, deals, calls, error }, { t, numLocale }] = await Promise.all([
    getClientDetail(id),
    getI18n(),
  ])

  const PAYMENT_LABELS: Record<string, string> = {
    downpayment: t('مقدم (كاش)', 'Down Payment (Cash)'),
    installments: t('أقساط', 'Installments'),
  }

  if (!client && !error) notFound()

  if (error || !client) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 sm:p-8" dir="rtl">
        <div className="rounded-2xl border border-red-100 bg-white p-4 sm:p-8 text-center shadow-sm">
          <p className="font-black text-red-700">{t('تعذر تحميل ملف العميل', 'Failed to load client profile')}</p>
          <p className="mt-2 text-sm text-red-600">{error ?? t('العميل غير موجود', 'Client not found')}</p>
          <Link href="/dashboard/clients" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">
            <ArrowRight size={16} /> {t('العودة للعملاء', 'Back to Clients')}
          </Link>
        </div>
      </div>
    )
  }

  const name = getClientName(client)
  const phone = client.phone ?? ''
  const whatsappPhone = normalizePhone(phone)
  const totalInvestment = deals.reduce((sum, deal) => sum + getDealValue(deal), 0)
  const completedDeals = deals.filter((d) => ['Handover', 'Registration', 'Contracted', 'closed', 'won'].includes(d.stage ?? d.status ?? '')).length
  const clientCode = `#${client.id.substring(0, 6).toUpperCase()}`
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen space-y-5 p-4 sm:p-6" dir="rtl">

      <Link href="/dashboard/clients" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--fi-emerald)]">
        <ArrowRight size={15} />
        {t('العودة لدليل العملاء', 'Back to Clients')}
      </Link>

      {/* Profile header */}
      <div className="rounded-2xl border border-[var(--fi-line)] bg-white p-5 shadow-sm dark:bg-gray-900">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl text-xl font-black text-white shadow-lg"
              style={{ background: 'linear-gradient(135deg, var(--fi-emerald), #0081cc)' }}>
              {initials}
            </div>
            <div>
              <h1 className="text-xl font-black text-[var(--fi-ink)]">{name}</h1>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs font-bold text-[var(--fi-muted)]">
                <span className="flex items-center gap-1 rounded-md bg-[var(--fi-soft)] px-2 py-1">
                  <BadgeCheck className="size-3.5 text-[var(--fi-emerald)]" />
                  {clientCode}
                </span>
                {client.client_type && <span>{client.client_type === 'Buyer' ? t('مشتري', 'Buyer') : t('مستثمر', 'Investor')}</span>}
                {client.nationality && <span className="flex items-center gap-1"><Globe className="size-3.5" />{client.nationality}</span>}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {whatsappPhone && (
              <WhatsAppButton phone={whatsappPhone} clientName={name} context="follow_up" />
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: t('إجمالي الصفقات', 'Total Deals'), value: deals.length.toString() },
            { label: t('قيمة الاستثمارات', 'Investment Value'), value: totalInvestment > 0 ? formatMoney(totalInvestment) : '—' },
            { label: t('صفقات مكتملة', 'Completed Deals'), value: completedDeals.toString() },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-[var(--fi-line)] bg-[var(--fi-soft)] p-4 text-center">
              <p className="text-lg font-black text-[var(--fi-emerald)]">{value}</p>
              <p className="mt-0.5 text-xs font-bold text-[var(--fi-muted)]">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">

        <SectionCard title={t('بيانات التواصل', 'Contact Details')} icon={Phone}>
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
            <InfoItem label={t('رقم الهاتف الرئيسي', 'Primary Phone')} value={client.phone_country_code ? `${client.phone_country_code} ${phone}` : phone} dir="ltr" />
            <InfoItem label={t('رقم الهاتف الثاني', 'Secondary Phone')} value={client.secondary_phone ? `${client.secondary_phone_country_code ?? ''} ${client.secondary_phone}`.trim() : null} dir="ltr" />
            <InfoItem label={t('البريد الإلكتروني', 'Email')} value={client.email} dir="ltr" />
            <InfoItem label={t('الرقم القومي', 'National ID')} value={client.national_id} />
          </div>
        </SectionCard>

        <SectionCard title={t('البيانات الشخصية', 'Personal Info')} icon={User}>
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
            <InfoItem label={t('الجنسية', 'Nationality')} value={client.nationality} />
            <InfoItem label={t('مكان الإقامة', 'Residence')} value={client.residence_country} />
            <InfoItem label={t('العنوان', 'Address')} value={client.address} />
            <InfoItem label={t('مصدر العميل', 'Source')} value={client.source} />
          </div>
        </SectionCard>

        <SectionCard title={t('ملف الاستثمار', 'Investment Profile')} icon={TrendingUp}>
          <div className="space-y-4">
            {client.investment_types?.length ? (
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[var(--fi-muted)]">{t('نوع الاستثمار', 'Investment Type')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {client.investment_types.map((inv) => (
                    <span key={inv} className="rounded-lg bg-[var(--fi-emerald)]/10 px-2.5 py-1 text-xs font-bold text-[var(--fi-emerald)]">{inv}</span>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
              <InfoItem label={t('قيمة الاستثمار', 'Investment Budget')} value={client.investment_budget ? formatMoney(client.investment_budget) : null} />
              <InfoItem label={t('طريقة الدفع', 'Payment Method')} value={PAYMENT_LABELS[client.payment_method ?? ''] ?? client.payment_method} />
            </div>
            {client.investment_locations?.length ? (
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[var(--fi-muted)]">{t('مناطق الاستثمار المفضلة', 'Preferred Investment Areas')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {client.investment_locations.map((l) => (
                    <span key={l} className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-[var(--fi-muted)]">
                      <MapPin className="size-3" />{l}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard title={`${t('سجل الصفقات', 'Deal History')} (${deals.length})`} icon={Briefcase}>
          {deals.length === 0 ? (
            <p className="py-6 text-center text-sm font-bold text-[var(--fi-muted)]">{t('لم يقم هذا العميل بأي صفقات حتى الآن.', 'This client has no deals yet.')}</p>
          ) : (
            <div className="space-y-3">
              {deals.map((deal) => {
                const value = getDealValue(deal)
                return (
                  <div key={deal.id} className="rounded-xl border border-[var(--fi-line)] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-black text-[var(--fi-ink)]">{deal.title ?? t('صفقة', 'Deal')}</p>
                        <p className="mt-0.5 text-xs text-[var(--fi-muted)]">
                          {deal.developer_name ?? '—'} · {deal.property_type ?? '—'}
                        </p>
                      </div>
                      <div className="text-left shrink-0">
                        {value > 0 && <p className="text-sm font-black text-[var(--fi-ink)]">{formatMoney(value)}</p>}
                        <span className="rounded-full bg-[var(--fi-soft)] px-2 py-0.5 text-[10px] font-black text-[var(--fi-muted)]">
                          {deal.stage ?? deal.status ?? '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </SectionCard>

      </div>

      <SectionCard title={`${t('سجل المكالمات', 'Call History')} (${calls.length})`} icon={PhoneCall}>
        {calls.length === 0 ? (
          <p className="py-6 text-center text-sm font-bold text-[var(--fi-muted)]">
            {t('لا توجد مكالمات مسجلة لهذا العميل حتى الآن.', 'No calls recorded for this client yet.')}
          </p>
        ) : (
          <div className="space-y-3">
            {calls.map((call) => <CallCard key={call.id} call={call} t={t} />)}
          </div>
        )}
      </SectionCard>

    </div>
  )
}

function CallCard({ call, t }: { call: ClientCallSummary; t: (ar: string, en: string) => string }) {
  const STATUS_CLS: Record<string, string> = {
    completed:   'bg-emerald-50 text-emerald-700',
    in_progress: 'bg-blue-50 text-blue-700',
    ringing:     'bg-blue-50 text-blue-700',
    queued:      'bg-amber-50 text-amber-700',
    failed:      'bg-red-50 text-red-600',
    no_answer:   'bg-red-50 text-red-600',
    busy:        'bg-red-50 text-red-600',
  }
  const STATUS_LABELS: Record<string, string> = {
    completed:   t('مكتملة', 'Completed'),
    in_progress: t('جارية', 'In Progress'),
    ringing:     t('يرن', 'Ringing'),
    queued:      t('في الانتظار', 'Queued'),
    failed:      t('فشلت', 'Failed'),
    no_answer:   t('لم يتم الرد', 'No Answer'),
    busy:        t('مشغول', 'Busy'),
  }
  const DIR_LABELS: Record<string, string> = {
    agent_to_client:      t('من الوكيل', 'Agent to Client'),
    developer_to_client:  t('من المطور', 'Developer to Client'),
    client_to_agent:      t('من العميل', 'Client to Agent'),
    client_to_developer:  t('من العميل للمطور', 'Client to Developer'),
  }

  const duration = call.duration_seconds
    ? `${Math.floor(call.duration_seconds / 60)}m ${call.duration_seconds % 60}s`
    : t('لم تبدأ', 'Not started')

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--fi-line)] p-3">
      <div className="flex items-center gap-3">
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${STATUS_CLS[call.status] ?? 'bg-slate-100 text-slate-500'}`}>
          {STATUS_LABELS[call.status] ?? call.status}
        </span>
        <div className="text-xs font-bold text-[var(--fi-muted)]">
          {DIR_LABELS[call.direction] ?? call.direction} · {duration}
        </div>
      </div>
      {call.recording_url ? (
        <a href={call.recording_url} target="_blank" rel="noreferrer"
          className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-black text-white">
          <Mic2 size={13} /> {t('تسجيل', 'Recording')}
        </a>
      ) : (
        <span className="text-xs font-bold text-[var(--fi-muted)]">{t('لا يوجد تسجيل', 'No recording')}</span>
      )}
    </div>
  )
}
