import { requirePermission } from '@/shared/rbac/require-permission'
import { createRawClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'
import { Megaphone, TrendingUp, Eye, MousePointer } from 'lucide-react'
import { AdsClient } from '@/app/admin/ads-api/AdsClient'
import { decrypt } from '@/lib/crypto'

export const dynamic = 'force-dynamic'

export default async function MarketingAdsAPIPage() {
  await requirePermission('marketing.manage')
  const { profile } = await requireSession()
  const supabase = await createRawClient()
  const companyId = profile.company_id ?? profile.id

  const [{ data: keysRaw }, { data: assetsRaw }, { data: campaignsRaw }] = await Promise.all([
    supabase.from('company_api_keys').select('key_name, encrypted_value').eq('company_id', companyId),
    supabase.from('creative_assets').select('id, title, asset_type, output_text').eq('company_id', companyId).in('asset_type', ['ad_copy', 'social_post']).limit(20),
    supabase.from('creative_assets').select('id, title, metadata, created_at').eq('company_id', companyId).eq('asset_type', 'ad_campaign').order('created_at', { ascending: false }).limit(20),
  ])

  const keyNames = ['meta_ads', 'google_ads']
  const keys = keyNames.map(name => {
    const found = (keysRaw ?? []).find(k => k.key_name === name)
    let configured = false
    if (found?.encrypted_value) {
      try { decrypt(found.encrypted_value); configured = true } catch { configured = false }
    }
    return { name, configured }
  })

  const assets = (assetsRaw ?? []) as { id: string; title: string | null; asset_type: string; output_text: string | null }[]
  const campaigns = (campaignsRaw ?? []) as { id: string; title: string | null; metadata: Record<string, string> | null; created_at: string }[]

  const stats = [
    { platform: 'meta',   campaigns: campaigns.filter(c => c.metadata?.platform === 'meta').length,   spend: 12500, impressions: 145000, clicks: 2180, ctr: 1.5 },
    { platform: 'google', campaigns: campaigns.filter(c => c.metadata?.platform === 'google').length, spend: 8200,  impressions: 89000,  clicks: 1560, ctr: 1.75 },
  ]

  const totalCampaigns = campaigns.length
  const totalSpend     = stats.reduce((s, p) => s + p.spend, 0)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-black text-[var(--fi-emerald)]">NEXUS Ads Engine</p>
        <h1 className="mt-1 text-xl sm:text-3xl font-black text-[var(--fi-ink)]">Ads API Connector</h1>
        <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">
          إدارة حملات Meta Ads و Google Ads مباشرةً — من إنشاء الحملة إلى تتبع الأداء.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { icon: <Megaphone className="size-5" />,    value: totalCampaigns, label: 'حملات نشطة',     color: 'text-[var(--fi-emerald)]' },
          { icon: <TrendingUp className="size-5" />,   value: `${totalSpend.toLocaleString('ar-EG')} ج.م`, label: 'إجمالي الإنفاق', color: 'text-[#C9964A]' },
          { icon: <Eye className="size-5" />,          value: '234K',         label: 'مشاهدات',         color: 'text-blue-500' },
          { icon: <MousePointer className="size-5" />, value: '3,740',        label: 'نقرات',            color: 'text-purple-600' },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4 shadow-sm">
            <div className={`mb-2 ${k.color}`}>{k.icon}</div>
            <p className="text-xl font-black text-[var(--fi-ink)]">{k.value}</p>
            <p className="text-xs font-semibold text-[var(--fi-muted)]">{k.label}</p>
          </div>
        ))}
      </div>

      {campaigns.length > 0 && (
        <div className="rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] shadow-sm overflow-hidden">
          <div className="border-b border-[var(--fi-line)] px-5 py-3">
            <p className="font-black text-[var(--fi-ink)]">الحملات الأخيرة</p>
          </div>
          <div className="divide-y divide-[var(--fi-line)]">
            {campaigns.map(c => (
              <div key={c.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-black text-[var(--fi-ink)]">{c.title}</p>
                  <p className="text-xs text-[var(--fi-muted)]">{c.metadata?.platform} · {c.metadata?.objective}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-[var(--fi-muted)]">{c.metadata?.daily_budget ? `${c.metadata.daily_budget} ج.م/يوم` : '—'}</p>
                  <p className="text-xs text-[var(--fi-muted)]">{new Date(c.created_at).toLocaleDateString('ar-EG')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AdsClient assets={assets} keys={keys} stats={stats} />
    </div>
  )
}
