'use client'
/* eslint-disable react-hooks/static-components -- Legacy sidebar kept temporarily for compatibility during app-shell migration. */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Briefcase, Building2, Wallet,
  BarChart3, TrendingUp, ClipboardList, Settings, LogOut,
  Kanban, Target, MapPin, UserPlus, ShieldCheck, Star,
  Home, Calculator, FileText, Bell, X, Menu, ChevronRight,
  ChevronLeft
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
      { name: 'المشترون المؤهلون', icon: Users, path: '/dashboard/crm/buyers' },
      { name: 'إدارة الوسطاء', icon: Star, path: '/dashboard/brokers' },
      { name: 'إعادة البيع', icon: Home, path: '/dashboard/resale' },
    ],
  },
  {
    label: 'العقارات',
    items: [
      { name: 'هيكل المشاريع', icon: Building2, path: '/dashboard/projects' },
      { name: 'المشاريع والوحدات', icon: Building2, path: '/dashboard/inventory' },
      { name: 'الوحدات', icon: Home, path: '/dashboard/inventory/units' },
      { name: 'المطورون', icon: Home, path: '/dashboard/developers' },
      { name: 'مقارنة الوحدات', icon: MapPin, path: '/dashboard/compare' },
      { name: 'مطابقة المشترين', icon: Target, path: '/dashboard/matching' },
      { name: 'خريطة العقارات', icon: MapPin, path: '/dashboard/map' },
    ],
  },
  {
    label: 'المالية والتقارير',
    items: [
      { name: 'المركز المالي', icon: TrendingUp, path: '/dashboard/finance' },
      { name: 'المصروفات', icon: Calculator, path: '/dashboard/finance/expenses' },
      { name: 'العمولات', icon: Wallet, path: '/dashboard/commissions' },
      { name: 'دفعات الصرف', icon: Wallet, path: '/dashboard/commissions/payouts' },
      { name: 'قواعد العمولات', icon: Settings, path: '/dashboard/commissions/rules' },
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

const superAdminGroup: NavGroup = {
  label: 'الإدارة العليا',
  items: [{ name: 'لوحة الإدارة العليا', icon: ShieldCheck, path: '/admin/super-dashboard' }],
}

export default function Sidebar() {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>('')
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setIsLoading(false); return }
      supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
        .then(({ data }) => {
          setUserRole(data?.role || 'agent')
          setUserName(data?.full_name || user.email?.split('@')[0] || 'مستخدم')
          setIsLoading(false)
        })
    })
  }, [])

  const isSuperAdmin = ['super_admin', 'Super_Admin'].includes(userRole || '')
  const isLeader = isSuperAdmin || ['company_admin', 'admin', 'Admin', 'company'].includes(userRole || '')
  const groups = isSuperAdmin
    ? [superAdminGroup, ...adminGroups]
    : isLeader ? adminGroups : agentGroups

  const initials = userName
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U'

  const SidebarContent = () => (
    <aside
      dir="rtl"
      className={`bg-[#0C1A2E] text-white flex flex-col h-screen transition-all duration-300 ease-in-out ${
        collapsed ? 'w-[68px]' : 'w-[260px]'
      }`}
    >
      {/* Logo bar */}
      <div className={`flex items-center h-[64px] border-b border-white/[0.06] shrink-0 px-4 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#00C27C] to-[#009F64] flex items-center justify-center shadow-lg shrink-0">
            <Building2 size={15} className="text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-[13px] font-black text-white leading-none tracking-wide">FAST CRM</p>
              <p className="text-[9px] text-white/30 leading-none mt-0.5">Real Estate Platform</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-white/[0.06] text-white/25 hover:text-white/60 transition-colors shrink-0"
          >
            <ChevronLeft size={15} />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="hidden lg:flex justify-center py-3 text-white/25 hover:text-white/60 hover:bg-white/[0.04] transition-colors"
        >
          <ChevronRight size={15} />
        </button>
      )}

      {/* Notification bell (full mode only) */}
      {!collapsed && (
        <div className="mx-3 mt-3 flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          <span className="text-[11px] text-white/40 font-semibold">الإشعارات</span>
          <NotificationBell />
        </div>
      )}

      {/* User profile */}
      {!collapsed && !isLoading && (
        <div className="mx-3 mt-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00C27C] to-[#009F64] flex items-center justify-center text-xs font-black text-white shrink-0 shadow">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white/90 truncate">{userName}</p>
              <p className="text-[10px] text-white/35 mt-0.5">
                {isSuperAdmin ? 'مدير النظام العام' : isLeader ? 'مدير الشركة' : 'وكيل مبيعات'}
              </p>
            </div>
            {isLeader && (
              <span className="text-[9px] bg-[#00C27C]/20 text-[#00C27C] border border-[#00C27C]/20 px-1.5 py-0.5 rounded-md font-black shrink-0">
                Admin
              </span>
            )}
          </div>
        </div>
      )}
      {/* Profile skeleton */}
      {!collapsed && isLoading && (
        <div className="mx-3 mt-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] animate-pulse">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/10 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2.5 bg-white/10 rounded-full w-24" />
              <div className="h-2 bg-white/10 rounded-full w-16" />
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4 no-scrollbar">
        {(isLoading ? [] : groups).map(group => (
          <div key={group.label}>
            {!collapsed && (
              <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.18em] px-3 mb-1.5">
                {group.label}
              </p>
            )}
            {collapsed && <div className="border-t border-white/[0.06] my-1" />}
            <div className="space-y-0.5">
              {group.items.map(item => {
                const isActive = pathname === item.path || pathname.startsWith(item.path + '/')
                const Icon = item.icon
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.name : undefined}
                    className={`flex items-center gap-3 px-3 py-[9px] rounded-xl transition-all duration-150 group relative ${
                      isActive
                        ? 'bg-[#00C27C]/[0.12] text-[#00C27C]'
                        : 'text-white/45 hover:text-white/80 hover:bg-white/[0.04]'
                    } ${collapsed ? 'justify-center' : ''}`}
                  >
                    {isActive && (
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#00C27C] rounded-l-full" />
                    )}
                    <Icon
                      size={16}
                      className={`shrink-0 transition-colors ${
                        isActive ? 'text-[#00C27C]' : 'text-white/30 group-hover:text-white/65'
                      }`}
                    />
                    {!collapsed && (
                      <span className="text-[13px] font-semibold truncate">{item.name}</span>
                    )}
                    {!collapsed && item.badge && (
                      <span className="mr-auto text-[10px] bg-[#00C27C]/20 text-[#00C27C] px-1.5 py-0.5 rounded-md font-bold">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
        {/* Nav skeleton while loading */}
        {isLoading && (
          <div className="space-y-1 animate-pulse px-1">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-9 bg-white/[0.04] rounded-xl" />
            ))}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="px-2 pb-3 border-t border-white/[0.05] pt-2 shrink-0 space-y-0.5">
        <Link
          href="/dashboard/settings"
          className={`flex items-center gap-3 px-3 py-[9px] rounded-xl text-white/35 hover:text-white/70 hover:bg-white/[0.04] transition-all group ${collapsed ? 'justify-center' : ''}`}
        >
          <Settings size={16} className="shrink-0" />
          {!collapsed && <span className="text-[13px] font-semibold">الإعدادات</span>}
        </Link>
        <form action="/auth/logout" method="post">
          <button
            type="submit"
            className={`w-full flex items-center gap-3 px-3 py-[9px] rounded-xl text-white/35 hover:text-red-400 hover:bg-red-500/[0.07] transition-all group ${collapsed ? 'justify-center' : ''}`}
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
      {/* Desktop */}
      <div className="hidden lg:flex h-screen sticky top-0">
        <SidebarContent />
      </div>

      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2.5 bg-[#0C1A2E] rounded-xl border border-white/10 text-white shadow-xl"
      >
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex" dir="rtl">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative flex h-screen">
            <SidebarContent />
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-4 left-4 z-50 bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      )}
    </>
  )
}
