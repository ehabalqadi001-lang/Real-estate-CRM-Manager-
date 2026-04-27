'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Crown,
  LogOut,
  Settings,
  X,
  Zap,
} from 'lucide-react'
import { dashboardNavigation } from '@/shared/config/navigation'
import type { AppProfile } from '@/shared/auth/types'
import { hasPermission } from '@/shared/rbac/permissions'

interface EnterpriseSidebarProps {
  profile: AppProfile
}

// Fixed hrefs shown in the mobile bottom bar — most-used pages
const MOBILE_BOTTOM_HREFS = [
  '/dashboard',
  '/dashboard/leads',
  '/dashboard/deals',
  '/marketplace',
  '/dashboard/commissions',
]

function isActiveRoute(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function EnterpriseSidebar({ profile }: EnterpriseSidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const open = () => setMobileOpen(true)
    window.addEventListener('fi:open-sidebar', open)
    return () => window.removeEventListener('fi:open-sidebar', open)
  }, [])

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const visibleGroups = dashboardNavigation
    .filter((group) => !group.items.every((item) => item.href.startsWith('/admin')))
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          (item.href.startsWith('/dashboard') ||
            item.href.startsWith('/marketplace') ||
            item.href.startsWith('/admin')) &&
          hasPermission(profile.role, item.permission),
      ),
    }))
    .filter((group) => group.items.length > 0)

  const platformGroup = hasPermission(profile.role, 'admin.view')
    ? [
        {
          title: 'المنصة',
          items: [
            {
              title: 'لوحة إدارة المنصة',
              href: '/admin',
              permission: 'admin.view' as const,
              icon: Settings,
            },
          ],
        },
      ]
    : []

  const navigationGroups = [...visibleGroups, ...platformGroup]
  const allNavItems = navigationGroups.flatMap((g) => g.items)

  // Pick the fixed bottom-nav items the user actually has access to
  const mobileItems = MOBILE_BOTTOM_HREFS.map((href) =>
    allNavItems.find((item) => item.href === href),
  ).filter(Boolean) as typeof allNavItems

  const initials = (profile.full_name ?? profile.email ?? 'FI')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const tenantName = profile.tenant_name ?? 'FAST INVESTMENT'
  const tenantLogoUrl = normalizeLogoUrl(profile.tenant_logo_url)
  const tenantLogoStyle = tenantLogoUrl
    ? { backgroundImage: `url(${JSON.stringify(tenantLogoUrl)})` }
    : undefined

  /* ─── Sidebar inner content (shared between desktop + mobile drawer) ─── */
  const SidebarInner = ({
    onNavigate,
    isCollapsed = false,
    onToggleCollapse,
  }: {
    onNavigate?: () => void
    isCollapsed?: boolean
    onToggleCollapse?: () => void
  }) => (
    <div
      className="flex h-full flex-col overflow-hidden"
      // eslint-disable-next-line no-inline-styles/no-inline-styles
      style={{ background: 'linear-gradient(180deg, #0c1a2e 0%, #0f2040 100%)' }}
    >
      {/* ── Logo bar ── */}
      <div
        className={`flex h-[64px] shrink-0 items-center border-b border-white/[0.07] ${
          isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'
        }`}
      >
        {!isCollapsed ? (
          <>
            <Link
              href="/dashboard"
              className="flex min-w-0 flex-1 items-center gap-3"
              onClick={onNavigate}
            >
              <span
                className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-contain bg-center bg-no-repeat"
                style={tenantLogoStyle ?? { background: 'linear-gradient(135deg, #00c27c 0%, #0081cc 100%)' }}
              >
                {!tenantLogoUrl && <Building2 className="size-4 text-white" aria-hidden />}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-black tracking-wide text-white">
                  {tenantName}
                </span>
                <span className="mt-0.5 block truncate text-[10px] font-bold text-white/30">
                  Real Estate Command
                </span>
              </span>
            </Link>
            <span className="flex items-center gap-1 rounded-md border border-emerald-400/20 bg-emerald-400/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-emerald-300">
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="size-1.5 rounded-full bg-emerald-400"
              />
              <Zap className="size-2.5" />
              Live
            </span>
            <button
              onClick={onToggleCollapse}
              title="طي القائمة"
              className="hidden lg:flex size-7 items-center justify-center rounded-lg text-white/25 transition hover:bg-white/[0.06] hover:text-white/60"
            >
              <ChevronLeft className="size-3.5" />
            </button>
          </>
        ) : (
          <button
            onClick={onToggleCollapse}
            title={tenantName}
            className="flex size-9 items-center justify-center overflow-hidden rounded-xl bg-contain bg-center bg-no-repeat"
            style={tenantLogoStyle ?? { background: 'linear-gradient(135deg, #00c27c 0%, #0081cc 100%)' }}
          >
            {!tenantLogoUrl && <Building2 className="size-4 text-white" aria-hidden />}
          </button>
        )}
      </div>

      {/* Expand button (collapsed mode only, desktop) */}
      {isCollapsed && (
        <button
          onClick={onToggleCollapse}
          title="توسيع القائمة"
          className="hidden lg:flex justify-center py-2 text-white/25 transition hover:bg-white/[0.04] hover:text-white/60"
        >
          <ChevronRight className="size-3.5" />
        </button>
      )}

      {/* ── User profile card ── */}
      {!isCollapsed ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, type: 'spring', stiffness: 280, damping: 24 }}
          className="mx-3 mt-3 rounded-xl border border-white/[0.07] bg-white/[0.04] p-3"
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-black text-white shadow-lg"
              // eslint-disable-next-line no-inline-styles/no-inline-styles
              style={{ background: 'linear-gradient(135deg, #00c27c 0%, #0081cc 100%)' }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-black text-white/90">
                {profile.full_name ?? profile.email}
              </p>
              <p className="mt-0.5 truncate text-[10px] font-bold text-white/35">
                {labelRole(profile.role)}
              </p>
            </div>
            <span className="shrink-0 rounded-md border border-emerald-400/20 bg-emerald-400/[0.12] px-1.5 py-0.5 text-[9px] font-black text-emerald-300">
              <Crown className="inline size-2.5 -mt-0.5 mr-0.5" />
              Pro
            </span>
          </div>
          <div className="mt-2.5 rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-[10px] font-bold text-white/40">
            {tenantName}
          </div>
        </motion.div>
      ) : (
        <div className="mx-auto mt-3">
          <div
            className="flex size-9 items-center justify-center rounded-lg text-xs font-black text-white shadow-lg"
            title={profile.full_name ?? profile.email ?? ''}
            // eslint-disable-next-line no-inline-styles/no-inline-styles
            style={{ background: 'linear-gradient(135deg, #00c27c 0%, #0081cc 100%)' }}
          >
            {initials}
          </div>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 no-scrollbar">
        {isCollapsed ? (
          /* Icon-only mode when collapsed */
          <div className="space-y-0.5">
            {allNavItems.map((item) => {
              const Icon = item.icon
              const active = isActiveRoute(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  title={item.title}
                  className={`relative flex justify-center rounded-xl py-2.5 transition-all duration-150 ${
                    active
                      ? 'bg-white/[0.08] text-emerald-400'
                      : 'text-white/40 hover:bg-white/[0.05] hover:text-white/75'
                  }`}
                >
                  {active && (
                    <span className="absolute right-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-l-full bg-emerald-400" />
                  )}
                  <Icon className="size-4 shrink-0" aria-hidden />
                </Link>
              )
            })}
          </div>
        ) : (
          /* Full labeled navigation */
          <div className="space-y-4">
            {navigationGroups.map((group, index) => (
              <SidebarGroup
                key={group.title}
                group={group}
                pathname={pathname}
                defaultOpen={index < 2}
                open={openGroups[group.title]}
                onToggle={() =>
                  setOpenGroups((cur) => ({
                    ...cur,
                    [group.title]: !(cur[group.title] ?? index < 2),
                  }))
                }
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}
      </nav>

      {/* ── Footer ── */}
      <div className="shrink-0 border-t border-white/[0.06] p-2">
        <form action="/auth/logout" method="post">
          <button
            type="submit"
            title={isCollapsed ? 'تسجيل الخروج' : undefined}
            className={`flex min-h-10 w-full items-center rounded-xl px-3 py-2 text-[13px] font-bold text-white/35 transition hover:bg-red-500/[0.08] hover:text-red-400 ${
              isCollapsed ? 'justify-center' : 'gap-3'
            }`}
          >
            <LogOut className="size-4 shrink-0" aria-hidden />
            {!isCollapsed && 'تسجيل الخروج'}
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <>
      {/* ── Desktop sidebar (collapsible) ── */}
      <motion.aside
        initial={{ x: 16, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        className="hidden h-screen shrink-0 overflow-hidden transition-[width,padding] duration-300 ease-in-out lg:block"
        // eslint-disable-next-line no-inline-styles/no-inline-styles
        style={{ width: collapsed ? 68 : 268, padding: collapsed ? 0 : 12 }}
        dir="ltr"
      >
        <div
          className={`h-full overflow-hidden transition-all duration-300 ${
            collapsed ? '' : 'rounded-2xl shadow-[0_28px_80px_rgba(0,0,0,0.28)]'
          }`}
        >
          <SidebarInner
            isCollapsed={collapsed}
            onToggleCollapse={() => setCollapsed((c) => !c)}
          />
        </div>
      </motion.aside>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden" dir="ltr">
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
              aria-hidden
            />
            <motion.aside
              key="drawer"
              initial={{ x: 268 }}
              animate={{ x: 0 }}
              exit={{ x: 268 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="absolute inset-y-0 right-0 flex w-[268px] flex-col shadow-2xl"
            >
              <SidebarInner onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: 0.1 }}
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="إغلاق القائمة"
              className="absolute right-[280px] top-4 flex size-9 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20"
            >
              <X className="size-4" />
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      {/* ── Mobile bottom nav ── */}
      {mobileItems.length > 0 && (
        <nav
          className="fi-bottom-nav fixed inset-x-3 bottom-3 z-50 grid gap-1 rounded-xl p-1 lg:hidden"
          // eslint-disable-next-line no-inline-styles/no-inline-styles
          style={{ gridTemplateColumns: `repeat(${mobileItems.length}, 1fr)` }}
          dir="rtl"
          aria-label="التنقل السريع"
        >
          {mobileItems.map((item) => {
            const Icon = item.icon
            const active = isActiveRoute(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[10px] font-black transition ${
                  active
                    ? 'bg-[var(--fi-soft)] text-[var(--fi-emerald)]'
                    : 'text-[var(--fi-muted)]'
                }`}
              >
                <Icon className="size-4" aria-hidden />
                <span className="max-w-full truncate">{item.title}</span>
              </Link>
            )
          })}
        </nav>
      )}
    </>
  )
}

/* ─── SidebarGroup ─────────────────────────────────────────────────────── */

type SidebarNavigationGroup = (typeof dashboardNavigation)[number]

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
        className="mb-1.5 flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-white/20 transition hover:text-white/40"
      >
        <span className="truncate">{group.title}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="inline-block"
        >
          <ChevronDown className="size-3 shrink-0" aria-hidden />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="group-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-0.5 pb-1">
              {group.items.map((item) => {
                const Icon = item.icon
                const active = isActiveRoute(pathname, item.href)
                return (
                  <motion.div key={item.href} whileHover={{ x: -2 }}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={`group relative flex min-h-10 items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-150 ${
                        active
                          ? 'bg-white/[0.08] text-white'
                          : 'text-white/40 hover:bg-white/[0.05] hover:text-white/75'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="active-pill"
                          className="absolute right-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-l-full bg-emerald-400"
                        />
                      )}
                      <Icon
                        className={`size-4 shrink-0 transition-colors ${
                          active ? 'text-emerald-400' : 'text-white/25 group-hover:text-white/55'
                        }`}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 truncate leading-5">{item.title}</span>
                      {active && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                      )}
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

/* ─── Helpers ──────────────────────────────────────────────────────────── */

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
    super_admin: 'مدير النظام العام',
    platform_admin: 'مدير المنصة',
    company_owner: 'مالك الشركة',
    company_admin: 'مدير الشركة',
    branch_manager: 'مدير الفرع',
    senior_agent: 'وكيل أول',
    hr_manager: 'مدير الموارد البشرية',
    hr_staff: 'موظف HR',
    hr_officer: 'مسؤول HR',
    account_manager: 'Account Manager',
    users_am: 'Account Manager',
    am_supervisor: 'مشرف Account Managers',
    admin: 'مدير',
    company: 'الشركة',
    broker: 'وسيط عقاري',
    agent: 'وكيل مبيعات',
    finance_officer: 'مسؤول مالي',
    finance_manager: 'مدير مالي',
    customer_support: 'دعم العملاء',
    CLIENT: 'عميل',
    client: 'عميل',
  }
  return labels[role] ?? role
}
