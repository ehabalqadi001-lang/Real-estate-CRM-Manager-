'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Building2, ChevronDown, Crown, LogOut, Settings, X } from 'lucide-react'
import { dashboardNavigation } from '@/shared/config/navigation'
import type { AppProfile } from '@/shared/auth/types'
import { hasPermission } from '@/shared/rbac/permissions'

interface EnterpriseSidebarProps {
  profile: AppProfile
}

export function EnterpriseSidebar({ profile }: EnterpriseSidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const open = () => setMobileOpen(true)
    window.addEventListener('fi:open-sidebar', open)
    return () => window.removeEventListener('fi:open-sidebar', open)
  }, [])

  const visibleGroups = dashboardNavigation
    .filter((group) => !group.items.every((item) => item.href.startsWith('/admin')))
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.href.startsWith('/dashboard') && hasPermission(profile.role, item.permission)),
    }))
    .filter((group) => group.items.length > 0)

  const platformGroup = hasPermission(profile.role, 'admin.view')
    ? [{
      title: 'نظام المنصة',
      items: [{ title: 'لوحة مالك المنصة', href: '/admin', permission: 'admin.view' as const, icon: Settings }],
    }]
    : []

  const navigationGroups = [...visibleGroups, ...platformGroup]
  const mobileItems = navigationGroups.flatMap((group) => group.items).slice(0, 5)
  const initials = (profile.full_name ?? profile.email ?? 'FI')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const tenantName = profile.tenant_name ?? 'FAST INVESTMENT'
  const tenantLogoUrl = normalizeLogoUrl(profile.tenant_logo_url)
  const tenantLogoStyle = tenantLogoUrl ? { backgroundImage: `url(${JSON.stringify(tenantLogoUrl)})` } : undefined

  return (
    <>
      <aside className="hidden h-screen w-[292px] shrink-0 p-4 lg:block" dir="rtl">
        <div className="fi-glass flex h-full flex-col overflow-hidden rounded-lg border border-[var(--fi-line)]">
          <div className="border-b border-[var(--fi-line)] p-4">
            <Link href="/dashboard" className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center overflow-hidden rounded-lg bg-[var(--fi-soft)] bg-contain bg-center bg-no-repeat text-[var(--fi-emerald)]" style={tenantLogoStyle}>
                {!tenantLogoUrl && <Building2 className="size-5" aria-hidden="true" />}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-black tracking-wide text-[var(--fi-ink)]">{tenantName}</span>
                <span className="mt-0.5 block truncate text-[11px] font-bold text-[var(--fi-muted)]">لوحة CRM</span>
              </span>
            </Link>
          </div>

          <div className="mx-4 mt-4 rounded-lg border border-[var(--fi-line)] bg-white/70 p-3 dark:bg-white/5">
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
              <Crown className="size-3.5" aria-hidden="true" />
              مساحة عمل {tenantName}
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <div className="space-y-5">
              {navigationGroups.map((group, index) => (
                <SidebarGroup
                  key={group.title}
                  group={group}
                  pathname={pathname}
                  defaultOpen={index < 2}
                  open={openGroups[group.title]}
                  onToggle={() => setOpenGroups((current) => ({ ...current, [group.title]: !(current[group.title] ?? index < 2) }))}
                />
              ))}
            </div>
          </nav>

          <div className="border-t border-[var(--fi-line)] p-3">
            <form action="/auth/logout" method="post">
              <button className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-[var(--fi-muted)] transition hover:bg-red-50 hover:text-[var(--fi-danger)]">
                <LogOut className="size-4" aria-hidden="true" />
                تسجيل الخروج
              </button>
            </form>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" dir="rtl">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <aside className="absolute inset-y-0 end-0 flex w-[280px] flex-col bg-[var(--fi-paper)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--fi-line)] p-4">
              <span className="text-sm font-black text-[var(--fi-ink)]">القائمة الرئيسية</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="إغلاق القائمة"
                className="flex size-9 items-center justify-center rounded-lg text-[var(--fi-muted)] hover:bg-[var(--fi-soft)]"
              >
                <X className="size-4" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <div className="space-y-5">
                {navigationGroups.map((group, index) => (
                  <SidebarGroup
                    key={group.title}
                    group={group}
                    pathname={pathname}
                    defaultOpen={index < 2}
                    open={openGroups[group.title]}
                    onToggle={() => setOpenGroups((current) => ({ ...current, [group.title]: !(current[group.title] ?? index < 2) }))}
                    onNavigate={() => setMobileOpen(false)}
                  />
                ))}
              </div>
            </nav>
            <div className="border-t border-[var(--fi-line)] p-3">
              <form action="/auth/logout" method="post">
                <button className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-[var(--fi-muted)] transition hover:bg-red-50 hover:text-[var(--fi-danger)]">
                  <LogOut className="size-4" aria-hidden="true" />
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
              <Icon className="size-4" aria-hidden="true" />
              <span className="max-w-full truncate">{item.title}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}

type SidebarNavigationGroup = typeof dashboardNavigation[number]

function SidebarGroup({
  group,
  pathname,
  defaultOpen,
  open,
  onToggle,
  onNavigate,
}: {
  group: SidebarNavigationGroup
  pathname: string
  defaultOpen: boolean
  open: boolean | undefined
  onToggle: () => void
  onNavigate?: () => void
}) {
  const isOpen = open ?? defaultOpen

  return (
    <section>
      <button
        type="button"
        onClick={onToggle}
        className="mb-2 flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[11px] font-black text-[var(--fi-muted)] transition hover:bg-[var(--fi-soft)] hover:text-[var(--fi-ink)]"
      >
        <span className="truncate">{group.title}</span>
        <ChevronDown className={`size-3.5 transition ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="space-y-1">
          {group.items.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`group flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition ${
                  active
                    ? 'bg-[var(--fi-soft)] text-[var(--fi-emerald)] shadow-sm'
                    : 'text-[var(--fi-muted)] hover:bg-slate-50 hover:text-[var(--fi-ink)] dark:hover:bg-white/5'
                }`}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate leading-5">{item.title}</span>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}

function normalizeLogoUrl(url: string | null | undefined) {
  if (!url) return null
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : null
  } catch {
    return null
  }
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
