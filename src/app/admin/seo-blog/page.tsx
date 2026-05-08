import { requirePermission } from '@/shared/rbac/require-permission'
import { createRawClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'
import { FileText, Globe, PenLine, Search } from 'lucide-react'
import { SEOBlogClient } from './SEOBlogClient'

export const dynamic = 'force-dynamic'

export default async function SEOBlogPage() {
  await requirePermission('platform.manage')
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
        <p className="text-sm font-black text-[#0F8F83]">NEXUS SEO Engine</p>
        <h1 className="mt-1 text-xl sm:text-3xl font-black text-[#102033] dark:text-white">مولّد مقالات SEO</h1>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          أنشئ محتوى تسويقي عقاري احترافي محسّن لمحركات البحث بالذكاء الاصطناعي — باللغة العربية.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: <FileText className="size-5" />, value: assets.length, label: 'إجمالي المقالات', color: 'text-[#0F8F83]' },
          { icon: <PenLine className="size-5" />,  value: drafts,        label: 'مسودة',           color: 'text-[#C9964A]' },
          { icon: <Globe className="size-5" />,    value: published,     label: 'منشور',            color: 'text-emerald-600' },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-[#DDE6E4] bg-white p-4 shadow-sm dark:bg-slate-900">
            <div className={`mb-2 ${k.color}`}>{k.icon}</div>
            <p className="text-2xl font-black text-[#102033] dark:text-white">{k.value}</p>
            <p className="text-xs font-semibold text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      {/* SEO Tips */}
      <div className="rounded-xl border border-[#0F8F83]/20 bg-[#EEF6F5] p-4">
        <div className="flex items-start gap-3">
          <Search className="mt-0.5 size-4 text-[#0F8F83] shrink-0" />
          <div>
            <p className="text-xs font-black text-[#0F8F83]">نصائح SEO</p>
            <p className="mt-0.5 text-xs font-semibold text-slate-600">
              استخدم كلمات مفتاحية طويلة الذيل مثل &quot;شقق للبيع في التجمع الخامس 2026&quot; — المنافسة أقل والنية الشرائية أعلى. ركز على المناطق والمشاريع المحددة لترتيب أفضل.
            </p>
          </div>
        </div>
      </div>

      <SEOBlogClient assets={assets} />
    </div>
  )
}
