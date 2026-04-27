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
    <div className="flex h-full flex-col overflow-hidden bg-white dark:bg-slate-950 border-r border-[var(--fi-line)]">
      {/* ── Logo bar ── */}
      <div
        className={`flex h-[64px] shrink-0 items-center border-b border-[var(--fi-line)] ${
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
                className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-contain bg-center bg-no-repeat shadow-sm border border-[var(--fi-line)]"
                style={tenantLogoStyle ?? { background: 'linear-gradient(135deg, #00c27c 0%, #0081cc 100%)' }}
              >
                {!tenantLogoUrl && <Building2 className="size-4 text-white" aria-hidden />}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-black tracking-wide text-slate-900 dark:text-white">
                  {tenantName}
                </span>
                <span className="mt-0.5 block truncate text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  Real Estate Command
                </span>
              </span>
            </Link>
            <button
              onClick={onToggleCollapse}
              title="طي القائمة"
              className="hidden lg:flex size-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            >
              <ChevronLeft className="size-4" />
            </button>
          </>
        ) : (
          <button
            onClick={onToggleCollapse}
            title={tenantName}
            className="flex size-9 items-center justify-center overflow-hidden rounded-xl bg-contain bg-center bg-no-repeat shadow-sm border border-[var(--fi-line)]"
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
          className="hidden lg:flex justify-center py-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        >
          <ChevronRight className="size-4" />
        </button>
      )}

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 no-scrollbar">
        {isCollapsed ? (
          /* Icon-only mode when collapsed */
          <div className="space-y-1">
            {allNavItems.map((item) => {
              const Icon = item.icon
              const active = isActiveRoute(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  title={item.title}
                  className={`relative flex justify-center rounded-xl py-3 transition-all duration-150 ${
                    active
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white'
                  }`}
                >
                  {active && (
                    <span className="absolute right-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-l-full bg-emerald-500" />
                  )}
                  <Icon className="size-5 shrink-0" aria-hidden />
                </Link>
              )
            })}
          </div>
        ) : (
          /* Full labeled navigation */
          <div className="space-y-6">
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
    </div>
  )

  return (
    <>
      {/* ── Desktop sidebar (collapsible) ── */}
      <motion.aside
        initial={{ x: 16, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        className="hidden h-screen shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out lg:block bg-white dark:bg-slate-950"
        // eslint-disable-next-line no-inline-styles/no-inline-styles
        style={{ width: collapsed ? 72 : 280 }}
        dir="ltr"
      >
        <div className="h-full overflow-hidden">
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
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
              aria-hidden
            />
            <motion.aside
              key="drawer"
              initial={{ x: 280 }}
              animate={{ x: 0 }}
              exit={{ x: 280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="absolute inset-y-0 right-0 flex w-[280px] flex-col shadow-2xl bg-white dark:bg-slate-950"
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
              className="absolute right-[292px] top-4 flex size-10 items-center justify-center rounded-xl bg-white text-slate-900 shadow-md hover:bg-slate-50 dark:bg-slate-800 dark:text-white"
            >
              <X className="size-5" />
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      {/* ── Mobile bottom nav ── */}
      {mobileItems.length > 0 && (
        <nav
          className="fi-bottom-nav fixed inset-x-3 bottom-3 z-50 grid gap-1 rounded-xl p-1 lg:hidden border border-[var(--fi-line)] bg-white/90 backdrop-blur-md shadow-lg dark:bg-slate-950/90"
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
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                    : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
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
        className="mb-1 flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-300"
      >
        <span className="truncate">{group.title}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="inline-block"
        >
          <ChevronDown className="size-3.5 shrink-0" aria-hidden />
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
            <div className="space-y-1 pb-1 pt-1">
              {group.items.map((item) => {
                const Icon = item.icon
                const active = isActiveRoute(pathname, item.href)
                return (
                  <motion.div key={item.href} whileHover={{ x: -2 }}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={`group relative flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-150 ${
                        active
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="active-pill"
                          className="absolute right-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-l-full bg-emerald-500"
                        />
                      )}
                      <Icon
                        className={`size-4 shrink-0 transition-colors ${
                          active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300'
                        }`}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 truncate">{item.title}</span>
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
