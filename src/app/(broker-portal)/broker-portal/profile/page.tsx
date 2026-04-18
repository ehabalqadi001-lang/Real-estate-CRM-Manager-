import { createServerClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'
import { User, Shield, Building2, CheckCircle, XCircle, Clock } from 'lucide-react'

async function getBrokerProfile(userId: string) {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('broker_profiles')
    .select('*, broker_documents ( id, type, name, status, created_at )')
    .eq('profile_id', userId)
    .maybeSingle()
  return data
}

const VERIFICATION_STATUS: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending:      { label: 'في انتظار المراجعة', color: 'text-yellow-600', icon: Clock },
  under_review: { label: 'قيد المراجعة',       color: 'text-blue-600',   icon: Clock },
  verified:     { label: 'موثّق ✓',             color: 'text-[var(--fi-emerald)]',  icon: CheckCircle },
  rejected:     { label: 'مرفوض',               color: 'text-red-600',    icon: XCircle },
  suspended:    { label: 'موقوف',               color: 'text-orange-600', icon: XCircle },
}

export default async function BrokerProfilePage() {
  const session = await requireSession()
  const brokerProfile = await getBrokerProfile(session.user.id)

  const status = brokerProfile?.verification_status ?? 'pending'
  const statusCfg = VERIFICATION_STATUS[status] ?? VERIFICATION_STATUS.pending
  const StatusIcon = statusCfg.icon

  const completionItems = [
    { label: 'الاسم الكامل',        done: !!session.profile.full_name },
    { label: 'رقم الهاتف',          done: true },
    { label: 'صورة شخصية',          done: !!brokerProfile?.photo_url },
    { label: 'رقم البطاقة الوطنية', done: !!brokerProfile?.national_id },
    { label: 'صورة البطاقة',        done: !!brokerProfile?.national_id_url },
    { label: 'الكارت الضريبي',      done: !!brokerProfile?.tax_card_url },
    { label: 'بيانات الحساب البنكي', done: !!brokerProfile?.bank_account_number },
  ]
  const completionPct = Math.round(
    (completionItems.filter(i => i.done).length / completionItems.length) * 100
  )

  return (
    <div className="space-y-6 max-w-2xl" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ملفي الشخصي</h1>
        <p className="text-gray-500 text-sm mt-1">بياناتك الشخصية ووثائق التوثيق</p>
      </div>

      {/* Verification Status Banner */}
      <div className={`rounded-xl border p-4 flex items-center gap-3 ${
        status === 'verified'
          ? 'bg-[var(--fi-soft)] border-green-200 dark:border-green-800'
          : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      }`}>
        <StatusIcon className={`w-5 h-5 ${statusCfg.color}`} />
        <div>
          <p className={`font-medium text-sm ${statusCfg.color}`}>{statusCfg.label}</p>
          {brokerProfile?.rejection_reason && (
            <p className="text-xs text-red-600 mt-0.5">{brokerProfile.rejection_reason}</p>
          )}
        </div>
      </div>

      {/* Profile Completion */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-[var(--fi-emerald)]" />
            اكتمال الملف الشخصي
          </h2>
          <span className="text-2xl font-bold text-[var(--fi-emerald)]">{completionPct}%</span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-green-500 rounded-full transition-all"
            style={{ width: `${completionPct}%` }}
          />
        </div>
        <div className="space-y-2">
          {completionItems.map(({ label, done }) => (
            <div key={label} className="flex items-center gap-2 text-sm">
              {done
                ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                : <XCircle className="w-4 h-4 text-gray-300 shrink-0" />
              }
              <span className={done ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}>
                {label}
              </span>
              {!done && (
                <span className="text-xs text-yellow-600 font-medium">مطلوب</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Personal Info */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <User className="w-4 h-4 text-[var(--fi-emerald)]" />
          البيانات الشخصية
        </h2>
        <div className="grid grid-cols-1 gap-3">
          {[
            { label: 'الاسم الكامل',   value: session.profile.full_name ?? '—' },
            { label: 'البريد الإلكتروني', value: session.profile.email ?? '—' },
            { label: 'رقم الهاتف',    value: '—' },
            { label: 'الرقم القومي',  value: brokerProfile?.national_id ?? '—' },
            { label: 'رقم الكارت الضريبي', value: brokerProfile?.tax_card_number ?? '—' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <span className="text-sm text-gray-500">{label}</span>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bank Info */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[var(--fi-emerald)]" />
          بيانات الحساب البنكي
        </h2>
        <div className="grid grid-cols-1 gap-3">
          {[
            { label: 'البنك',               value: brokerProfile?.bank_name ?? '—' },
            { label: 'اسم صاحب الحساب',    value: brokerProfile?.bank_account_name ?? '—' },
            { label: 'رقم الحساب',          value: brokerProfile?.bank_account_number
              ? '•••••' + brokerProfile.bank_account_number.slice(-4)
              : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <span className="text-sm text-gray-500">{label}</span>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Documents */}
      {brokerProfile?.broker_documents && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">الوثائق المرفوعة</h2>
          {brokerProfile.broker_documents.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">لم يتم رفع أي وثائق بعد</p>
          ) : (
            <div className="space-y-2">
              {(brokerProfile.broker_documents as Array<{id:string; name:string; type:string; status:string; created_at:string}>).map(doc => (
                <div key={doc.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{doc.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    doc.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' :
                    doc.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30' :
                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30'
                  }`}>
                    {doc.status === 'approved' ? 'مقبول' : doc.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
