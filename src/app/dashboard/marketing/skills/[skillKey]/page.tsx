import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { notFound } from 'next/navigation'
import { requirePermission } from '@/shared/rbac/require-permission'
import { createRawClient } from '@/lib/supabase/server'
import { SkillGeneratorClient } from './SkillGeneratorClient'

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

export default async function SkillPage({ params }: { params: Promise<{ skillKey: string }> }) {
  await requirePermission('messages.read')
  const { skillKey } = await params

  const supabase = await createRawClient()
  const { data: skill } = await supabase
    .from('marketing_skills')
    .select('skill_key, department, title_ar, title_en, description_en, content')
    .eq('skill_key', skillKey)
    .single()

  if (!skill) notFound()

  const color = DEPT_COLORS[skill.department] ?? '#0F8F83'
  const deptLabel = DEPT_LABELS[skill.department] ?? skill.department

  return (
    <div className="space-y-6 p-4 sm:p-6" dir="rtl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm font-semibold text-slate-400">
        <Link href="/dashboard/marketing" className="hover:text-[#0F8F83]">مركز التسويق</Link>
        <ArrowRight className="size-3.5 rotate-180" />
        <Link href={`/dashboard/marketing/skills?dept=${encodeURIComponent(skill.department)}`} className="hover:text-[#0F8F83]">
          {deptLabel}
        </Link>
        <ArrowRight className="size-3.5 rotate-180" />
        <span style={{ color }}>{skill.title_ar ?? skill.title_en}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: `${color}15`, color }}>
          <span className="text-2xl font-black">{(skill.title_ar ?? skill.title_en).charAt(0)}</span>
        </div>
        <div>
          <span className="rounded-lg px-2 py-0.5 text-xs font-black" style={{ backgroundColor: `${color}10`, color }}>
            {deptLabel}
          </span>
          <h1 className="mt-1 text-xl font-black text-[#102033] sm:text-2xl dark:text-white">
            {skill.title_ar ?? skill.title_en}
          </h1>
          {skill.description_en && (
            <p className="mt-1 text-sm font-semibold text-slate-500" dir="ltr">{skill.description_en}</p>
          )}
        </div>
      </div>

      {/* Generator */}
      <SkillGeneratorClient
        skillKey={skill.skill_key}
        titleAr={skill.title_ar ?? skill.title_en}
        descriptionEn={skill.description_en ?? null}
        skillContent={skill.content}
        departmentColor={color}
      />
    </div>
  )
}
