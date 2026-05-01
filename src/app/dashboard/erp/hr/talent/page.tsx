import { redirect } from 'next/navigation'
import { UserSearch, Users, Clock, CheckCircle2, FileText } from 'lucide-react'
import { createRawClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'
import type { AppRole } from '@/shared/auth/types'
import { nullableUuid } from '@/lib/uuid'
import { BentoGrid, BentoKpiCard } from '@/components/dashboard/BentoDashboardLayout'
import { AnimatedCount } from '@/components/design-system/animated-count'
import { AddCandidateForm } from './AddCandidateForm'
import { AdvancePipelineButton, GenerateOfferButton } from './TalentActions'

export const dynamic = 'force-dynamic'

const HR_ROLES: AppRole[] = ['super_admin', 'platform_admin', 'hr_manager', 'hr_staff', 'hr_officer', 'finance_manager']
const HR_WRITE_ROLES: AppRole[] = ['super_admin', 'platform_admin', 'hr_manager', 'hr_staff', 'hr_officer']

type Candidate = {
  id: string
  full_name: string
  phone: string | null
  email: string | null
  applied_role: string
  current_company: string | null
  experience_years: number | null
  expected_salary: number | null
  source_channel: string
  pipeline_stage: string
  status: string
  notes: string | null
  created_at: string
}

const stageLabel: Record<string, string> = {
  new: 'جديد',
  screening: 'فرز أولي',
  interview_1: 'مقابلة 1',
  interview_2: 'مقابلة 2',
  offer_sent: 'عرض مُرسَل',
  hired: 'تم التعيين',
  rejected: 'مرفوض',
}

const stageBadge: Record<string, string> = {
  new: 'bg-slate-100 text-slate-600',
  screening: 'bg-blue-50 text-blue-700',
  interview_1: 'bg-amber-50 text-amber-700',
  interview_2: 'bg-orange-50 text-orange-700',
  offer_sent: 'bg-violet-50 text-violet-700',
  hired: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
}

const sourceLabel: Record<string, string> = {
  manual: 'يدوي',
  linkedin: 'LinkedIn',
  referral: 'ترشيح',
  website: 'موقع',
  agency: 'وكالة',
  walk_in: 'حضور مباشر',
}

const formatter = new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 })

// Pipeline funnel stages ordered
const funnelStages = ['new', 'screening', 'interview_1', 'interview_2', 'offer_sent', 'hired']

