export type Role = 'super_admin' | 'company_admin' | 'branch_manager' | 'senior_agent' | 'agent' | 'individual' | 'viewer'
export type ResourceAction = 'read' | 'write' | 'delete'

export const ROLE_RANK: Record<Role, number> = {
  viewer: 0,
  individual: 1,
  agent: 2,
  senior_agent: 3,
  branch_manager: 4,
  company_admin: 5,
  super_admin: 6,
}

export const PERMISSIONS = {
  'deals:read': ['viewer', 'individual', 'agent', 'senior_agent', 'branch_manager', 'company_admin', 'super_admin'],
  'deals:write': ['agent', 'senior_agent', 'branch_manager', 'company_admin', 'super_admin'],
  'deals:delete': ['company_admin', 'super_admin'],
  'clients:read': ['viewer', 'individual', 'agent', 'senior_agent', 'branch_manager', 'company_admin', 'super_admin'],
  'clients:write': ['agent', 'senior_agent', 'branch_manager', 'company_admin', 'super_admin'],
  'clients:delete': ['branch_manager', 'company_admin', 'super_admin'],
  'inventory:read': ['viewer', 'individual', 'agent', 'senior_agent', 'branch_manager', 'company_admin', 'super_admin'],
  'inventory:write': ['branch_manager', 'company_admin', 'super_admin'],
  'commissions:read': ['individual', 'agent', 'senior_agent', 'branch_manager', 'company_admin', 'super_admin'],
  'commissions:write': ['agent', 'senior_agent', 'branch_manager', 'company_admin', 'super_admin'],
  'commissions:approve': ['company_admin', 'super_admin'],
  'commissions:delete': ['company_admin', 'super_admin'],
  'team:read': ['agent', 'senior_agent', 'branch_manager', 'company_admin', 'super_admin'],
  'team:manage': ['branch_manager', 'company_admin', 'super_admin'],
  'team:delete': ['company_admin', 'super_admin'],
  'admin:access': ['super_admin'],
  'company:access': ['branch_manager', 'company_admin', 'super_admin'],
  'analytics:read': ['senior_agent', 'branch_manager', 'company_admin', 'super_admin'],
  'settings:write': ['company_admin', 'super_admin'],
} as const satisfies Record<string, readonly Role[]>

export type Permission = keyof typeof PERMISSIONS

export function hasPermission(role: string | null | undefined, permission: Permission | string) {
  if (!role) return false
  const allowed = PERMISSIONS[permission as Permission] as readonly Role[] | undefined
  return Boolean(allowed?.includes(normalizeRole(role)))
}

export function normalizeRole(role: string): Role {
  if (role === 'admin' || role === 'company' || role === 'company_owner') return 'company_admin'
  if (role === 'broker' || role === 'freelancer') return 'agent'
  if (role === 'team_leader') return 'branch_manager'
  if (role === 'platform_admin') return 'super_admin'
  if (['super_admin', 'company_admin', 'branch_manager', 'senior_agent', 'agent', 'individual', 'viewer'].includes(role)) return role as Role
  return 'viewer'
}

export function canAccess(role: string | null | undefined, resource: string, action: ResourceAction) {
  return hasPermission(role, `${resource}:${action}`)
}

export function isAtLeast(role: string | null | undefined, minimum: Role) {
  if (!role) return false
  return ROLE_RANK[normalizeRole(role)] >= ROLE_RANK[minimum]
}

export function canManageRole(actorRole: string | null | undefined, targetRole: string | null | undefined) {
  if (!actorRole || !targetRole) return false
  const actor = normalizeRole(actorRole)
  const target = normalizeRole(targetRole)
  if (actor === 'super_admin') return target !== 'super_admin'
  if (actor === 'company_admin') return ROLE_RANK[target] < ROLE_RANK.company_admin
  if (actor === 'branch_manager') return ROLE_RANK[target] < ROLE_RANK.branch_manager
  return false
}

export function canAssignRole(actorRole: string | null | undefined, nextRole: string | null | undefined) {
  if (!actorRole || !nextRole) return false
  const actor = normalizeRole(actorRole)
  const next = normalizeRole(nextRole)
  if (actor === 'super_admin') return next !== 'super_admin'
  if (actor === 'company_admin') return ROLE_RANK[next] < ROLE_RANK.company_admin
  if (actor === 'branch_manager') return ROLE_RANK[next] < ROLE_RANK.branch_manager
  return false
}

export function canManageTeam(actorRole: string | null | undefined) {
  return hasPermission(actorRole, 'team:manage')
}
