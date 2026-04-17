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
  super_admin: ['dashboard.view.platform', ...ALL_COMPANY_PERMISSIONS],
  platform_admin: ['dashboard.view.platform', 'admin.view', 'audit.view.company', 'report.view.company', 'support.view'],
  company_owner: ALL_COMPANY_PERMISSIONS,
  company_admin: ALL_COMPANY_PERMISSIONS,
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
  hr_officer: ['dashboard.view.company', 'team.view', 'team.manage', 'report.view.company', 'notification.view.own'],
  customer_support: ['dashboard.view.own', 'client.view.assigned', 'support.view', 'support.manage', 'notification.view.own'],
  developer_relations_manager: ['dashboard.view.team', 'developer.view', 'developer.manage', 'project.view', 'project.manage', 'unit.view', 'unit.manage', 'listing.view', 'report.view.team', 'notification.view.own', 'map.view'],
  admin: ALL_COMPANY_PERMISSIONS,
  company: ALL_COMPANY_PERMISSIONS,
  agent: ['dashboard.view.own', 'lead.view.own', 'lead.create', 'client.view.assigned', 'unit.view', 'listing.view', 'deal.view.own', 'deal.create', 'commission.view.own', 'payout.view.own', 'notification.view.own', 'map.view'],
  viewer: ['dashboard.view.own', 'notification.view.own'],
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