export default async function TalentPage() {
  const session = await requireSession()
  const { profile } = session
  if (!HR_ROLES.includes(profile.role)) redirect('/dashboard')

  const supabase = await createRawClient()
  const companyId = nullableUuid(profile.company_id) ?? nullableUuid(profile.tenant_id)

  let candidatesQuery = supabase
    .from('talent_candidates')
    .select('id, full_name, phone, email, applied_role, current_company, experience_years, expected_salary, source_channel, pipeline_stage, status, notes, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  if (companyId) candidatesQuery = candidatesQuery.eq('company_id', companyId)

  let offersQuery = supabase
    .from('offer_letters')
    .select('id, offer_ref, candidate_name, applied_role, offered_salary, offer_date, status')
    .order('created_at', { ascending: false })
    .limit(50)

  if (companyId) offersQuery = offersQuery.eq('company_id', companyId)

  const [candidatesResult, offersResult] = await Promise.all([candidatesQuery, offersQuery])

  const candidates = (candidatesResult.data ?? []) as Candidate[]
  const offers = (offersResult.data ?? []) as Array<{ id: string; offer_ref: string; candidate_name: string; applied_role: string; offered_salary: number | null; offer_date: string; status: string }>

  const canWrite = HR_WRITE_ROLES.includes(profile.role)
  const activeCandidates = candidates.filter((c) => c.status === 'active')
  const hiredCount = candidates.filter((c) => c.pipeline_stage === 'hired').length
  const inInterviewCount = candidates.filter((c) => ['interview_1', 'interview_2'].includes(c.pipeline_stage)).length
  const offersCount = candidates.filter((c) => c.pipeline_stage === 'offer_sent').length

  // Funnel data
  const funnelData = funnelStages.map((stage) => ({
    stage,
    label: stageLabel[stage],
    count: candidates.filter((c) => c.pipeline_stage === stage).length,
  }))
  const maxCount = Math.max(...funnelData.map((f) => f.count), 1)

  return (
    <main className="space-y-6 p-4 sm:p-6" dir="rtl">
      <section className="ds-card p-5">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--fi-emerald)]">TALENT ACQUISITION HUNTER</p>
        <h1 className="mt-2 text-2xl font-black text-[var(--fi-ink)] sm:text-3xl">استقطاب المواهب</h1>
        <p className="mt-2 text-sm font-semibold leading-7 text-[var(--fi-muted)]">
          مجمع المواهب — قمع التوظيف — خطاب عرض تلقائي. مخصص للقطاع العقاري.
        </p>
      </section>

      <BentoGrid>
        <BentoKpiCard title="المرشحون النشطون" value={<AnimatedCount value={activeCandidates.length} />} hint="في القمع" icon={<Users className="size-5" />} />
        <BentoKpiCard title="في مرحلة المقابلات" value={<AnimatedCount value={inInterviewCount} />} hint="مقابلة 1 و 2" icon={<Clock className="size-5" />} />
        <BentoKpiCard title="عروض مرسلة" value={<AnimatedCount value={offersCount} />} hint="قيد الانتظار" icon={<FileText className="size-5" />} />
        <BentoKpiCard title="تم التعيين" value={<AnimatedCount value={hiredCount} />} hint="هذا الدفتر" icon={<CheckCircle2 className="size-5" />} />
      </BentoGrid>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
        {canWrite ? <AddCandidateForm /> : (
          <section className="ds-card p-5">
            <h2 className="text-xl font-black text-[var(--fi-ink)]">إضافة مرشح</h2>
            <p className="mt-2 text-sm font-semibold text-[var(--fi-muted)]">متاح لفريق الموارد البشرية فقط.</p>
          </section>
        )}

        <section className="ds-card p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--fi-emerald)]">HIRING FUNNEL</p>
          <h2 className="mt-1 text-lg font-black text-[var(--fi-ink)]">قمع التوظيف</h2>
          <div className="mt-4 space-y-2">
            {funnelData.map((item) => (
              <div key={item.stage} className="flex items-center gap-3">
                <span className="w-24 text-right text-xs font-bold text-[var(--fi-muted)] shrink-0">{item.label}</span>
                <div className="flex-1 overflow-hidden rounded-full bg-[var(--fi-soft)]">
                  <div
                    className="h-2 rounded-full bg-[var(--fi-emerald)] transition-all duration-500"
                    style={{ width: `${(item.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-left text-xs font-black text-[var(--fi-ink)]">{item.count}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {offers.length > 0 && (
        <section className="ds-card overflow-hidden">
          <div className="border-b border-[var(--fi-line)] p-5">
            <h2 className="text-xl font-black text-[var(--fi-ink)]">خطابات العروض الصادرة</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="bg-[var(--fi-soft)] text-xs font-black text-[var(--fi-muted)]">
                  <th className="px-4 py-3 text-right">رقم الخطاب</th>
                  <th className="px-4 py-3 text-right">المرشح</th>
                  <th className="px-4 py-3 text-right">المنصب</th>
                  <th className="px-4 py-3 text-right">الراتب المعروض</th>
                  <th className="px-4 py-3 text-right">التاريخ</th>
                  <th className="px-4 py-3 text-right">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--fi-line)]">
                {offers.map((offer) => (
                  <tr key={offer.id} className="transition hover:bg-[var(--fi-soft)]/60">
                    <td className="px-4 py-3 font-black text-[var(--fi-ink)]">{offer.offer_ref}</td>
                    <td className="px-4 py-3 font-bold text-[var(--fi-ink)]">{offer.candidate_name}</td>
                    <td className="px-4 py-3 font-bold text-[var(--fi-muted)]">{offer.applied_role}</td>
                    <td className="px-4 py-3 font-black text-emerald-600">{offer.offered_salary ? `${formatter.format(offer.offered_salary)} ج.م` : '—'}</td>
                    <td className="px-4 py-3 font-bold text-[var(--fi-muted)]">{offer.offer_date}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${offer.status === 'accepted' ? 'bg-emerald-50 text-emerald-700' : offer.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                        {offer.status === 'accepted' ? 'مقبول' : offer.status === 'rejected' ? 'مرفوض' : 'مسودة'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="ds-card overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-[var(--fi-line)] p-5 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-black text-[var(--fi-ink)]">مجمع المواهب</h2>
          <span className="text-sm font-bold text-[var(--fi-muted)]">{candidates.length} مرشح</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="bg-[var(--fi-soft)] text-xs font-black text-[var(--fi-muted)]">
                <th className="px-4 py-3 text-right">المرشح</th>
                <th className="px-4 py-3 text-right">المنصب المطلوب</th>
                <th className="px-4 py-3 text-right">الخبرة</th>
                <th className="px-4 py-3 text-right">الراتب المتوقع</th>
                <th className="px-4 py-3 text-right">المصدر</th>
                <th className="px-4 py-3 text-right">المرحلة</th>
                {canWrite && <th className="px-4 py-3 text-right">الإجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--fi-line)]">
              {candidates.map((candidate) => (
                <tr key={candidate.id} className="transition hover:bg-[var(--fi-soft)]/60">
                  <td className="px-4 py-3">
                    <p className="font-black text-[var(--fi-ink)]">{candidate.full_name}</p>
                    <p className="mt-0.5 text-xs text-[var(--fi-muted)]">{candidate.phone ?? candidate.email ?? '—'}</p>
                    {candidate.current_company && <p className="mt-0.5 text-xs text-[var(--fi-muted)]">{candidate.current_company}</p>}
                  </td>
                  <td className="px-4 py-3 font-bold text-[var(--fi-ink)]">{candidate.applied_role}</td>
                  <td className="px-4 py-3 font-bold text-[var(--fi-muted)]">
                    {candidate.experience_years != null ? `${candidate.experience_years} سنة` : '—'}
                  </td>
                  <td className="px-4 py-3 font-black text-[var(--fi-ink)]">
                    {candidate.expected_salary ? `${formatter.format(candidate.expected_salary)} ج.م` : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-[var(--fi-muted)]">
                    {sourceLabel[candidate.source_channel] ?? candidate.source_channel}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${stageBadge[candidate.pipeline_stage] ?? 'bg-slate-100 text-slate-600'}`}>
                      {stageLabel[candidate.pipeline_stage] ?? candidate.pipeline_stage}
                    </span>
                  </td>
                  {canWrite && (
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <AdvancePipelineButton candidateId={candidate.id} currentStage={candidate.pipeline_stage} />
                        {candidate.pipeline_stage === 'interview_2' && (
                          <GenerateOfferButton candidateId={candidate.id} />
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {!candidates.length && (
                <tr>
                  <td colSpan={canWrite ? 7 : 6} className="px-4 py-12 text-center text-sm font-bold text-[var(--fi-muted)]">
                    مجمع المواهب فارغ. أضف أول مرشح من النموذج أعلاه.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
