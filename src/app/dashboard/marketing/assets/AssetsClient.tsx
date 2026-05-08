'use client'

import { useState } from 'react'
import { CheckCircle2, Copy, Search, Wand2 } from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'

type CreativeAsset = {
  id: string
  asset_type: string
  output_text: string | null
  provider: string | null
  status: string | null
  created_at: string | null
  metadata: Record<string, unknown> | null
}

const ASSET_TYPE_LABELS: Record<string, string> = {
  ad_copy:          'إعلان',
  social_post:      'منشور',
  email:            'بريد',
  script:           'سكريبت',
  video:            'فيديو',
  copywriting:      'كتابة',
  paid_ads:         'إعلانات مدفوعة',
  seo:              'SEO',
  email_marketing:  'بريد إلكتروني',
  social_media:     'سوشيال ميديا',
  analytics:        'تحليلات',
  crm:              'CRM',
  content_strategy: 'استراتيجية محتوى',
  growth:           'نمو',
  personal_brand:   'علامة شخصية',
}

export function AssetsClient({ assets }: { assets: CreativeAsset[] }) {
  const [search, setSearch]     = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const filtered = assets.filter((a) => {
    const q = search.toLowerCase()
    if (!q) return true
    return (
      a.asset_type.toLowerCase().includes(q) ||
      (a.output_text ?? '').toLowerCase().includes(q) ||
      String(a.metadata?.skill_title ?? '').toLowerCase().includes(q)
    )
  })

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-5 p-4 sm:p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--fi-emerald)] shadow-lg shadow-[var(--fi-emerald)]/20">
            <Wand2 size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-[var(--fi-ink)]">مكتبة الأصول التسويقية</h1>
            <p className="text-xs text-[var(--fi-muted)]">{assets.length} أصل مولّد بالذكاء الاصطناعي</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[var(--fi-muted)]" />
          <Input
            placeholder="بحث…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-44 pr-9 sm:w-56"
          />
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-10 text-center shadow-sm">
          <Wand2 className="mx-auto mb-3 size-10 text-[var(--fi-muted)]" />
          <p className="font-semibold text-[var(--fi-muted)]">
            {assets.length === 0 ? 'لا توجد أصول بعد — ابدأ بتوليد محتوى من مكتبة المهارات' : 'لا توجد نتائج'}
          </p>
          {assets.length === 0 && (
            <Link href="/dashboard/marketing/skills" className="mt-3 inline-block text-sm font-black text-[var(--fi-emerald)] hover:underline">
              مكتبة المهارات ←
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((asset) => (
            <div key={asset.id} className="flex flex-col gap-3 rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-lg bg-[var(--fi-soft)] px-2 py-0.5 text-xs font-black text-[var(--fi-emerald)]">
                  {ASSET_TYPE_LABELS[asset.asset_type] ?? asset.asset_type}
                </span>
                <div className="flex items-center gap-2">
                  {asset.provider && <span className="text-xs text-[var(--fi-muted)]">{asset.provider}</span>}
                  {asset.created_at && (
                    <span className="text-xs text-[var(--fi-muted)]">
                      {new Date(asset.created_at).toLocaleDateString('ar-EG')}
                    </span>
                  )}
                </div>
              </div>

              {asset.metadata?.skill_title != null && (
                <p className="text-xs font-bold" style={{ color: '#C9964A' }}>{String(asset.metadata.skill_title)}</p>
              )}

              <p className="flex-1 text-sm font-semibold leading-relaxed text-[var(--fi-ink)] line-clamp-5">
                {asset.output_text ?? '—'}
              </p>

              {asset.output_text && (
                <button
                  onClick={() => handleCopy(asset.id, asset.output_text!)}
                  className="flex items-center gap-1.5 self-end text-xs font-bold text-[var(--fi-emerald)] hover:underline"
                >
                  {copiedId === asset.id ? <CheckCircle2 className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copiedId === asset.id ? 'تم النسخ' : 'نسخ'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
