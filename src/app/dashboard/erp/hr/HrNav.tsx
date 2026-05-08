'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type ReactNode } from 'react'
import { useI18n } from '@/hooks/use-i18n'

export function HrNav({ icons }: { icons: Record<string, ReactNode> }) {
  const { t } = useI18n()
  const pathname = usePathname()

  const modules = [
    { href: '/dashboard/erp/hr', label: t('لوحة التحكم', 'Dashboard'), exact: true },
    { href: '/dashboard/erp/hr/attendance', label: t('الحضور', 'Attendance') },
    { href: '/dashboard/erp/hr/leaves', label: t('الإجازات', 'Leaves') },
    { href: '/dashboard/erp/hr/commission', label: t('العمولات', 'Commissions') },
    { href: '/dashboard/erp/hr/payroll', label: t('الرواتب', 'Payroll') },
    { href: '/dashboard/erp/hr/talent', label: t('استقطاب المواهب', 'Talent Acquisition') },
    { href: '/dashboard/erp/hr/onboarding', label: t('الاستقبال', 'Onboarding') },
    { href: '/dashboard/erp/hr/performance', label: t('تقييمات الأداء', 'Performance Reviews') },
    { href: '/dashboard/erp/hr/documents', label: t('الوثائق', 'Documents') },
    { href: '/dashboard/erp/hr/academy', label: t('الأكاديمية', 'Academy') },
    { href: '/dashboard/erp/hr/hrbp', label: t('الذكاء البشري', 'People Intelligence') },
    { href: '/dashboard/erp/hr/analytics', label: t('التحليلات', 'Analytics') },
  ]

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <nav className="sticky top-0 z-30 border-b border-[var(--fi-line)] bg-white/95 backdrop-blur dark:bg-[var(--fi-card)]/95">
      <div className="flex items-center gap-0.5 overflow-x-auto px-4 scrollbar-none sm:px-6">
        {modules.map((mod) => (
          <Link
            key={mod.href}
            href={mod.href}
            className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-3.5 text-sm font-black transition ${
              isActive(mod.href, mod.exact)
                ? 'border-[var(--fi-emerald)] text-[var(--fi-emerald)]'
                : 'border-transparent text-[var(--fi-muted)] hover:border-[var(--fi-emerald)]/40 hover:text-[var(--fi-ink)]'
            }`}
          >
            {icons[mod.href] && <span className="hidden sm:block">{icons[mod.href]}</span>}
            {mod.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
