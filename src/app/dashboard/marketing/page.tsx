import Link from 'next/link'
import {
  BarChart3, BookOpen, FileText, Globe, Mail,
  Megaphone, Share2, Sparkles, Star, Target,
  TrendingUp, Users, Video, Wand2, Zap,
} from 'lucide-react'
import { requirePermission } from '@/shared/rbac/require-permission'
import { createRawClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const DEPARTMENTS = [
  { key: 'Copywriting',      label: 'الكتابة الإعلانية',         icon: FileText,   color: '#6366f1', count: 5 },
  { key: 'Paid Ads',         label: 'الإعلانات المدفوعة',         icon: Target,     color: '#f59e0b', count: 4 },
  { key: 'SEO',              label: 'تحسين محركات البحث',          icon: Globe,      color: '#10b981', count: 4 },
  { key: 'Email Marketing',  label: 'التسويق بالبريد',             icon: Mail,       color: '#3b82f6', count: 3 },
  { key: 'Social Media',     label: 'وسائل التواصل الاجتماعي',    icon: Share2,     color: '#ec4899', count: 3 },
  { key: 'Video',            label: 'الفيديو والتصميم',            icon: Video,      color: '#8b5cf6', count: 3 },
  { key: 'Analytics',        label: 'التحليلات والتقارير',          icon: BarChart3,  color: '#0F8F83', count: 3 },
  { key: 'CRM',              label: 'CRM والأتمتة',                icon: Zap,        color: '#f97316', count: 3 },
  { key: 'Content Strategy', label: 'استراتيجية المحتوى',          icon: BookOpen,   color: '#06b6d4', count: 2 },
  { key: 'Growth',           label: 'النمو والتوسع',               icon: TrendingUp, color: '#84cc16', count: 3 },
  { key: 'Personal Brand',   label: 'العلامة الشخصية',             icon: Star,       color: '#C9964A', count: 2 },
]

export default async function MarketingHubPage() {
  await requirePermission('messages.read')
  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('user_profiles').select('company_id').eq('id', user.id).single()
  const companyId = profile?.company_id ?? user.id

  const [assetsRes, campaignsRes, recentAssetsRes] = await Promise.all([
    supabase.from('creative_assets').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
    supabase.from('marketing_campaigns').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'active'),
    supabase.from('creative_assets').select('id, asset_type, output_text, created_at, metadata').eq('company_id', companyId).order('created_at', { ascending: false }).limit(5),
  ])

  const kpis = [
    { label: 'أصول مولّدة',   value: String(assetsRes.count ?? 0),   icon: <Wand2 className="size-5" />,     accent: 'var(--fi-emerald)' },
    { label: 'حملات نشطة',    value: String(campaignsRes.count ?? 0), icon: <Megaphone className="size-5" />, accent: '#C9964A' },
    { label: 'مهارة تسويقية', value: '34',                            icon: <Sparkles className="size-5" />, accent: '#6366f1' },
    { label: 'قسم تسويقي',    value: '11',                            icon: <Users className="size-5" />,    accent: '#10b981' },
  ]

  const recentAssets = (recentAssetsRes.data ?? []) as { id: string; asset_type: string; output_text: string | null; created_at: string | null; metadata: Record<string, unknown> | null }[]

  return (
    <div className="space-y-6 p-4 sm:p-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--fi-emerald)] shadow-lg shadow-[var(--fi-emerald)]/20">
            <Megaphone size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-[var(--fi-ink)]">مركز التسويق الذكي</h1>
            <p className="text-xs text-[var(--fi-muted)]">34 مهارة · 11 قسم · مدعوم بالذكاء الاصطناعي</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/marketing/skills" className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--fi-line)] px-3 py-2 text-sm font-bold text-[var(--fi-ink)] hover:bg-[var(--fi-soft)]">
            مكتبة المهارات
          </Link>
          <Link href="/dashboard/marketing/campaigns" className="fi-primary-button inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-white">
            + حملة جديدة
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="flex items-center gap-3 rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4 shadow-sm">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${k.accent}15`, color: k.accent }}>
              {k.icon}
            </div>
            <div>
              <p className="text-xs text-[var(--fi-muted)]">{k.label}</p>
              <p className="text-xl font-black text-[var(--fi-ink)]">{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Departments */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-black text-[var(--fi-ink)]">الأقسام التسويقية</h2>
          <Link href="/dashboard/marketing/skills" className="text-sm font-bold text-[var(--fi-emerald)] hover:underline">
            جميع المهارات ←
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {DEPARTMENTS.map((dept) => {
            const Icon = dept.icon
            return (
              <Link
                key={dept.key}
                href={`/dashboard/marketing/skills?dept=${encodeURIComponent(dept.key)}`}
                className="group flex items-center gap-3 rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg transition group-hover:scale-105" style={{ backgroundColor: `${dept.color}15`, color: dept.color }}>
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-black text-[var(--fi-ink)]">{dept.label}</p>
                  <p className="text-xs text-[var(--fi-muted)]">{dept.count} مهارة</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent assets */}
      {recentAssets.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-black text-[var(--fi-ink)]">آخر الأصول المولّدة</h2>
            <Link href="/dashboard/marketing/assets" className="text-sm font-bold text-[var(--fi-emerald)] hover:underline">عرض الكل ←</Link>
          </div>
          <div className="space-y-2">
            {recentAssets.map((asset) => (
              <div key={asset.id} className="flex items-start gap-3 rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4 shadow-sm">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--fi-soft)]">
                  <Wand2 className="size-4 text-[var(--fi-emerald)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black uppercase text-[var(--fi-emerald)]">{asset.asset_type}</p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-[var(--fi-ink)]">
                    {(asset.output_text ?? '').slice(0, 100)}{(asset.output_text ?? '').length > 100 ? '…' : ''}
                  </p>
                  <p className="text-xs text-[var(--fi-muted)]">
                    {asset.created_at ? new Date(asset.created_at).toLocaleDateString('ar-EG') : '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { href: '/dashboard/marketing/team',       label: 'فريق التسويق',    sub: 'عرض الموظفين المعينين',   icon: Users,     accent: 'var(--fi-emerald)' },
          { href: '/dashboard/marketing/campaigns',  label: 'الحملات',          sub: 'تتبع الحملات التسويقية', icon: Megaphone, accent: '#C9964A' },
          { href: '/admin/creative-studio',          label: 'AI Creative Studio', sub: 'توليد محتوى إعلاني',    icon: Wand2,     accent: '#6366f1' },
        ].map(({ href, label, sub, icon: Icon, accent }) => (
          <Link key={href} href={href} className="flex items-center gap-3 rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4 shadow-sm transition hover:shadow-md">
            <div className="flex size-10 items-center justify-center rounded-lg" style={{ backgroundColor: `${accent}15`, color: accent }}>
              <Icon className="size-5" />
            </div>
            <div>
              <p className="font-black text-[var(--fi-ink)]">{label}</p>
              <p className="text-xs text-[var(--fi-muted)]">{sub}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
