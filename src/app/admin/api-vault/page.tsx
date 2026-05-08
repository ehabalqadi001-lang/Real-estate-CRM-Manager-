import { requirePermission } from '@/shared/rbac/require-permission'
import { createRawClient } from '@/lib/supabase/server'
import { Shield, Lock } from 'lucide-react'
import { ApiKeyForm } from './ApiKeyForm'

export const dynamic = 'force-dynamic'

export default async function ApiVaultPage() {
  await requirePermission('platform.manage')
  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profileRow } = await supabase
    .from('user_profiles')
    .select('company_id')
    .eq('id', user!.id)
    .single()

  const companyId = profileRow?.company_id ?? user!.id

  const { data: keys } = await supabase
    .from('company_api_keys')
    .select('id, key_name, hint, updated_at')
    .eq('company_id', companyId)
    .order('key_name')

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-black text-[#0F8F83]">NEXUS Security</p>
          <h1 className="mt-1 text-xl sm:text-3xl font-black text-[#102033] dark:text-white">API Vault</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            احفظ مفاتيح API الخاصة بك مشفرة بـ AES-256 — لا يتم تخزين القيم بنص واضح.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
          <Lock className="size-4 text-emerald-600" />
          <span className="text-xs font-black text-emerald-700">AES-256-GCM Encrypted</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ApiKeyForm existing={keys ?? []} />

        <div className="space-y-4">
          <div className="rounded-2xl border border-[#DDE6E4] bg-[#FBFCFA] p-5 dark:bg-slate-800">
            <div className="mb-3 flex items-center gap-2">
              <Shield className="size-4 text-[#0F8F83]" />
              <p className="font-black text-[#102033] dark:text-white">كيف يعمل Vault</p>
            </div>
            <ul className="space-y-2 text-xs font-semibold text-slate-500">
              <li>• المفاتيح تُشفَّر بـ AES-256-GCM قبل التخزين في Supabase</li>
              <li>• لا أحد يستطيع رؤية القيمة الكاملة بعد الحفظ — حتى مديري المنصة</li>
              <li>• يتم فك التشفير فقط داخل Server Actions عند الحاجة للاستخدام</li>
              <li>• مفتاح التشفير مخزن كـ Environment Variable خارج قاعدة البيانات</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-[#DDE6E4] bg-[#FBFCFA] p-5 dark:bg-slate-800">
            <p className="mb-3 font-black text-[#102033] dark:text-white">المفاتيح المطلوبة للمودولات</p>
            <div className="space-y-2 text-xs font-semibold">
              {[
                { key: 'openai',         module: 'FAST Agent / Creative Studio' },
                { key: 'heygen',         module: 'Video Generation' },
                { key: 'elevenlabs',     module: 'Voice Generation' },
                { key: 'meta_ads',       module: 'Meta Ads API' },
                { key: 'google_ads',     module: 'Google Ads API' },
                { key: 'whatsapp_token', module: 'WhatsApp Business Cloud' },
                { key: 'resend',         module: 'Email Reports Delivery' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between rounded-lg border border-[#DDE6E4] px-3 py-2 bg-white dark:bg-slate-900">
                  <code className="text-slate-500">{item.key}</code>
                  <span className="text-[#0F8F83]">{item.module}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
