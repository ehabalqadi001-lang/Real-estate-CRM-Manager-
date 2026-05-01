import {
  BarChart3,
  BadgeDollarSign,
  Bell,
  BookOpen,
  Bookmark,
  Brain,
  Briefcase,
  Building2,
  Calculator,
  Calendar,
  CalendarDays,
  CalendarOff,
  CircleDollarSign,
  ClipboardCheck,
  ClipboardList,
  Coins,
  FileText,
  GraduationCap,
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
  Store,
  TrendingUp,
  UserCheck,
  UserCog,
  UserSearch,
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
      { title: 'خطابات النية EOI', href: '/dashboard/eoi', permission: 'deal.view.own', icon: ClipboardList },
      { title: 'الحجوزات', href: '/dashboard/reservations', permission: 'deal.view.own', icon: Bookmark },
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
      { title: 'نظرة عامة ERP', href: '/dashboard/erp', permission: 'erp.hr.view', icon: Building2 },
      { title: 'الموارد البشرية', href: '/dashboard/erp/hr', permission: 'erp.hr.view', icon: Users },
      { title: 'دليل الموظفين', href: '/dashboard/erp/hr/employees', permission: 'erp.hr.view', icon: UserSearch },
      { title: 'الحضور والانصراف', href: '/dashboard/erp/hr/attendance', permission: 'erp.attendance.manage', icon: CalendarDays },
      { title: 'إدارة الإجازات', href: '/dashboard/erp/hr/leaves', permission: 'erp.hr.view', icon: CalendarOff },
      { title: 'مسيرة الرواتب', href: '/dashboard/erp/hr/payroll', permission: 'erp.payroll.view', icon: WalletCards },
      { title: 'عمولات HR', href: '/dashboard/erp/hr/commission', permission: 'erp.hr.view', icon: BadgeDollarSign },
      { title: 'استقطاب المواهب', href: '/dashboard/erp/hr/talent', permission: 'erp.hr.manage', icon: UserSearch },
      { title: 'استقبال الموظفين', href: '/dashboard/erp/hr/onboarding', permission: 'erp.hr.manage', icon: ClipboardList },
      { title: 'تقييمات الأداء', href: '/dashboard/erp/hr/performance', permission: 'erp.hr.manage', icon: BarChart3 },
      { title: 'وثائق الموظفين', href: '/dashboard/erp/hr/documents', permission: 'erp.hr.manage', icon: FileText },
      { title: 'الأكاديمية L&D', href: '/dashboard/erp/hr/academy', permission: 'erp.hr.view', icon: GraduationCap },
      { title: 'الذكاء البشري', href: '/dashboard/erp/hr/hrbp', permission: 'erp.hr.manage', icon: Brain },
      { title: 'تحليلات HR', href: '/dashboard/erp/hr/analytics', permission: 'erp.hr.view', icon: BarChart3 },
      { title: 'المحاسبة والأستاذ', href: '/dashboard/erp/finance', permission: 'erp.finance.view', icon: BarChart3 },
      { title: 'دليل الحسابات', href: '/dashboard/erp/finance/accounts', permission: 'erp.finance.view', icon: BookOpen },
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
  {
    title: 'السوق العقاري',
    items: [
      { title: 'تصفح السوق', href: '/marketplace', permission: 'dashboard.view.own', icon: Store },
      { title: 'ملفي في السوق', href: '/marketplace/profile', permission: 'dashboard.view.own', icon: UserCheck },
      { title: 'شراء نقاط', href: '/marketplace/buy-points', permission: 'dashboard.view.own', icon: Coins },
      { title: 'إضافة إعلان', href: '/marketplace/add-property', permission: 'dashboard.view.own', icon: Store },
    ],
  },
  {
    title: 'Marketplace Hub (Admin)',
    items: [
      { title: 'مراجعة الإعلانات', href: '/admin/marketplace/moderation', permission: 'ads.read', icon: ShieldCheck },
      { title: 'إدارة الإعلانات', href: '/admin/marketplace/ads', permission: 'admin.view', icon: LayoutDashboard },
      { title: 'العملاء 360°', href: '/admin/marketplace/clients', permission: 'admin.view', icon: Users },
      { title: 'الواجهة والمظهر', href: '/admin/marketplace/appearance', permission: 'platform.manage', icon: Settings },
      { title: 'النقاط والمحافظ', href: '/admin/points', permission: 'platform.manage', icon: Coins },
    ],
  },
]
