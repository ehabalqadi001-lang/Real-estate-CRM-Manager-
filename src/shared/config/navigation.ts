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
  titleKey?: string
  href: string
  permission: Permission
  icon: typeof LayoutDashboard
}

export interface NavigationGroup {
  title: string
  titleKey?: string
  items: NavigationItem[]
}

export const dashboardNavigation: NavigationGroup[] = [
  {
    title: 'لوحة القيادة',
    titleKey: 'dashboard',
    items: [
      { title: 'الرئيسية', titleKey: 'home', href: '/dashboard', permission: 'dashboard.view.own', icon: LayoutDashboard },
      { title: 'التحليلات والتقارير', titleKey: 'analytics', href: '/dashboard/analytics', permission: 'report.view.own', icon: BarChart3 },
      { title: 'التنبؤ بالمبيعات', titleKey: 'forecasting', href: '/dashboard/forecasting', permission: 'report.view.own', icon: TrendingUp },
      { title: 'الإشعارات', titleKey: 'notifications', href: '/dashboard/notifications', permission: 'notification.view.own', icon: Bell },
      { title: 'بوابة الموظف', titleKey: 'employeePortal', href: '/dashboard/employee', permission: 'erp.attendance.use', icon: ClipboardCheck },
      { title: 'سياق الشركة', titleKey: 'companyContext', href: '/dashboard/company-context', permission: 'platform.manage', icon: Building2 },
    ],
  },
  {
    title: 'المبيعات والعملاء',
    titleKey: 'salesClients',
    items: [
      { title: 'العملاء المحتملون', titleKey: 'leads', href: '/dashboard/leads', permission: 'lead.view.own', icon: Users },
      { title: 'العملاء', titleKey: 'clients', href: '/dashboard/clients', permission: 'client.view.assigned', icon: Handshake },
      { title: 'الصفقات', titleKey: 'deals', href: '/dashboard/deals', permission: 'deal.view.own', icon: Briefcase },
      { title: 'خطابات النية EOI', titleKey: 'eoi', href: '/dashboard/eoi', permission: 'deal.view.own', icon: ClipboardList },
      { title: 'الحجوزات', titleKey: 'reservations', href: '/dashboard/reservations', permission: 'deal.view.own', icon: Bookmark },
      { title: 'خط المبيعات', titleKey: 'pipeline', href: '/dashboard/pipeline', permission: 'deal.view.own', icon: Kanban },
      { title: 'العقود والحجوزات', titleKey: 'contracts', href: '/dashboard/contracts', permission: 'deal.view.own', icon: FileText },
      { title: 'الأنشطة', titleKey: 'activities', href: '/dashboard/activities', permission: 'deal.view.own', icon: ClipboardCheck },
      { title: 'الجدول الزمني', titleKey: 'schedule', href: '/dashboard/schedule', permission: 'deal.view.own', icon: Calendar },
    ],
  },
  {
    title: 'الشركاء والفريق',
    titleKey: 'partnersTeam',
    items: [
      { title: 'إدارة علاقات الشركاء', titleKey: 'partners', href: '/dashboard/partners', permission: 'broker.manage', icon: Handshake },
      { title: 'إدارة الوسطاء', titleKey: 'brokers', href: '/dashboard/brokers', permission: 'broker.view.company', icon: ShieldCheck },
      { title: 'بوابة Account Manager', titleKey: 'accountManager', href: '/dashboard/account-manager', permission: 'account_manager.view_portfolio', icon: UserCheck },
      { title: 'تعيين مديري الحسابات', titleKey: 'assignManagers', href: '/dashboard/hr/assign-managers', permission: 'broker.assign_manager', icon: UserCog },
      { title: 'أداء الفريق', titleKey: 'performance', href: '/dashboard/performance', permission: 'report.view.own', icon: BarChart3 },
      { title: 'الفريق', titleKey: 'team', href: '/dashboard/team', permission: 'team.view', icon: Users },
      { title: 'مجموعات العمل', titleKey: 'cells', href: '/dashboard/cells', permission: 'team.manage', icon: Network },
    ],
  },
  {
    title: 'المخزون والسوق',
    titleKey: 'inventoryMarket',
    items: [
      { title: 'المطورون', titleKey: 'developers', href: '/dashboard/developers', permission: 'developer.view', icon: Landmark },
      { title: 'حسابات المطورين', titleKey: 'developerAccounts', href: '/dashboard/developer-accounts', permission: 'developer.manage', icon: UserCog },
      { title: 'تكاملات المطورين', titleKey: 'integrations', href: '/dashboard/integrations', permission: 'inventory.import', icon: PlugZap },
      { title: 'المشاريع', titleKey: 'projects', href: '/dashboard/projects', permission: 'project.view', icon: Building2 },
      { title: 'الوحدات', titleKey: 'units', href: '/dashboard/inventory/units', permission: 'unit.view', icon: Home },
      { title: 'مقارنة الوحدات', titleKey: 'compare', href: '/dashboard/compare', permission: 'unit.view', icon: Scale },
      { title: 'مطابقة المشترين', titleKey: 'matching', href: '/dashboard/matching', permission: 'unit.view', icon: Shuffle },
      { title: 'إعادة البيع', titleKey: 'resale', href: '/dashboard/resale', permission: 'listing.view', icon: WalletCards },
      { title: 'خريطة العقارات', titleKey: 'map', href: '/dashboard/map', permission: 'map.view', icon: Map },
    ],
  },
  {
    title: 'المالية',
    titleKey: 'finance',
    items: [
      { title: 'المركز المالي', titleKey: 'finance', href: '/dashboard/finance', permission: 'finance.view', icon: CircleDollarSign },
      { title: 'العمولات', titleKey: 'commissions', href: '/dashboard/commissions', permission: 'commission.view.own', icon: WalletCards },
      { title: 'دفعات الصرف', titleKey: 'payouts', href: '/dashboard/commissions/payouts', permission: 'payout.view.own', icon: CircleDollarSign },
      { title: 'الأهداف', titleKey: 'targets', href: '/dashboard/targets', permission: 'report.view.own', icon: TrendingUp },
      { title: 'الحاسبة المالية', titleKey: 'calculator', href: '/dashboard/calculator', permission: 'dashboard.view.own', icon: Calculator },
    ],
  },
  {
    title: 'ERP المؤسسي',
    titleKey: 'erp',
    items: [
      { title: 'نظرة عامة ERP', titleKey: 'erpOverview', href: '/dashboard/erp', permission: 'erp.hr.view', icon: Building2 },
      { title: 'الموارد البشرية', titleKey: 'hr', href: '/dashboard/erp/hr', permission: 'erp.hr.view', icon: Users },
      { title: 'دليل الموظفين', titleKey: 'employees', href: '/dashboard/erp/hr/employees', permission: 'erp.hr.view', icon: UserSearch },
      { title: 'الحضور والانصراف', titleKey: 'attendance', href: '/dashboard/erp/hr/attendance', permission: 'erp.attendance.manage', icon: CalendarDays },
      { title: 'إدارة الإجازات', titleKey: 'leaves', href: '/dashboard/erp/hr/leaves', permission: 'erp.hr.view', icon: CalendarOff },
      { title: 'مسيرة الرواتب', titleKey: 'payroll', href: '/dashboard/erp/hr/payroll', permission: 'erp.payroll.view', icon: WalletCards },
      { title: 'عمولات HR', titleKey: 'hrCommission', href: '/dashboard/erp/hr/commission', permission: 'erp.hr.view', icon: BadgeDollarSign },
      { title: 'استقطاب المواهب', titleKey: 'talent', href: '/dashboard/erp/hr/talent', permission: 'erp.hr.manage', icon: UserSearch },
      { title: 'استقبال الموظفين', titleKey: 'onboarding', href: '/dashboard/erp/hr/onboarding', permission: 'erp.hr.manage', icon: ClipboardList },
      { title: 'تقييمات الأداء', titleKey: 'performanceReviews', href: '/dashboard/erp/hr/performance', permission: 'erp.hr.manage', icon: BarChart3 },
      { title: 'وثائق الموظفين', titleKey: 'documents', href: '/dashboard/erp/hr/documents', permission: 'erp.hr.manage', icon: FileText },
      { title: 'الأكاديمية L&D', titleKey: 'academy', href: '/dashboard/erp/hr/academy', permission: 'erp.hr.view', icon: GraduationCap },
      { title: 'الذكاء البشري', titleKey: 'hrbp', href: '/dashboard/erp/hr/hrbp', permission: 'erp.hr.manage', icon: Brain },
      { title: 'تحليلات HR', titleKey: 'hrAnalytics', href: '/dashboard/erp/hr/analytics', permission: 'erp.hr.view', icon: BarChart3 },
      { title: 'المحاسبة والأستاذ', titleKey: 'accounting', href: '/dashboard/erp/finance', permission: 'erp.finance.view', icon: BarChart3 },
      { title: 'دليل الحسابات', titleKey: 'chartOfAccounts', href: '/dashboard/erp/finance/accounts', permission: 'erp.finance.view', icon: BookOpen },
      { title: 'العقود القانونية', titleKey: 'legal', href: '/dashboard/erp/legal', permission: 'erp.legal.view', icon: Scale },
    ],
  },
  {
    title: 'الأقسام التشغيلية',
    titleKey: 'operations',
    items: [
      { title: 'واتساب والمكالمات', titleKey: 'whatsapp', href: '/dashboard/whatsapp', permission: 'messages.whatsapp', icon: MessageCircle },
      { title: 'سجل العمليات', titleKey: 'audit', href: '/dashboard/audit', permission: 'audit.view.company', icon: ClipboardCheck },
      { title: 'الإعدادات', titleKey: 'settings', href: '/dashboard/settings', permission: 'dashboard.view.own', icon: Settings },
    ],
  },
  {
    title: 'السوق العقاري',
    titleKey: 'realEstateMarket',
    items: [
      { title: 'تصفح السوق', titleKey: 'marketplace', href: '/marketplace', permission: 'dashboard.view.own', icon: Store },
      { title: 'ملفي في السوق', titleKey: 'myMarketplace', href: '/marketplace/profile', permission: 'dashboard.view.own', icon: UserCheck },
      { title: 'شراء نقاط', titleKey: 'buyPoints', href: '/marketplace/buy-points', permission: 'dashboard.view.own', icon: Coins },
      { title: 'إضافة إعلان', titleKey: 'addProperty', href: '/marketplace/add-property', permission: 'dashboard.view.own', icon: Store },
    ],
  },
  {
    title: 'Marketplace Hub (Admin)',
    titleKey: 'marketplaceAdmin',
    items: [
      { title: 'مراجعة الإعلانات', titleKey: 'adModeration', href: '/admin/marketplace/moderation', permission: 'ads.read', icon: ShieldCheck },
      { title: 'إدارة الإعلانات', titleKey: 'adManagement', href: '/admin/marketplace/ads', permission: 'admin.view', icon: LayoutDashboard },
      { title: 'العملاء 360°', titleKey: 'clients360', href: '/admin/marketplace/clients', permission: 'admin.view', icon: Users },
      { title: 'الواجهة والمظهر', titleKey: 'appearance', href: '/admin/marketplace/appearance', permission: 'platform.manage', icon: Settings },
      { title: 'النقاط والمحافظ', titleKey: 'pointsWallets', href: '/admin/points', permission: 'platform.manage', icon: Coins },
    ],
  },
]
