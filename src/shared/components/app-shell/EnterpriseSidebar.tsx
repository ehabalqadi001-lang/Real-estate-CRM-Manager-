'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, Crown, LogOut } from 'lucide-react'
import { dashboardNavigation } from '@/shared/config/navigation'
import type { AppProfile } from '@/shared/auth/types'
import { hasPermission } from '@/shared/rbac/permissions'

interface EnterpriseSidebarProps {
  profile: AppProfile
}

export function EnterpriseSidebar({ profile }: EnterpriseSidebarProps) {
  const pathname = usePathname()
  const visibleGroups = dashboardNavigation
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasPermission(profile.role, item.permission)),
    }))
    .filter((group) => group.items.length > 0)

  const initials = (profile.full_name ?? profile.email ?? 'FI')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <aside className="hidden h-screen w-[292px] shrink-0 p-4 lg:block" dir="rtl">
      <div className="fi-glass flex h-full flex-col overflow-hidden rounded-lg">
        <div className="border-b border-[var(--fi-line)] p-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-lg border border-[var(--fi-line)] bg-[rgba(201,168,76,0.14)] text-[var(--fi-gold)]">
              <Building2 className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-black tracking-wide text-white">FAST INVESTMENT</span>
              <span className="mt-0.5 block truncate text-[11px] font-bold text-[var(--fi-muted)]">Enterprise CRM</span>
            </span>
          </Link>
        </div>

        <div className="mx-4 mt-4 rounded-lg border border-[var(--fi-line)] bg-white/[0.04] p-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--fi-gold)] text-xs font-black text-[var(--fi-navy)]">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-white">{profile.full_name ?? profile.email}</p>
              <p className="mt-0.5 truncate text-[11px] font-bold text-[var(--fi-muted)]">{labelRole(profile.role)}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-black/20 px-3 py-2 text-[11px] font-bold text-[var(--fi-gold)]">
            <Crown className="size-3.5" />
            Enterprise Workspace
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-5">
            {visibleGroups.map((group) => (
              <section key={group.title}>
                <p className="mb-2 px-2 text-[11px] font-black text-white/35">{group.title}</p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition ${
                          active
                            ? 'border border-[var(--fi-line)] bg-[rgba(201,168,76,0.16)] text-[var(--fi-gold)]'
                            : 'text-white/62 hover:bg-white/[0.06] hover:text-white'
                        }`}
                      >
                        <Icon className="size-4" />
                        <span className="truncate">{item.title}</span>
                      </Link>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        </nav>

        <div className="border-t border-[var(--fi-line)] p-3">
          <form action="/auth/logout" method="post">
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-white/55 transition hover:bg-red-500/10 hover:text-red-300">
              <LogOut className="size-4" />
              تسجيل الخروج
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}

function labelRole(role: string) {
  const labels: Record<string, string> = {
    super_admin: 'مدير النظام',
    platform_admin: 'مدير المنصة',
    company_owner: 'مالك شركة',
    company_admin: 'مدير شركة',
    admin: 'مدير',
    company: 'شركة',
    broker: 'وسيط عقاري',
    agent: 'وسيط عقاري',
    customer_support: 'خدمة العملاء',
    finance_officer: 'المالية',
  }

  return labels[role] ?? role
}
