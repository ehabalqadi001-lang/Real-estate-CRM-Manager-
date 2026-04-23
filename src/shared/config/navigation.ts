import {
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  CircleDollarSign,
  ClipboardCheck,
  Database,
  FileText,
  Handshake,
  HeadphonesIcon,
  Home,
  Landmark,
  LayoutDashboard,
  Map,
  Megaphone,
  MessageCircle,
  Network,
  PlugZap,
  Scale,
  Settings,
  ShieldCheck,
  Ticket,
  UserCog,
  Users,
  Vault,
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
      { title: 'سياق الشركة', href: '/dashboard/company-context', permission: 'platform.manage', icon: Building2 },
      { title: 'التحليلات والتقارير', href: '/dashboard/reports', permission: 'report.view.own', icon: BarChart3 },
      { title: 'الإشعارات', href: '/dashboard/notifications', permission: 'notification.view.own', icon: Bell },
      { title: 'بوابة الموظف', href: '/dashboard/employee', permission: 'erp.attendance.use', icon: ClipboardCheck },
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
      { title: 'إدارة علاقات الشركاء', href: '/dashboard/partners', permission: 'broker.manage', icon: Handshake },
      { title: 'إدارة الوسطاء', href: '/dashboard/brokers', permission: 'broker.view.company', icon: ShieldCheck },
      { title: 'الفريق', href: '/dashboard/team', permission: 'team.view', icon: ClipboardCheck },
      { title: 'خلايا العمل', href: '/dashboard/cells', permission: 'team.manage', icon: Network },
    ],
  },
  {
    title: 'المخزون والسوق',
    items: [
      { title: 'المطورون', href: '/dashboard/developers', permission: 'developer.view', icon: Landmark },
      { title: 'صلاحيات المطورين', href: '/dashboard/developer-accounts', permission: 'developer.manage', icon: UserCog },
      { title: 'تكاملات المطورين', href: '/dashboard/integrations', permission: 'inventory.import', icon: PlugZap },
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
    title: 'وحدات ERP المؤسسية',
    items: [
      { title: 'الموارد البشرية والرواتب', href: '/dashboard/erp/hr', permission: 'erp.hr.view', icon: Users },
      { title: 'المحاسبة ودفتر الأستاذ', href: '/dashboard/erp/finance', permission: 'erp.finance.view', icon: BarChart3 },
      { title: 'العقود والوثائق القانونية', href: '/dashboard/erp/legal', permission: 'erp.legal.view', icon: Scale },
    ],
  },
  {
    title: 'الأقسام التشغيلية',
    items: [
      { title: 'اعتماد الإعلانات', href: '/admin/ad-approvals', permission: 'ads.approve', icon: ShieldCheck },
      { title: 'إدارة الحسابات', href: '/admin/account-management', permission: 'users.read', icon: Users },
      { title: 'خزينة التمويل', href: '/admin/finance-vault', permission: 'finance.view', icon: Vault },
      { title: 'مركز البيانات', href: '/admin/data-entry', permission: 'inventory.read', icon: Database },
      { title: 'خدمة العملاء والتسويق', href: '/admin/cs-marketing', permission: 'messages.read', icon: HeadphonesIcon },
      { title: 'واتساب والاتصالات', href: '/admin/whatsapp', permission: 'messages.read', icon: MessageCircle },
      { title: 'الحملات التسويقية', href: '/admin/cs-marketing', permission: 'messages.broadcast', icon: Megaphone },
    ],
  },
  {
    title: 'الإدارة والحوكمة',
    items: [
      { title: 'خدمة العملاء القديمة', href: '/admin/customer-service', permission: 'support.view', icon: Ticket },
      { title: 'إدارة النظام', href: '/admin/super-dashboard', permission: 'admin.view', icon: Settings },
      { title: 'نقاط Marketplace', href: '/admin/points', permission: 'platform.manage', icon: WalletCards },
      { title: 'مصفوفة الصلاحيات', href: '/admin/super-dashboard/permissions', permission: 'platform.manage', icon: ShieldCheck },
      { title: 'تعيين الأدوار الوظيفية', href: '/admin/super-dashboard/roles', permission: 'platform.manage', icon: ShieldCheck },
      { title: 'سجل العمليات', href: '/dashboard/audit', permission: 'audit.view.company', icon: ClipboardCheck },
    ],
  },
]
