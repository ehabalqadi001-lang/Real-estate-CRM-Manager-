'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type ReactNode } from 'react'

const modules = [
  { href: '/dashboard/erp/hr', label: 'لوحة التحكم', exact: true },
  { href: '/dashboard/erp/hr/attendance', label: 'الحضور' },
  { href: '/dashboard/erp/hr/leaves', label: 'الإجازات' },
  { href: '/dashboard/erp/hr/commission', label: 'العمولات' },
  { href: '/dashboard/erp/hr/payroll', label: 'الرواتب' },
  { href: '/dashboard/erp/hr/talent', label: 'استقطاب المواهب' },
  { href: '/dashboard/erp/hr/onboarding', label: 'الاستقبال' },
  { href: '/dashboard/erp/hr/performance', label: 'تقييمات الأداء' },
  { href: '/dashboard/erp/hr/documents', label: 'الوثائق' },
  { href: '/dashboard/erp/hr/academy', label: 'الأكاديمية' },
  { href: '/dashboard/erp/hr/hrbp', label: 'الذكاء البشري' },
  { href: '/dashboard/erp/hr/analytics', label: 'التحليلات' },
]

export function HrNav({ icons }: { icons: Record<string, ReactNode> }) {
  const pathname = usePathname()

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
