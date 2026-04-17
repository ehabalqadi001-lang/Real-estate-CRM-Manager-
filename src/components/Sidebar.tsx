'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Briefcase, Building2, Wallet,
  BarChart3, TrendingUp, ClipboardList, Settings, LogOut,
  ChevronDown, Kanban, Target, MapPin, UserPlus,
  ShieldCheck, Star, Home, Calculator, FileText, Bell, X, Menu
} from 'lucide-react'
import NotificationBell from '@/components/notifications/NotificationBell'
import { createBrowserClient } from '@supabase/ssr'

interface NavItem {
  name: string
  icon: React.ElementType
  path: string
  badge?: string
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const adminGroups: NavGroup[] = [
  {
    label: 'الرئيسية',
    items: [
      { name: 'لوحة القيادة', icon: LayoutDashboard, path: '/company/dashboard' },
    ],
  },
  {
    label: 'المبيعات والعملاء',
    items: [
      { name: 'العملاء المحتملون', icon: Users, path: '/dashboard/leads' },
      { name: 'الصفقات', icon: Briefcase, path: '/dashboard/deals' },
      { name: 'Kanban الصفقات', icon: Kanban, path: '/dashboard/deals/kanban' },
      { name: 'إدارة الوسطاء', icon: Star, path: '/dashboard/brokers' },
    ],
  },
  {
    label: 'العقارات',
    items: [
      { name: 'المشاريع والوحدات', icon: Building2, path: '/dashboard/inventory' },
      { name: 'المطورون', icon: Home, path: '/dashboard/developers' },
      { name: 'مقارنة الوحدات', icon: MapPin, path: '/dashboard/compare' },
    ],
  },
  {
    label: 'المالية والتقارير',
    items: [
      { name: 'العمولات', icon: Wallet, path: '/dashboard/commissions' },
      { name: 'الأهداف', icon: Target, path: '/dashboard/targets' },
      { name: 'التنبؤ بالمبيعات', icon: TrendingUp, path: '/dashboard/forecasting' },
      { name: 'التقارير والتحليلات', icon: BarChart3, path: '/dashboard/analytics' },
      { name: 'الحاسبة المالية', icon: Calculator, path: '/dashboard/calculator' },
    ],
  },
  {
    label: 'الإدارة',
    items: [
      { name: 'أداء الفريق', icon: BarChart3, path: '/dashboard/performance' },
      { name: 'العقود', icon: FileText, path: '/dashboard/contracts' },
      { name: 'الإشعارات', icon: Bell, path: '/dashboard/notifications' },
      { name: 'سجل العمليات', icon: ClipboardList, path: '/dashboard/audit' },
      { name: 'إضافة وكيل', icon: UserPlus, path: '/company/agents/add' },
    ],
  },
]

const agentGroups: NavGroup[] = [
  {
    label: 'الرئيسية',
    items: [
      { name: 'مساحة عملي', icon: LayoutDashboard, path: '/dashboard/agent' },
    ],
  },
  {
    label: 'المبيعات',
    items: [
      { name: 'العملاء المحتملون', icon: Users, path: '/dashboard/leads' },
      { name: 'الصفقات', icon: Briefcase, path: '/dashboard/deals' },
      { name: 'Kanban الصفقات', icon: Kanban, path: '/dashboard/deals/kanban' },
    ],
  },
  {
    label: 'العقارات',
    items: [
      { name: 'المشاريع والوحدات', icon: Building2, path: '/dashboard/inventory' },
    ],
  },
  {
    label: 'أدائي',
    items: [
      { name: 'عمولاتي', icon: Wallet, path: '/dashboard/commissions' },
      { name: 'إشعاراتي', icon: Bell, path: '/dashboard/notifications' },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>('')
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
        .then(({ data }) => {
          setUserRole(data?.role || 'agent')
          setUserName(data?.full_name || user.email?.split('@')[0] || 'مستخدم')
        })
    })
  }, [])

  const isSuperAdmin = ['super_admin', 'Super_Admin'].includes(userRole || '')
  const isLeader = isSuperAdmin || ['company_admin', 'admin', 'Admin', 'company'].includes(userRole || '')

  // Super admins see the full admin menu plus a super-admin section
  const superAdminGroup: NavGroup = {
    label: 'الإدارة العليا',
    items: [{ name: 'لوحة الإدارة العليا', icon: ShieldCheck, path: '/admin/super-dashboard' }],
  }
  const groups = isSuperAdmin
    ? [superAdminGroup, ...adminGroups]
    : isLeader
    ? adminGroups
    : agentGroups

  const initials = userName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U'

  const SidebarContent = () => (
    <aside
      className={`bg-[#0f1117] text-white flex flex-col h-screen border-l border-white/[0.06] transition-all duration-300 ${
        collapsed ? 'w-[70px]' : 'w-[260px]'
      }`}
      dir="rtl"
    >
      {/* Logo area */}
      <div className="flex items-center justify-between px-4 h-[60px] border-b border-white/[0.06] shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-900/30">
              <Building2 size={14} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-black text-white leading-none">FAST CRM</p>
              <p className="text-[9px] text-white/30 leading-none mt-0.5">Real Estate Platform</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          {!collapsed && <NotificationBell />}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/70 transition-colors hidden lg:flex"
          >
            <Menu size={15} />
          </button>
        </div>
      </div>

      {/* User profile card */}
      {!collapsed && (
        <div className="mx-3 mt-3 mb-1 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-black text-white shrink-0 shadow">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white/90 truncate">{userName}</p>
              <p className="text-[10px] text-white/30">
                {isLeader ? 'مدير النظام' : 'وكيل مبيعات'}
              </p>
            </div>
            {isLeader && (
              <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded-md font-bold shrink-0">
                Admin
              </span>
            )}
          </div>
        </div>
      )}

      {/* Navigation groups */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-4 no-scrollbar">
        {groups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="text-[10px] font-bold text-white/25 uppercase tracking-[0.12em] px-3 mb-1.5">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.path || pathname.startsWith(item.path + '/')
                const Icon = item.icon
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.name : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group relative ${
                      isActive
                        ? 'bg-blue-600/15 text-blue-400'
                        : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
                    } ${collapsed ? 'justify-center' : ''}`}
                  >
                    {isActive && (
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-500 rounded-l-full" />
                    )}
                    <Icon
                      size={16}
                      className={`shrink-0 transition-colors ${
                        isActive ? 'text-blue-400' : 'text-white/40 group-hover:text-white/70'
                      }`}
                    />
                    {!collapsed && (
                      <span className="text-[13px] font-semibold truncate">{item.name}</span>
                    )}
                    {!collapsed && item.badge && (
                      <span className="mr-auto text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded-md font-bold">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 pb-3 space-y-0.5 border-t border-white/[0.06] pt-2 shrink-0">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-all group"
        >
          <Settings size={16} className="shrink-0" />
          {!collapsed && <span className="text-[13px] font-semibold">الإعدادات</span>}
        </Link>
        <form action="/auth/logout" method="post">
          <button
            type="submit"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/5 transition-all group ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut size={16} className="shrink-0" />
            {!collapsed && <span className="text-[13px] font-semibold">تسجيل الخروج</span>}
          </button>
        </form>
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex h-screen sticky top-0">
        <SidebarContent />
      </div>

      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-[#0f1117] rounded-xl border border-white/10 text-white shadow-lg"
      >
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative flex h-screen">
            <SidebarContent />
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-4 left-4 z-50 text-white/50 hover:text-white p-1"
          >
            <X size={20} />
          </button>
        </div>
      )}
    </>
  )
}
