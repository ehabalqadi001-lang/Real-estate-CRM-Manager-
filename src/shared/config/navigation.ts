import {
  BarChart3,
  Bell,
  Bot,
  Briefcase,
  Building2,
  CircleDollarSign,
  ClipboardCheck,
  Database,
  FileText,
  Handshake,
  HeadphonesIcon,
  Home,
  Kanban,
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
    title: 'Command Center',
    items: [
      { title: 'FAST AI Memory', href: '/dashboard/fast-agent', permission: 'broker.manage', icon: Bot },
      { title: 'Executive Dashboard', href: '/dashboard', permission: 'dashboard.view.own', icon: LayoutDashboard },
      { title: 'Company Context', href: '/dashboard/company-context', permission: 'platform.manage', icon: Building2 },
      { title: 'Analytics & Reports', href: '/dashboard/reports', permission: 'report.view.own', icon: BarChart3 },
      { title: 'Notifications', href: '/dashboard/notifications', permission: 'notification.view.own', icon: Bell },
      { title: 'Employee Portal', href: '/dashboard/employee', permission: 'erp.attendance.use', icon: ClipboardCheck },
    ],
  },
  {
    title: 'Sales & Clients',
    items: [
      { title: 'Leads', href: '/dashboard/leads', permission: 'lead.view.own', icon: Users },
      { title: 'Clients', href: '/dashboard/clients', permission: 'client.view.assigned', icon: Handshake },
      { title: 'Deals', href: '/dashboard/deals', permission: 'deal.view.own', icon: Briefcase },
      { title: 'Sales Pipeline', href: '/dashboard/pipeline', permission: 'deal.view.own', icon: Kanban },
      { title: 'Reservations & Contracts', href: '/dashboard/contracts', permission: 'deal.view.own', icon: FileText },
    ],
  },
  {
    title: 'Partners & Team',
    items: [
      { title: 'Partner Relationship Management', href: '/dashboard/partners', permission: 'broker.manage', icon: Handshake },
      { title: 'Broker Management', href: '/dashboard/brokers', permission: 'broker.view.company', icon: ShieldCheck },
      { title: 'Team', href: '/dashboard/team', permission: 'team.view', icon: ClipboardCheck },
      { title: 'Work Cells', href: '/dashboard/cells', permission: 'team.manage', icon: Network },
    ],
  },
  {
    title: 'Inventory & Market',
    items: [
      { title: 'Developers', href: '/dashboard/developers', permission: 'developer.view', icon: Landmark },
      { title: 'Developer Accounts', href: '/dashboard/developer-accounts', permission: 'developer.manage', icon: UserCog },
      { title: 'Developer Integrations', href: '/dashboard/integrations', permission: 'inventory.import', icon: PlugZap },
      { title: 'Projects', href: '/dashboard/projects', permission: 'project.view', icon: Building2 },
      { title: 'Units', href: '/dashboard/inventory/units', permission: 'unit.view', icon: Home },
      { title: 'Resale', href: '/dashboard/resale', permission: 'listing.view', icon: WalletCards },
      { title: 'Map', href: '/dashboard/map', permission: 'map.view', icon: Map },
    ],
  },
  {
    title: 'Finance',
    items: [
      { title: 'Finance Hub', href: '/dashboard/finance', permission: 'finance.view', icon: CircleDollarSign },
      { title: 'Commissions', href: '/dashboard/commissions', permission: 'commission.view.own', icon: WalletCards },
      { title: 'Payouts', href: '/dashboard/commissions/payouts', permission: 'payout.view.own', icon: CircleDollarSign },
    ],
  },
  {
    title: 'Enterprise ERP',
    items: [
      { title: 'HR & Payroll', href: '/dashboard/erp/hr', permission: 'erp.hr.view', icon: Users },
      { title: 'Accounting & Ledger', href: '/dashboard/erp/finance', permission: 'erp.finance.view', icon: BarChart3 },
      { title: 'Legal Contracts & Documents', href: '/dashboard/erp/legal', permission: 'erp.legal.view', icon: Scale },
    ],
  },
  {
    title: 'Operational Departments',
    items: [
      { title: 'Ad Approvals', href: '/admin/ad-approvals', permission: 'ads.approve', icon: ShieldCheck },
      { title: 'Account Management', href: '/admin/account-management', permission: 'users.read', icon: Users },
      { title: 'Finance Vault', href: '/admin/finance-vault', permission: 'finance.view', icon: Vault },
      { title: 'Data Center', href: '/admin/data-entry', permission: 'inventory.read', icon: Database },
      { title: 'Customer Service & Marketing', href: '/admin/cs-marketing', permission: 'messages.read', icon: HeadphonesIcon },
      { title: 'WhatsApp & Calls', href: '/admin/whatsapp', permission: 'messages.read', icon: MessageCircle },
      { title: 'Marketing Campaigns', href: '/admin/cs-marketing', permission: 'messages.broadcast', icon: Megaphone },
    ],
  },
  {
    title: 'Administration & Governance',
    items: [
      { title: 'Legacy Customer Service', href: '/admin/customer-service', permission: 'support.view', icon: Ticket },
      { title: 'System Administration', href: '/admin/super-dashboard', permission: 'admin.view', icon: Settings },
      { title: 'Marketplace Points', href: '/admin/points', permission: 'platform.manage', icon: WalletCards },
      { title: 'Permission Matrix', href: '/admin/super-dashboard/permissions', permission: 'platform.manage', icon: ShieldCheck },
      { title: 'Role Assignment', href: '/admin/super-dashboard/roles', permission: 'platform.manage', icon: ShieldCheck },
      { title: 'Audit Log', href: '/dashboard/audit', permission: 'audit.view.company', icon: ClipboardCheck },
    ],
  },
]
