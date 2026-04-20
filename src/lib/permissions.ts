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
