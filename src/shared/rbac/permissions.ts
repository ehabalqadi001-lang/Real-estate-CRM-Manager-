import type { AppRole } from '@/shared/auth/types'

export type Permission =
  | 'dashboard.view.own'
  | 'dashboard.view.team'
  | 'dashboard.view.company'
  | 'dashboard.view.platform'
  | 'lead.view.own'
  | 'lead.view.team'
  | 'lead.view.company'
  | 'lead.create'
  | 'lead.assign'
  | 'client.view.assigned'
  | 'client.view.company'
  | 'client.create'
  | 'broker.view.own'
  | 'broker.view.company'
  | 'broker.manage'
  | 'team.view'
  | 'team.manage'
  | 'developer.view'
  | 'developer.manage'
  | 'project.view'
  | 'project.manage'
  | 'unit.view'
  | 'unit.manage'
  | 'listing.view'
  | 'listing.manage'
  | 'deal.view.own'
  | 'deal.view.team'
  | 'deal.view.company'
  | 'deal.create'
  | 'deal.approve'
  | 'commission.view.own'
  | 'commission.view.company'
  | 'commission.manage'
  | 'payout.view.own'
  | 'payout.view.company'
  | 'payout.manage'
  | 'finance.view'
  | 'finance.manage'
  | 'report.view.own'
  | 'report.view.team'
  | 'report.view.company'
  | 'admin.view'
  | 'admin.manage'
  | 'audit.view.company'
  | 'support.view'
  | 'support.manage'
  | 'notification.view.own'
  | 'map.view'
  // ── Fast Investment Granular Permissions ──
  | 'ads.read'
  | 'ads.create'
  | 'ads.update'
  | 'ads.delete'
  | 'ads.approve'
  | 'ads.reject'
  | 'projects.read'
  | 'projects.create'
  | 'projects.update'
  | 'projects.delete'
  | 'transactions.read'
  | 'transactions.create'
  | 'transactions.update'
  | 'transactions.delete'
  | 'transactions.approve_payout'
  | 'transactions.export'
  | 'users.read'
  | 'users.create'
  | 'users.update'
  | 'users.delete'
  | 'users.impersonate'
  | 'users.grant_permissions'
  | 'inventory.read'
  | 'inventory.create'
  | 'inventory.update'
  | 'inventory.delete'
  | 'inventory.import'
  | 'messages.read'
  | 'messages.create'
  | 'messages.broadcast'
  | 'messages.whatsapp'
  | 'commissions.read'
  | 'commissions.update'
  | 'commissions.approve'
  | 'platform.manage'
  | 'platform.audit'
  | 'platform.reports'
  // ── ERP Module Permissions ──
  | 'erp.hr.view'
  | 'erp.hr.manage'
  | 'erp.hr.onboard'
  | 'erp.attendance.use'
  | 'erp.attendance.manage'
  | 'erp.payroll.view'
  | 'erp.payroll.run'
  | 'erp.legal.view'
  | 'erp.legal.manage'
  | 'erp.finance.view'
  | 'erp.finance.manage'

const ALL_COMPANY_PERMISSIONS: Permission[] = [
  'dashboard.view.company',
  'lead.view.company',
  'lead.create',
  'lead.assign',
  'client.view.company',
  'client.create',
  'broker.view.company',
  'broker.manage',
  'team.view',
  'team.manage',
  'developer.view',
  'developer.manage',
  'project.view',
  'project.manage',
  'unit.view',
  'unit.manage',
  'listing.view',
  'listing.manage',
  'deal.view.company',
  'deal.create',
  'deal.approve',
  'commission.view.company',
  'commission.manage',
  'payout.view.company',
  'payout.manage',
  'finance.view',
  'finance.manage',
  'report.view.company',
  'admin.view',
  'admin.manage',
  'audit.view.company',
  'support.view',
  'support.manage',
  'notification.view.own',
  'map.view',
]

