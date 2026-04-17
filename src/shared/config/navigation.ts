import {
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  CircleDollarSign,
  ClipboardCheck,
  FileText,
  Handshake,
  Home,
  Landmark,
  LayoutDashboard,
  Map,
  Settings,
  ShieldCheck,
  Ticket,
  Users,
  WalletCards,
} from 'lucide-react'
import type { Permission } from '@/shared/rbac/permissions'

export interface NavigationItem {
  title: string
  href: string
  permission: Permission
  icon: typeof LayoutDashboard
}

export interface NavigationGroup {
  title: string
  items: NavigationItem[]
}

export const dashboardNavigation: NavigationGroup[] = [
  {
    title: 'مركز القيادة',
    items: [
      { title: 'اللوحة التنفيذية', href: '/dashboard', permission: 'dashboard.view.own', icon: LayoutDashboard },
      { title: 'التحليلات والتقارير', href: '/dashboard/reports', permission: 'report.view.own', icon: BarChart3 },
      { title: 'الإشعارات', href: '/dashboard/notifications', permission: 'notification.view.own', icon: Bell },
    ],
  },
  {
    title: 'المبيعات والعملاء',
    items: [
      { title: 'العملاء المحتملون', href: '/dashboard/leads', permission: 'lead.view.own', icon: Users },
      { title: 'العملاء', href: '/dashboard/clients', permission: 'client.view.assigned', icon: Handshake },
      { title: 'الصفقات', href: '/dashboard/deals', permission: 'deal.view.own', icon: Briefcase },
      { title: 'الحجوزات والعقود', href: '/dashboard/contracts', permission: 'deal.view.own', icon: FileText },
    ],
  },
  {
    title: 'الشركاء والفريق',
    items: [
      { title: 'إدارة الوسطاء', href: '/dashboard/brokers', permission: 'broker.view.company', icon: ShieldCheck },
      { title: 'الفريق', href: '/dashboard/team', permission: 'team.view', icon: ClipboardCheck },
    ],
  },
  {
    title: 'المخزون والسوق',
    items: [
      { title: 'المطورون', href: '/dashboard/developers', permission: 'developer.view', icon: Landmark },
      { title: 'المشاريع', href: '/dashboard/projects', permission: 'project.view', icon: Building2 },
      { title: 'الوحدات', href: '/dashboard/inventory/units', permission: 'unit.view', icon: Home },
      { title: 'إعادة البيع', href: '/dashboard/resale', permission: 'listing.view', icon: WalletCards },
      { title: 'الخريطة', href: '/dashboard/map', permission: 'map.view', icon: Map },
    ],
  },
  {
    title: 'المالية',
    items: [
      { title: 'المركز المالي', href: '/dashboard/finance', permission: 'finance.view', icon: CircleDollarSign },
      { title: 'العمولات', href: '/dashboard/commissions', permission: 'commission.view.own', icon: WalletCards },
      { title: 'دفعات الصرف', href: '/dashboard/commissions/payouts', permission: 'payout.view.own', icon: CircleDollarSign },
    ],
  },
  {
    title: 'الإدارة والحوكمة',
    items: [
      { title: 'خدمة العملاء', href: '/admin/customer-service', permission: 'support.view', icon: Ticket },
      { title: 'اعتماد الإعلانات', href: '/admin/ad-approvals', permission: 'admin.view', icon: ShieldCheck },
      { title: 'إدارة النظام', href: '/admin/super-dashboard', permission: 'admin.view', icon: Settings },
      { title: 'سجل العمليات', href: '/dashboard/audit', permission: 'audit.view.company', icon: ClipboardCheck },
    ],
  },
]
