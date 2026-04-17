'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, LogOut } from 'lucide-react'
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
    <aside className="hidden lg:flex h-screen w-[280px] shrink-0 flex-col border-l border-slate-200 bg-[#071426] text-white" dir="rtl">
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500">
            <Building2 size={18} />
          </div>
          <div>
            <p className="text-sm font-black leading-none">FAST CRM</p>
            <p className="mt-1 text-[11px] text-white/45">Enterprise Operating System</p>
          </div>
        </div>
      </div>

      <div className="mx-3 mt-3 rounded-lg border border-white/10 bg-white/[0.04] p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-xs font-black">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{profile.full_name ?? profile.email}</p>
            <p className="mt-0.5 text-[11px] text-white/45">{profile.role}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-5">
          {visibleGroups.map((group) => (
            <section key={group.title}>
              <p className="mb-2 px-2 text-[11px] font-bold text-white/35">{group.title}</p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                        active ? 'bg-emerald-500/15 text-emerald-300' : 'text-white/60 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon size={17} />
                      <span className="truncate">{item.title}</span>
                    </Link>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </nav>

      <div className="border-t border-white/10 p-3">
        <form action="/auth/logout" method="post">
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-white/55 transition hover:bg-red-500/10 hover:text-red-300">
            <LogOut size={17} />
            تسجيل الخروج
          </button>
        </form>
      </div>
    </aside>
  )
}

