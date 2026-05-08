'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createCampaignAction, syncAdsAction } from './actions'
import { Loader2, CheckCircle2, AlertCircle, Megaphone, RefreshCw, ExternalLink, Zap } from 'lucide-react'

interface CreativeAsset {
  id: string
  title: string | null
  asset_type: string
  output_text: string | null
}

interface AdsKey { name: string; configured: boolean }

interface Props {
  assets: CreativeAsset[]
  keys: AdsKey[]
  stats: { platform: string; campaigns: number; spend: number; impressions: number; clicks: number; ctr: number }[]
}

export function AdsClient({ assets, keys, stats }: Props) {
  const [tab, setTab]       = useState<'meta' | 'google'>('meta')
  const [showForm, setShowForm] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [pending, start]    = useTransition()

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('platform', tab)
    start(async () => {
      const res = await createCampaignAction(fd)
      if (res?.error) setResult({ ok: false, msg: res.error })
      else { setResult({ ok: true, msg: 'تم إنشاء الحملة بنجاح' }); setShowForm(false) }
    })
  }

  const handleSync = () => {
    start(async () => {
      const res = await syncAdsAction(tab)
      if (res?.error) setResult({ ok: false, msg: res.error })
      else setResult({ ok: true, msg: `تم مزامنة ${res.count} حملة` })
    })
  }

  const metaConfigured   = keys.find(k => k.name === 'meta_ads')?.configured
  const googleConfigured = keys.find(k => k.name === 'google_ads')?.configured

  const platformStats = stats.find(s => s.platform === tab)

  return (
    <div className="space-y-5">
      {/* Platform tabs */}
      <div className="flex gap-2">
        {[
          { key: 'meta' as const,   label: 'Meta Ads',   logo: '🟦', configured: metaConfigured },
          { key: 'google' as const, label: 'Google Ads', logo: '🟥', configured: googleConfigured },
        ].map(p => (
          <button
            key={p.key}
            onClick={() => setTab(p.key)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition-all ${tab === p.key ? 'bg-[var(--fi-emerald)] text-white shadow-md' : 'border border-[var(--fi-line)] bg-[var(--fi-paper)] text-[var(--fi-muted)] hover:border-[var(--fi-emerald)]/40'}`}
          >
            <span>{p.logo}</span> {p.label}
            {p.configured
              ? <span className="h-2 w-2 rounded-full bg-emerald-400" title="متصل" />
              : <span className="h-2 w-2 rounded-full bg-slate-300" title="غير متصل" />}
          </button>
        ))}
      </div>

      {/* Connection status */}
      {!(tab === 'meta' ? metaConfigured : googleConfigured) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-black text-amber-800">
            🔑 مفتاح {tab === 'meta' ? 'Meta Ads (meta_ads)' : 'Google Ads (google_ads)'} غير مكوّن
          </p>
          <p className="mt-1 text-xs font-semibold text-amber-700">
            أضف المفتاح في{' '}
            <a href="/admin/api-vault" className="underline hover:no-underline">API Vault</a>
            {' '}ثم عد لهذه الصفحة.
          </p>
        </div>
      )}

      {/* Stats */}
      {platformStats && (
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { label: 'حملات نشطة',    value: platformStats.campaigns },
            { label: 'الإنفاق (ج.م)', value: platformStats.spend.toLocaleString('ar-EG') },
            { label: 'مشاهدات',       value: platformStats.impressions.toLocaleString('ar-EG') },
            { label: 'CTR',            value: `${platformStats.ctr}%` },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-3 shadow-sm">
              <p className="text-lg font-black text-[var(--fi-ink)]">{s.value}</p>
              <p className="text-xs font-semibold text-[var(--fi-muted)]">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={handleSync}
          className="gap-1.5"
        >
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
          مزامنة البيانات
        </Button>
        <Button
          size="sm"
          onClick={() => setShowForm(v => !v)}
          className="fi-primary-button gap-1.5"
        >
          <Megaphone className="size-3.5" />
          إنشاء حملة جديدة
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => window.open(tab === 'meta' ? 'https://business.facebook.com/adsmanager' : 'https://ads.google.com', '_blank')}
        >
          <ExternalLink className="size-3.5" />
          فتح لوحة {tab === 'meta' ? 'Meta' : 'Google'} Ads
        </Button>
      </div>

      {/* Create campaign form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-5 shadow-sm space-y-4">
          <p className="font-black text-[var(--fi-ink)]">
            إنشاء حملة — {tab === 'meta' ? 'Meta Ads' : 'Google Ads'}
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-black text-[var(--fi-muted)]">اسم الحملة *</label>
              <Input name="campaign_name" placeholder="حملة مشاريع يونيو 2026" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-black text-[var(--fi-muted)]">الهدف</label>
              <select name="objective" className="w-full rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] px-3 py-2 text-sm font-semibold">
                <option value="awareness">الوعي بالعلامة التجارية</option>
                <option value="traffic">حركة المرور للموقع</option>
                <option value="leads">جذب عملاء محتملين</option>
                <option value="conversions">التحويلات</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-black text-[var(--fi-muted)]">الميزانية اليومية (ج.م)</label>
              <Input name="daily_budget" type="number" min="50" placeholder="500" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-black text-[var(--fi-muted)]">الجمهور المستهدف</label>
              <Input name="audience" placeholder="رجال 30-55، القاهرة، مهتمون بالعقارات" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-black text-slate-500">الإعلان الإبداعي (من Creative Studio)</label>
            <select name="asset_id" className="w-full rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] px-3 py-2 text-sm font-semibold">
              <option value="">— اختر محتوى إعلاني —</option>
              {assets.map(a => (
                <option key={a.id} value={a.id}>{a.title || `${a.asset_type} — ${a.id.slice(0, 8)}`}</option>
              ))}
            </select>
          </div>

          {result && (
            <p className={`flex items-center gap-1.5 text-xs font-semibold ${result.ok ? 'text-[var(--fi-emerald)]' : 'text-red-600'}`}>
              {result.ok ? <CheckCircle2 className="size-3.5" /> : <AlertCircle className="size-3.5" />}
              {result.msg}
            </p>
          )}

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">إلغاء</Button>
            <Button type="submit" disabled={pending} className="flex-1 fi-primary-button">
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
              إنشاء الحملة
            </Button>
          </div>
        </form>
      )}

      {result && !showForm && (
        <p className={`flex items-center gap-1.5 text-xs font-semibold ${result.ok ? 'text-[var(--fi-emerald)]' : 'text-red-600'}`}>
          {result.ok ? <CheckCircle2 className="size-3.5" /> : <AlertCircle className="size-3.5" />}
          {result.msg}
        </p>
      )}
    </div>
  )
}