export const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  super_admin: ['dashboard.view.platform', 'platform.manage', 'platform.audit', 'platform.reports', ...ALL_COMPANY_PERMISSIONS, 'erp.hr.view', 'erp.hr.manage', 'erp.hr.onboard', 'erp.attendance.use', 'erp.attendance.manage', 'erp.payroll.view', 'erp.payroll.run', 'erp.legal.view', 'erp.legal.manage', 'erp.finance.view', 'erp.finance.manage'],
  platform_admin: ['dashboard.view.platform', 'platform.manage', 'platform.audit', 'platform.reports', 'admin.view', 'audit.view.company', 'report.view.company', 'support.view'],
  company_owner: [...ALL_COMPANY_PERMISSIONS, 'erp.attendance.use'],
  company_admin: [...ALL_COMPANY_PERMISSIONS, 'erp.attendance.use'],
  branch_manager: [
    'dashboard.view.team',
    'lead.view.team',
    'lead.create',
    'lead.assign',
    'client.view.company',
    'client.create',
    'broker.view.company',
    'team.view',
    'team.manage',
    'unit.view',
    'listing.view',
    'deal.view.team',
    'deal.create',
    'commission.view.company',
    'report.view.team',
    'notification.view.own',
    'map.view',
  ],
  senior_agent: [
    'dashboard.view.team',
    'lead.view.team',
    'lead.create',
    'client.view.assigned',
    'client.create',
    'unit.view',
    'listing.view',
    'deal.view.team',
    'deal.create',
    'commission.view.own',
    'report.view.team',
    'notification.view.own',
    'map.view',
  ],
  sales_director: [
    'dashboard.view.company',
    'lead.view.company',
    'lead.create',
    'lead.assign',
    'client.view.company',
    'client.create',
    'broker.view.company',
    'team.view',
    'developer.view',
    'project.view',
    'unit.view',
    'listing.view',
    'deal.view.company',
    'deal.create',
    'deal.approve',
    'commission.view.company',
    'report.view.company',
    'notification.view.own',
    'map.view',
  ],
  team_leader: [
    'dashboard.view.team',
    'lead.view.team',
    'lead.create',
    'lead.assign',
    'client.view.assigned',
    'client.create',
    'unit.view',
    'listing.view',
    'deal.view.team',
    'deal.create',
    'commission.view.own',
    'report.view.team',
    'notification.view.own',
    'map.view',
  ],
  broker: ['dashboard.view.own', 'broker.view.own', 'lead.create', 'unit.view', 'listing.view', 'deal.view.own', 'commission.view.own', 'payout.view.own', 'notification.view.own'],
  freelancer: ['dashboard.view.own', 'lead.view.own', 'lead.create', 'client.view.assigned', 'client.create', 'unit.view', 'listing.view', 'deal.view.own', 'deal.create', 'commission.view.own', 'payout.view.own', 'notification.view.own', 'map.view'],
  buyer_manager: ['dashboard.view.team', 'lead.view.team', 'lead.create', 'client.view.assigned', 'client.create', 'unit.view', 'listing.view', 'deal.view.team', 'report.view.team', 'notification.view.own', 'map.view'],
  seller_resale_manager: ['dashboard.view.team', 'client.view.company', 'client.create', 'listing.view', 'listing.manage', 'deal.view.team', 'deal.create', 'report.view.team', 'notification.view.own', 'map.view'],
  finance_officer: ['dashboard.view.company', 'deal.view.company', 'commission.view.company', 'commission.manage', 'payout.view.company', 'payout.manage', 'finance.view', 'finance.manage', 'report.view.company', 'notification.view.own'],
  hr_manager: ['dashboard.view.company', 'team.view', 'team.manage', 'users.read', 'users.create', 'users.update', 'report.view.company', 'notification.view.own', 'erp.hr.view', 'erp.hr.manage', 'erp.hr.onboard', 'erp.attendance.use', 'erp.attendance.manage', 'erp.payroll.view', 'erp.payroll.run'],
  hr_staff: ['dashboard.view.company', 'team.view', 'users.read', 'users.create', 'report.view.company', 'notification.view.own', 'erp.hr.view', 'erp.hr.onboard', 'erp.attendance.use', 'erp.attendance.manage', 'erp.payroll.view'],
  hr_officer: ['dashboard.view.company', 'team.view', 'team.manage', 'report.view.company', 'notification.view.own', 'erp.hr.view', 'erp.hr.onboard', 'erp.attendance.use', 'erp.attendance.manage', 'erp.payroll.view'],
  customer_support: ['dashboard.view.own', 'client.view.assigned', 'support.view', 'support.manage', 'notification.view.own'],
  developer_relations_manager: ['dashboard.view.team', 'developer.view', 'developer.manage', 'project.view', 'project.manage', 'unit.view', 'unit.manage', 'listing.view', 'report.view.team', 'notification.view.own', 'map.view'],
  admin: ALL_COMPANY_PERMISSIONS,
  company: ALL_COMPANY_PERMISSIONS,
  agent: ['dashboard.view.own', 'lead.view.own', 'lead.create', 'client.view.assigned', 'client.create', 'unit.view', 'listing.view', 'deal.view.own', 'deal.create', 'commission.view.own', 'payout.view.own', 'notification.view.own', 'map.view', 'erp.attendance.use'],
  individual: ['dashboard.view.own', 'lead.create', 'unit.view', 'listing.view', 'deal.create', 'commission.view.own', 'payout.view.own', 'notification.view.own', 'map.view', 'erp.attendance.use'],
  viewer: ['dashboard.view.own', 'notification.view.own'],
  // ── Fast Investment Departmental Roles ──
  ad_reviewer: ['dashboard.view.own', 'ads.read', 'ads.approve', 'ads.reject', 'notification.view.own'],
  ad_manager: ['dashboard.view.company', 'ads.read', 'ads.create', 'ads.update', 'ads.delete', 'ads.approve', 'ads.reject', 'report.view.company', 'notification.view.own'],
  users_am: ['dashboard.view.team', 'users.read', 'users.update', 'ads.read', 'commissions.read', 'projects.read', 'notification.view.own'],
  ads_am: ['dashboard.view.team', 'ads.read', 'ads.create', 'ads.update', 'users.read', 'commissions.read', 'notification.view.own'],
  am_supervisor: ['dashboard.view.company', 'users.read', 'users.create', 'users.update', 'ads.read', 'ads.update', 'commissions.read', 'projects.read', 'report.view.company', 'notification.view.own'],
  collection_rep: ['dashboard.view.own', 'transactions.read', 'transactions.create', 'commissions.read', 'notification.view.own'],
  finance_manager: ['dashboard.view.company', 'transactions.read', 'transactions.create', 'transactions.update', 'transactions.delete', 'transactions.approve_payout', 'transactions.export', 'commissions.read', 'commissions.update', 'commissions.approve', 'finance.view', 'finance.manage', 'payout.view.company', 'payout.manage', 'users.read', 'platform.reports', 'report.view.company', 'notification.view.own', 'erp.finance.view', 'erp.finance.manage', 'erp.payroll.view'],
  inventory_rep: ['dashboard.view.own', 'inventory.read', 'inventory.create', 'inventory.update', 'inventory.import', 'projects.read', 'notification.view.own'],
  data_manager: ['dashboard.view.team', 'inventory.read', 'inventory.create', 'inventory.update', 'inventory.delete', 'inventory.import', 'projects.read', 'projects.create', 'projects.update', 'projects.delete', 'developer.view', 'report.view.team', 'notification.view.own'],
  campaign_specialist: ['dashboard.view.own', 'messages.read', 'messages.create', 'messages.broadcast', 'ads.read', 'users.read', 'notification.view.own'],
  marketing_manager: ['dashboard.view.company', 'messages.read', 'messages.create', 'messages.broadcast', 'messages.whatsapp', 'ads.read', 'users.read', 'platform.reports', 'projects.read', 'report.view.company', 'notification.view.own'],
  cs_agent: ['dashboard.view.own', 'admin.view', 'messages.read', 'messages.create', 'messages.whatsapp', 'users.read', 'ads.read', 'support.view', 'notification.view.own'],
  cs_supervisor: ['dashboard.view.team', 'messages.read', 'messages.create', 'messages.broadcast', 'messages.whatsapp', 'users.read', 'users.update', 'ads.read', 'support.view', 'support.manage', 'report.view.team', 'notification.view.own'],
}

const IMPLIED_PERMISSIONS: Partial<Record<Permission, Permission[]>> = {
  'dashboard.view.platform': ['dashboard.view.company', 'dashboard.view.team', 'dashboard.view.own'],
  'dashboard.view.company': ['dashboard.view.team', 'dashboard.view.own'],
  'dashboard.view.team': ['dashboard.view.own'],
  'lead.view.company': ['lead.view.team', 'lead.view.own'],
  'lead.view.team': ['lead.view.own'],
  'client.view.company': ['client.view.assigned'],
  'deal.view.company': ['deal.view.team', 'deal.view.own'],
  'deal.view.team': ['deal.view.own'],
  'commission.view.company': ['commission.view.own'],
  'payout.view.company': ['payout.view.own'],
  'report.view.company': ['report.view.team', 'report.view.own'],
  'report.view.team': ['report.view.own'],
}

export function hasPermission(role: AppRole, permission: Permission) {
  const granted = ROLE_PERMISSIONS[role] ?? []
  if (granted.includes(permission)) return true

  return granted.some((candidate) => IMPLIED_PERMISSIONS[candidate]?.includes(permission))
}
