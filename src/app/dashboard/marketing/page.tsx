import Link from 'next/link'
import {
  BarChart3,
  BookOpen,
  Megaphone,
  Sparkles,
  Target,
  Users,
  Wand2,
  TrendingUp,
  FileText,
  Mail,
  Globe,
  Video,
  Share2,
  Zap,
  Star,
} from 'lucide-react'
import { requirePermission } from '@/shared/rbac/require-permission'
import { createRawClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const DEPARTMENTS = [
  { key: 'Copywriting',     label: 'الكتابة الإعلانية',      icon: FileText,  color: '#6366f1', count: 5 },
  { key: 'Paid Ads',        label: 'الإعلانات المدفوعة',      icon: Target,    color: '#f59e0b', count: 4 },
  { key: 'SEO',             label: 'تحسين محركات البحث',       icon: Globe,     color: '#10b981', count: 4 },
  { key: 'Email Marketing', label: 'التسويق بالبريد الإلكتروني', icon: Mail,   color: '#3b82f6', count: 3 },
  { key: 'Social Media',    label: 'وسائل التواصل الاجتماعي', icon: Share2,    color: '#ec4899', count: 3 },
  { key: 'Video',           label: 'الفيديو والتصميم',         icon: Video,     color: '#8b5cf6', count: 3 },
  { key: 'Analytics',       label: 'التحليلات والتقارير',       icon: BarChart3, color: '#0F8F83', count: 3 },
  { key: 'CRM',             label: 'CRM والأتمتة',             icon: Zap,       color: '#f97316', count: 3 },
  { key: 'Content Strategy', label: 'استراتيجية المحتوى',     icon: BookOpen,  color: '#06b6d4', count: 2 },
  { key: 'Growth',          label: 'النمو والتوسع',            icon: TrendingUp, color: '#84cc16', count: 3 },
  { key: 'Personal Brand',  label: 'العلامة الشخصية',          icon: Star,      color: '#C9964A', count: 2 },
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
    { label: 'أصول مولّدة', value: String(assetsRes.count ?? 0), icon: <Wand2 className="size-5" />, color: '#0F8F83' },
    { label: 'حملات نشطة', value: String(campaignsRes.count ?? 0), icon: <Megaphone className="size-5" />, color: '#C9964A' },
    { label: 'مهارة تسويقية', value: '34', icon: <Sparkles className="size-5" />, color: '#6366f1' },
    { label: 'قسم تسويقي', value: '11', icon: <Users className="size-5" />, color: '#10b981' },
  ]

  const recentAssets = (recentAssetsRes.data ?? []) as { id: string; asset_type: string; output_text: string | null; created_at: string | null; metadata: Record<string, unknown> | null }[]

  return (
    <div className="space-y-8 p-4 sm:p-6" dir="rtl">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-l from-[#0F8F83] to-[#102033] p-6 text-white shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-white/60">FAST INVESTMENT</p>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">مركز التسويق الذكي</h1>
            <p className="mt-1 text-sm font-semibold text-white/70">34 مهارة تسويقية · 11 قسم · مدعوم بالذكاء الاصطناعي</p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/marketing/skills" className="rounded-xl bg-white/15 px-4 py-2 text-sm font-black text-white transition hover:bg-white/25">
              مكتبة المهارات
            </Link>
            <Link href="/dashboard/marketing/campaigns" className="rounded-xl bg-[#C9964A] px-4 py-2 text-sm font-black text-white transition hover:bg-[#A87A3A]">
              + حملة جديدة
            </Link>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-[#DDE6E4] bg-white p-5 shadow-sm dark:bg-slate-900">
            <div className="mb-3 flex size-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${kpi.color}15`, color: kpi.color }}>
              {kpi.icon}
            </div>
            <p className="text-3xl font-black text-[#102033] dark:text-white">{kpi.value}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Departments Grid */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-[#102033] dark:text-white">الأقسام التسويقية</h2>
          <Link href="/dashboard/marketing/skills" className="text-sm font-bold text-[#0F8F83] hover:underline">
            عرض جميع المهارات ←
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {DEPARTMENTS.map((dept) => {
            const Icon = dept.icon
            return (
              <Link
                key={dept.key}
                href={`/dashboard/marketing/skills?dept=${encodeURIComponent(dept.key)}`}
                className="group flex items-center gap-4 rounded-2xl border border-[#DDE6E4] bg-white p-4 shadow-sm transition hover:shadow-md hover:border-opacity-0 dark:bg-slate-900"
                style={{ borderColor: `${dept.color}30` }}
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl transition group-hover:scale-110" style={{ backgroundColor: `${dept.color}15`, color: dept.color }}>
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-black text-[#102033] dark:text-white">{dept.label}</p>
                  <p className="text-xs font-semibold text-slate-400">{dept.count} مهارة</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent Assets */}
      {recentAssets.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black text-[#102033] dark:text-white">آخر الأصول المولّدة</h2>
            <Link href="/dashboard/marketing/assets" className="text-sm font-bold text-[#0F8F83] hover:underline">
              عرض الكل ←
            </Link>
          </div>
          <div className="space-y-2">
            {recentAssets.map((asset) => (
              <div key={asset.id} className="flex items-start gap-3 rounded-xl border border-[#DDE6E4] bg-white p-4 shadow-sm dark:bg-slate-900">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#EEF6F5]">
                  <Wand2 className="size-4 text-[#0F8F83]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black uppercase text-[#0F8F83]">{asset.asset_type}</p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-[#102033] dark:text-white">
                    {(asset.output_text ?? '').slice(0, 100)}{(asset.output_text ?? '').length > 100 ? '…' : ''}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {asset.created_at ? new Date(asset.created_at).toLocaleDateString('ar-EG') : '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/dashboard/marketing/team" className="flex items-center gap-3 rounded-2xl border border-[#DDE6E4] bg-white p-4 shadow-sm transition hover:shadow-md dark:bg-slate-900">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#EEF6F5]">
            <Users className="size-5 text-[#0F8F83]" />
          </div>
          <div>
            <p className="font-black text-[#102033] dark:text-white">فريق التسويق</p>
            <p className="text-xs text-slate-400">عرض الموظفين المعينين</p>
          </div>
        </Link>
        <Link href="/dashboard/marketing/campaigns" className="flex items-center gap-3 rounded-2xl border border-[#DDE6E4] bg-white p-4 shadow-sm transition hover:shadow-md dark:bg-slate-900">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#C9964A]/10">
            <Megaphone className="size-5 text-[#C9964A]" />
          </div>
          <div>
            <p className="font-black text-[#102033] dark:text-white">الحملات</p>
            <p className="text-xs text-slate-400">تتبع الحملات التسويقية</p>
          </div>
        </Link>
        <Link href="/admin/creative-studio" className="flex items-center gap-3 rounded-2xl border border-[#DDE6E4] bg-white p-4 shadow-sm transition hover:shadow-md dark:bg-slate-900">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#6366f1]/10">
            <Wand2 className="size-5 text-[#6366f1]" />
          </div>
          <div>
            <p className="font-black text-[#102033] dark:text-white">AI Creative Studio</p>
            <p className="text-xs text-slate-400">توليد محتوى إعلاني</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
