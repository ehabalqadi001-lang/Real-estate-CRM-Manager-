import {
  Shield, CheckCircle, XCircle, Clock,
  Phone, Mail, MessageSquare, FileText,
  Headphones,
} from 'lucide-react'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requireSession } from '@/shared/auth/session'
import { BrokerProfileForm } from './BrokerProfileForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'ملفي الشخصي | FAST INVESTMENT' }

const VERIFICATION_STATUS: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending:      { label: 'في انتظار المراجعة', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200', icon: Clock },
  under_review: { label: 'قيد المراجعة',       color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',   icon: Clock },
  verified:     { label: 'موثّق ومعتمد ✓',     color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle },
  rejected:     { label: 'مرفوض',              color: 'text-red-700',    bg: 'bg-red-50 border-red-200',     icon: XCircle },
  suspended:    { label: 'موقوف',              color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: XCircle },
}

export default async function BrokerProfilePage() {
  const session = await requireSession()
  const service = createServiceRoleClient()

  const [{ data: brokerProfile }, { data: userProfileData }] = await Promise.all([
    service
      .from('broker_profiles')
      .select('*, broker_documents(id, type, name, status, created_at)')
      .eq('profile_id', session.user.id)
      .maybeSingle(),
    service
      .from('user_profiles')
      .select('account_manager_id')
      .eq('id', session.user.id)
      .maybeSingle(),
  ])

  let accountManager: { full_name: string | null; email: string | null; phone?: string | null } | null = null
  const amId = userProfileData?.account_manager_id
    ?? (await service.from('partner_applications').select('assigned_account_manager_id').eq('profile_id', session.user.id).order('created_at', { ascending: false }).limit(1).maybeSingle()).data?.assigned_account_manager_id

  if (amId) {
    const { data: am } = await service
      .from('profiles')
      .select('full_name, email')
      .eq('id', amId)
      .maybeSingle()
    accountManager = am ?? null
  }

  const status = brokerProfile?.verification_status ?? 'pending'
  const statusCfg = VERIFICATION_STATUS[status] ?? VERIFICATION_STATUS.pending
  const StatusIcon = statusCfg.icon

  const completionItems = [
    { label: 'الاسم الكامل',         done: !!session.profile.full_name },
    { label: 'رقم الهاتف',           done: true },
    { label: 'صورة شخصية',           done: !!brokerProfile?.photo_url },
    { label: 'رقم البطاقة الوطنية',  done: !!brokerProfile?.national_id },
    { label: 'صورة البطاقة',         done: !!brokerProfile?.national_id_url },
    { label: 'الكارت الضريبي',       done: !!brokerProfile?.tax_card_url },
    { label: 'بيانات الحساب البنكي', done: !!brokerProfile?.bank_account_number },
  ]
  const completionPct = Math.round((completionItems.filter(i => i.done).length / completionItems.length) * 100)
  const initials = session.profile.full_name?.split(' ').map(w => w[0]).slice(0, 2).join('') || 'و'

  return (
    <div className="space-y-5 max-w-2xl" dir="rtl">

      {/* ── Header ── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold text-xl select-none overflow-hidden">
              {brokerProfile?.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brokerProfile.photo_url} alt="صورة شخصية" className="w-full h-full object-cover" />
              ) : initials}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">{session.profile.full_name ?? '—'}</h1>
            <p className="text-sm text-gray-500 truncate">{session.profile.email ?? '—'}</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${statusCfg.bg} ${statusCfg.color}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {statusCfg.label}
          </div>
        </div>
        {brokerProfile?.rejection_reason && (
          <p className="mt-3 text-xs font-semibold text-red-600 bg-red-50 rounded-lg px-3 py-2">{brokerProfile.rejection_reason}</p>
        )}
      </div>

      {/* ── Completion ── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500" />
            اكتمال الملف الشخصي
          </span>
          <span className="text-2xl font-black text-emerald-600">{completionPct}%</span>
        </div>
        <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-4">
          {/* eslint-disable-next-line no-inline-styles/no-inline-styles */}
          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
        </div>
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-y-2 gap-x-4">
          {completionItems.map(({ label, done }) => (
            <div key={label} className="flex items-center gap-2 text-sm">
              {done
                ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                : <XCircle className="w-3.5 h-3.5 text-gray-300 shrink-0" />}
              <span className={done ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}>
                {label}
              </span>
              {!done && <span className="text-[10px] font-black text-amber-600">مطلوب</span>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Edit Form ── */}
      <BrokerProfileForm uid={session.user.id} brokerProfile={brokerProfile} />

      {/* ── Account Manager Card ── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
        <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <Headphones className="w-4 h-4 text-emerald-500" />
          Account Manager المسؤول عنك
        </h2>
        {accountManager ? (
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-lg shrink-0">
              {accountManager.full_name?.charAt(0) ?? 'م'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 dark:text-white">{accountManager.full_name ?? '—'}</p>
              <div className="mt-2 space-y-1.5">
                {accountManager.email && (
                  <a
                    href={`mailto:${accountManager.email}`}
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    {accountManager.email}
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <Headphones className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">لم يتم تعيين Account Manager بعد</p>
            <p className="text-xs text-gray-400 mt-1">سيتم التواصل معك بعد مراجعة طلبك</p>
          </div>
        )}
      </div>

      {/* ── Contact Us ── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
        <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <MessageSquare className="w-4 h-4 text-emerald-500" />
          تواصل معنا
        </h2>

        <div className="space-y-3">
          {/* Hotline */}
          <ContactRow icon={Phone} label="خط الدعم" value="+20 100 000 0000" href="tel:+201000000000" />
          {/* WhatsApp */}
          <ContactRow icon={Phone} label="واتساب" value="+20 100 000 0000" href="https://wa.me/201000000000" />
          {/* Email */}
          <ContactRow icon={Mail} label="البريد الإلكتروني الرسمي" value="partners@fastinvestment.com" href="mailto:partners@fastinvestment.com" />
          {/* Support note */}
          <div className="mt-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-4">
            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
              <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                يمكنك التواصل مع فريق الدعم عبر أي من القنوات أعلاه.
                ساعات العمل: الأحد — الخميس | ٩ص — ٥م.
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Documents list ── */}
      {brokerProfile?.broker_documents && (brokerProfile.broker_documents as unknown[]).length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
          <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-emerald-500" />
            الوثائق المرفوعة
          </h2>
          <div className="space-y-2">
            {(brokerProfile.broker_documents as Array<{ id: string; name: string; type: string; status: string; created_at: string }>)
              .map(doc => (
                <div key={doc.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{doc.name}</span>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-black shrink-0 ml-2 ${
                    doc.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                    doc.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {doc.status === 'approved' ? 'مقبول' : doc.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

    </div>
  )
}

function ContactRow({ icon: Icon, label, value, href }: {
  icon: typeof Phone; label: string; value: string; href: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
    >
      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-emerald-600" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-black text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-bold text-gray-800 dark:text-gray-200 group-hover:text-emerald-600 transition-colors" dir="ltr">{value}</p>
      </div>
    </a>
  )
}
