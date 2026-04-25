import {
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  Calculator,
  Calendar,
  CircleDollarSign,
  ClipboardCheck,
  FileText,
  Handshake,
  Home,
  Kanban,
  Landmark,
  LayoutDashboard,
  Map,
  MessageCircle,
  Network,
  PlugZap,
  Scale,
  Settings,
  ShieldCheck,
  Shuffle,
  TrendingUp,
  UserCheck,
  UserCog,
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
    title: 'لوحة القيادة',
    items: [
      { title: 'الرئيسية', href: '/dashboard', permission: 'dashboard.view.own', icon: LayoutDashboard },
      { title: 'التحليلات والتقارير', href: '/dashboard/analytics', permission: 'report.view.own', icon: BarChart3 },
      { title: 'التنبؤ بالمبيعات', href: '/dashboard/forecasting', permission: 'report.view.own', icon: TrendingUp },
      { title: 'الإشعارات', href: '/dashboard/notifications', permission: 'notification.view.own', icon: Bell },
      { title: 'بوابة الموظف', href: '/dashboard/employee', permission: 'erp.attendance.use', icon: ClipboardCheck },
      { title: 'سياق الشركة', href: '/dashboard/company-context', permission: 'platform.manage', icon: Building2 },
    ],
  },
  {
    title: 'المبيعات والعملاء',
    items: [
      { title: 'العملاء المحتملون', href: '/dashboard/leads', permission: 'lead.view.own', icon: Users },
      { title: 'العملاء', href: '/dashboard/clients', permission: 'client.view.assigned', icon: Handshake },
      { title: 'الصفقات', href: '/dashboard/deals', permission: 'deal.view.own', icon: Briefcase },
      { title: 'خط المبيعات', href: '/dashboard/pipeline', permission: 'deal.view.own', icon: Kanban },
      { title: 'العقود والحجوزات', href: '/dashboard/contracts', permission: 'deal.view.own', icon: FileText },
      { title: 'الأنشطة', href: '/dashboard/activities', permission: 'deal.view.own', icon: ClipboardCheck },
      { title: 'الجدول الزمني', href: '/dashboard/schedule', permission: 'deal.view.own', icon: Calendar },
    ],
  },
  {
    title: 'الشركاء والفريق',
    items: [
      { title: 'إدارة علاقات الشركاء', href: '/dashboard/partners', permission: 'broker.manage', icon: Handshake },
      { title: 'إدارة الوسطاء', href: '/dashboard/brokers', permission: 'broker.view.company', icon: ShieldCheck },
      { title: 'بوابة Account Manager', href: '/dashboard/account-manager', permission: 'account_manager.view_portfolio', icon: UserCheck },
      { title: 'تعيين مديري الحسابات', href: '/dashboard/hr/assign-managers', permission: 'broker.assign_manager', icon: UserCog },
      { title: 'أداء الفريق', href: '/dashboard/performance', permission: 'report.view.own', icon: BarChart3 },
      { title: 'الفريق', href: '/dashboard/team', permission: 'team.view', icon: Users },
      { title: 'مجموعات العمل', href: '/dashboard/cells', permission: 'team.manage', icon: Network },
    ],
  },
  {
    title: 'المخزون والسوق',
    items: [
      { title: 'المطورون', href: '/dashboard/developers', permission: 'developer.view', icon: Landmark },
      { title: 'حسابات المطورين', href: '/dashboard/developer-accounts', permission: 'developer.manage', icon: UserCog },
      { title: 'تكاملات المطورين', href: '/dashboard/integrations', permission: 'inventory.import', icon: PlugZap },
      { title: 'المشاريع', href: '/dashboard/projects', permission: 'project.view', icon: Building2 },
      { title: 'الوحدات', href: '/dashboard/inventory/units', permission: 'unit.view', icon: Home },
      { title: 'مقارنة الوحدات', href: '/dashboard/compare', permission: 'unit.view', icon: Scale },
      { title: 'مطابقة المشترين', href: '/dashboard/matching', permission: 'unit.view', icon: Shuffle },
      { title: 'إعادة البيع', href: '/dashboard/resale', permission: 'listing.view', icon: WalletCards },
      { title: 'خريطة العقارات', href: '/dashboard/map', permission: 'map.view', icon: Map },
    ],
  },
  {
    title: 'المالية',
    items: [
      { title: 'المركز المالي', href: '/dashboard/finance', permission: 'finance.view', icon: CircleDollarSign },
      { title: 'العمولات', href: '/dashboard/commissions', permission: 'commission.view.own', icon: WalletCards },
      { title: 'دفعات الصرف', href: '/dashboard/commissions/payouts', permission: 'payout.view.own', icon: CircleDollarSign },
      { title: 'الأهداف', href: '/dashboard/targets', permission: 'report.view.own', icon: TrendingUp },
      { title: 'الحاسبة المالية', href: '/dashboard/calculator', permission: 'dashboard.view.own', icon: Calculator },
    ],
  },
  {
    title: 'ERP المؤسسي',
    items: [
      { title: 'الموارد البشرية', href: '/dashboard/erp/hr', permission: 'erp.hr.view', icon: Users },
      { title: 'المحاسبة والأستاذ', href: '/dashboard/erp/finance', permission: 'erp.finance.view', icon: BarChart3 },
      { title: 'العقود القانونية', href: '/dashboard/erp/legal', permission: 'erp.legal.view', icon: Scale },
    ],
  },
  {
    title: 'الأقسام التشغيلية',
    items: [
      { title: 'واتساب والمكالمات', href: '/dashboard/whatsapp', permission: 'messages.whatsapp', icon: MessageCircle },
      { title: 'سجل العمليات', href: '/dashboard/audit', permission: 'audit.view.company', icon: ClipboardCheck },
      { title: 'الإعدادات', href: '/dashboard/settings', permission: 'dashboard.view.own', icon: Settings },
    ],
  },
]
