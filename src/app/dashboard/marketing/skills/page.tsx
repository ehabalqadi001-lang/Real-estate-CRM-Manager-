import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { requirePermission } from '@/shared/rbac/require-permission'
import { createRawClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type MarketingSkill = {
  id: string
  skill_key: string
  department: string
  title_ar: string | null
  title_en: string
  description_en: string | null
}

const DEPT_COLORS: Record<string, string> = {
  'Copywriting':      '#6366f1',
  'Paid Ads':         '#f59e0b',
  'SEO':              '#10b981',
  'Email Marketing':  '#3b82f6',
  'Social Media':     '#ec4899',
  'Video':            '#8b5cf6',
  'Analytics':        '#0F8F83',
  'CRM':              '#f97316',
  'Content Strategy': '#06b6d4',
  'Growth':           '#84cc16',
  'Personal Brand':   '#C9964A',
}

const DEPT_LABELS: Record<string, string> = {
  'Copywriting':      'الكتابة الإعلانية',
  'Paid Ads':         'الإعلانات المدفوعة',
  'SEO':              'تحسين محركات البحث',
  'Email Marketing':  'التسويق بالبريد',
  'Social Media':     'وسائل التواصل',
  'Video':            'الفيديو والتصميم',
  'Analytics':        'التحليلات',
  'CRM':              'CRM والأتمتة',
  'Content Strategy': 'استراتيجية المحتوى',
  'Growth':           'النمو والتوسع',
  'Personal Brand':   'العلامة الشخصية',
}

export default async function MarketingSkillsPage({ searchParams }: { searchParams: Promise<{ dept?: string }> }) {
  await requirePermission('messages.read')
  const { dept } = await searchParams

  const supabase = await createRawClient()
  const { data } = await supabase
    .from('marketing_skills')
    .select('id, skill_key, department, title_ar, title_en, description_en')
    .eq('is_active', true)
    .order('department')
    .order('title_en')

  const skills = (data ?? []) as MarketingSkill[]
  const departments = [...new Set(skills.map((s) => s.department))]
  const activeDept = dept ?? departments[0] ?? ''
  const filtered = activeDept ? skills.filter((s) => s.department === activeDept) : skills

  return (
    <div className="space-y-5 p-4 sm:p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4 shadow-sm">
        <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--fi-emerald)] shadow-lg shadow-[var(--fi-emerald)]/20">
          <Sparkles size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-black text-[var(--fi-ink)]">مكتبة المهارات التسويقية</h1>
          <p className="text-xs text-[var(--fi-muted)]">
            {skills.length} مهارة في {departments.length} قسم — اختر مهارة لتوليد محتوى بالذكاء الاصطناعي
          </p>
        </div>
      </div>

      {/* Department tabs */}
      <div className="flex flex-wrap gap-2">
        {departments.map((d) => {
          const color = DEPT_COLORS[d] ?? 'var(--fi-emerald)'
          const isActive = activeDept === d
          return (
            <Link
              key={d}
              href={`/dashboard/marketing/skills?dept=${encodeURIComponent(d)}`}
              className="rounded-xl border px-3 py-1.5 text-xs font-bold transition"
              style={isActive
                ? { backgroundColor: `${color}15`, borderColor: color, color }
                : { borderColor: 'var(--fi-line)', color: 'var(--fi-muted)' }
              }
            >
              {DEPT_LABELS[d] ?? d}
            </Link>
          )
        })}
      </div>

      {/* Skills grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((skill) => {
          const color = DEPT_COLORS[skill.department] ?? '#0F8F83'
          return (
            <Link
              key={skill.skill_key}
              href={`/dashboard/marketing/skills/${skill.skill_key}`}
              className="group flex flex-col gap-3 rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg transition group-hover:scale-105" style={{ backgroundColor: `${color}15`, color }}>
                  <Sparkles className="size-5" />
                </div>
                <span className="rounded-lg px-2 py-0.5 text-xs font-bold" style={{ backgroundColor: `${color}10`, color }}>
                  {DEPT_LABELS[skill.department] ?? skill.department}
                </span>
              </div>
              <div>
                <p className="font-black text-[var(--fi-ink)] leading-snug">{skill.title_ar ?? skill.title_en}</p>
                {skill.description_en && (
                  <p className="mt-1 text-xs text-[var(--fi-muted)] leading-relaxed line-clamp-2" dir="ltr">
                    {skill.description_en}
                  </p>
                )}
              </div>
              <p className="mt-auto text-xs font-black" style={{ color }}>توليد بالـ AI ←</p>
            </Link>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-10 text-center shadow-sm">
          <Sparkles className="mx-auto mb-3 size-10 text-[var(--fi-muted)]" />
          <p className="font-semibold text-[var(--fi-muted)]">لا توجد مهارات في هذا القسم</p>
        </div>
      )}
    </div>
  )
}
