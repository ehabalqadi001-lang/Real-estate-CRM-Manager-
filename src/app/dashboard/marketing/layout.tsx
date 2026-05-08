'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, BookOpen, Megaphone, Users, Wand2 } from 'lucide-react'

const NAV = [
  { href: '/dashboard/marketing',           label: 'نظرة عامة', icon: Megaphone, exact: true  },
  { href: '/dashboard/marketing/skills',    label: 'المهارات',   icon: BookOpen,  exact: false },
  { href: '/dashboard/marketing/assets',    label: 'الأصول',     icon: Wand2,     exact: false },
  { href: '/dashboard/marketing/campaigns', label: 'الحملات',    icon: BarChart3, exact: false },
  { href: '/dashboard/marketing/team',      label: 'الفريق',     icon: Users,     exact: false },
]

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen" dir="rtl">
      {/* Sub-nav */}
      <div className="sticky top-0 z-20 border-b border-[var(--fi-line)] bg-[var(--fi-paper)]/95 backdrop-blur">
        <div className="flex items-center gap-1 overflow-x-auto px-4 sm:px-6">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-bold transition ${
                  active
                    ? 'border-[var(--fi-emerald)] text-[var(--fi-emerald)]'
                    : 'border-transparent text-[var(--fi-muted)] hover:text-[var(--fi-emerald)]'
                }`}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            )
          })}
        </div>
      </div>
      {children}
    </div>
  )
}
