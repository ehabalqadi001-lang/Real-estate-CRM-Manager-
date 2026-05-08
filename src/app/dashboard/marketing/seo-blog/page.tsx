import { requirePermission } from '@/shared/rbac/require-permission'
import { createRawClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'
import { FileText, Globe, PenLine, Search } from 'lucide-react'
import { SEOBlogClient } from '@/app/admin/seo-blog/SEOBlogClient'

export const dynamic = 'force-dynamic'

export default async function MarketingSEOBlogPage() {
  await requirePermission('marketing.manage')
  const { profile } = await requireSession()
  const supabase = await createRawClient()
  const companyId = profile.company_id ?? profile.id

  const { data: raw } = await supabase
    .from('creative_assets')
    .select('id, title, output_text, status, created_at, metadata')
    .eq('company_id', companyId)
    .eq('asset_type', 'blog_post')
    .order('created_at', { ascending: false })
    .limit(50)

  const assets = (raw ?? []) as {
    id: string; title: string | null; output_text: string | null
    status: string | null; created_at: string
    metadata: { blog_type?: string; keywords?: string; city?: string } | null
  }[]

  const drafts    = assets.filter(a => a.status === 'draft').length
  const published = assets.filter(a => a.status === 'published').length

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-black text-[var(--fi-emerald)]">NEXUS SEO Engine</p>
        <h1 className="mt-1 text-xl sm:text-3xl font-black text-[var(--fi-ink)]">مولّد مقالات SEO</h1>
        <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">
          أنشئ محتوى تسويقي عقاري احترافي محسّن لمحركات البحث بالذكاء الاصطناعي — باللغة العربية.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: <FileText className="size-5" />, value: assets.length, label: 'إجمالي المقالات', color: 'text-[var(--fi-emerald)]' },
          { icon: <PenLine className="size-5" />,  value: drafts,        label: 'مسودة',           color: 'text-[#C9964A]' },
          { icon: <Globe className="size-5" />,    value: published,     label: 'منشور',            color: 'text-emerald-600' },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4 shadow-sm">
            <div className={`mb-2 ${k.color}`}>{k.icon}</div>
            <p className="text-2xl font-black text-[var(--fi-ink)]">{k.value}</p>
            <p className="text-xs font-semibold text-[var(--fi-muted)]">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[var(--fi-emerald)]/20 bg-[var(--fi-soft)] p-4">
        <div className="flex items-start gap-3">
          <Search className="mt-0.5 size-4 text-[var(--fi-emerald)] shrink-0" />
          <div>
            <p className="text-xs font-black text-[var(--fi-emerald)]">نصائح SEO</p>
            <p className="mt-0.5 text-xs font-semibold text-[var(--fi-muted)]">
              استخدم كلمات مفتاحية طويلة الذيل مثل &quot;شقق للبيع في التجمع الخامس 2026&quot; — المنافسة أقل والنية الشرائية أعلى. ركز على المناطق والمشاريع المحددة لترتيب أفضل.
            </p>
          </div>
        </div>
      </div>

      <SEOBlogClient assets={assets} />
    </div>
  )
}
