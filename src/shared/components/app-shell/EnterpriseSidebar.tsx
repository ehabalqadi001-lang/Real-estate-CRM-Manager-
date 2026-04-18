'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Building2, Crown, LogOut, X } from 'lucide-react'
import { dashboardNavigation } from '@/shared/config/navigation'
import type { AppProfile } from '@/shared/auth/types'
import { hasPermission } from '@/shared/rbac/permissions'

interface EnterpriseSidebarProps {
  profile: AppProfile
}

export function EnterpriseSidebar({ profile }: EnterpriseSidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const open = () => setMobileOpen(true)
    window.addEventListener('fi:open-sidebar', open)
    return () => window.removeEventListener('fi:open-sidebar', open)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const visibleGroups = dashboardNavigation
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasPermission(profile.role, item.permission)),
    }))
    .filter((group) => group.items.length > 0)

  const mobileItems = visibleGroups.flatMap((group) => group.items).slice(0, 5)

  const initials = (profile.full_name ?? profile.email ?? 'FI')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <>
      <aside className="hidden h-screen w-[292px] shrink-0 p-4 lg:block" dir="rtl">
        <div className="fi-glass flex h-full flex-col overflow-hidden rounded-lg">
          <div className="border-b border-[var(--fi-line)] p-4">
            <Link href="/dashboard" className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-lg bg-[var(--fi-soft)] text-[var(--fi-emerald)]">
                <Building2 className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-black tracking-wide text-[var(--fi-ink)]">FAST INVESTMENT</span>
                <span className="mt-0.5 block truncate text-[11px] font-bold text-[var(--fi-muted)]">Enterprise CRM</span>
              </span>
            </Link>
          </div>

          <div className="mx-4 mt-4 rounded-lg border border-[var(--fi-line)] bg-white/70 p-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg text-xs font-black text-white" style={{ background: 'var(--fi-gradient-primary)' }}>
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-[var(--fi-ink)]">{profile.full_name ?? profile.email}</p>
                <p className="mt-0.5 truncate text-[11px] font-bold text-[var(--fi-muted)]">{labelRole(profile.role)}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-[var(--fi-soft)] px-3 py-2 text-[11px] font-bold text-[var(--fi-emerald)]">
              <Crown className="size-3.5" />
              FAST Workspace
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <div className="space-y-5">
              {visibleGroups.map((group) => (
                <section key={group.title}>
                  <p className="mb-2 px-2 text-[11px] font-black text-[var(--fi-muted)]">{group.title}</p>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon
                      const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`group flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition ${
                            active
                              ? 'bg-[var(--fi-soft)] text-[var(--fi-emerald)] shadow-sm'
                              : 'text-[var(--fi-muted)] hover:bg-slate-50 hover:text-[var(--fi-ink)]'
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
              <button className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-[var(--fi-muted)] transition hover:bg-red-50 hover:text-[var(--fi-danger)]">
                <LogOut className="size-4" />
                تسجيل الخروج
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Mobile full-screen drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" dir="rtl">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <aside className="absolute inset-y-0 end-0 flex w-[280px] flex-col bg-[var(--fi-paper)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--fi-line)] p-4">
              <span className="text-sm font-black text-[var(--fi-ink)]">القائمة الرئيسية</span>
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="إغلاق القائمة" className="flex size-9 items-center justify-center rounded-lg hover:bg-[var(--fi-soft)] text-[var(--fi-muted)]">
                <X className="size-4" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <div className="space-y-5">
                {visibleGroups.map((group) => (
                  <section key={group.title}>
                    <p className="mb-2 px-2 text-[11px] font-black text-[var(--fi-muted)]">{group.title}</p>
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const Icon = item.icon
                        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition ${
                              active
                                ? 'bg-[var(--fi-soft)] text-[var(--fi-emerald)] shadow-sm'
                                : 'text-[var(--fi-muted)] hover:bg-slate-50 hover:text-[var(--fi-ink)]'
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
                <button className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-[var(--fi-muted)] transition hover:bg-red-50 hover:text-[var(--fi-danger)]">
                  <LogOut className="size-4" />
                  تسجيل الخروج
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}

      <nav className="fi-bottom-nav fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 gap-1 rounded-lg p-1 lg:hidden" dir="rtl">
        {mobileItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[10px] font-black transition ${
                active ? 'bg-[var(--fi-soft)] text-[var(--fi-emerald)]' : 'text-[var(--fi-muted)]'
              }`}
            >
              <Icon className="size-4" />
              <span className="max-w-full truncate">{item.title}</span>
            </Link>
          )
        })}
      </nav>
    </>
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
    CLIENT: 'عميل',
    client: 'عميل',
  }

  return labels[role] ?? role
}
