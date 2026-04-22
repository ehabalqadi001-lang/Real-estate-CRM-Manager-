import type { User } from '@supabase/supabase-js'

export type AppRole =
  | 'super_admin'
  | 'platform_admin'
  | 'company_owner'
  | 'company_admin'
  | 'branch_manager'
  | 'senior_agent'
  | 'sales_director'
  | 'team_leader'
  | 'hr_manager'
  | 'hr_staff'
  | 'broker'
  | 'freelancer'
  | 'buyer_manager'
  | 'seller_resale_manager'
  | 'finance_officer'
  | 'hr_officer'
  | 'customer_support'
  | 'developer_relations_manager'
  | 'ad_reviewer'
  | 'ad_manager'
  | 'users_am'
  | 'ads_am'
  | 'am_supervisor'
  | 'collection_rep'
  | 'finance_manager'
  | 'inventory_rep'
  | 'data_manager'
  | 'campaign_specialist'
  | 'marketing_manager'
  | 'cs_agent'
  | 'cs_supervisor'
  | 'admin'
  | 'company'
  | 'agent'
  | 'individual'
  | 'viewer'

export const MANAGER_ROLES: AppRole[] = [
  'super_admin',
  'platform_admin',
  'company_owner',
  'company_admin',
  'branch_manager',
  'sales_director',
  'team_leader',
  'hr_manager',
  'admin',
  'company',
]

export const HR_ROLES: AppRole[] = [
  'super_admin',
  'platform_admin',
  'company_owner',
  'company_admin',
  'hr_manager',
  'hr_staff',
  'hr_officer',
]

export const BROKER_ROLES: AppRole[] = [
  'broker',
  'freelancer',
  'senior_agent',
  'agent',
]

export const FINANCE_ROLES: AppRole[] = [
  'finance_officer',
  'finance_manager',
  'company_owner',
  'company_admin',
  'super_admin',
  'admin',
  'company',
]

export const INVENTORY_WRITE_ROLES: AppRole[] = [
  'super_admin',
  'platform_admin',
  'company_owner',
  'company_admin',
  'sales_director',
  'admin',
  'company',
]

export function isManagerRole(role: AppRole | string | null | undefined): boolean {
  return MANAGER_ROLES.includes(role as AppRole)
}

export function isHrRole(role: AppRole | string | null | undefined): boolean {
  return HR_ROLES.includes(role as AppRole)
}

export function isBrokerRole(role: AppRole | string | null | undefined): boolean {
  return BROKER_ROLES.includes(role as AppRole)
}

export function isSuperAdmin(role: AppRole | string | null | undefined): boolean {
  return role === 'super_admin' || role === 'platform_admin'
}

export interface AppProfile {
  id: string
  company_id: string | null
  tenant_id?: string | null
  tenant_name?: string | null
  tenant_logo_url?: string | null
  tenant_primary_brand_color?: string | null
  full_name: string | null
  email?: string | null
  role: AppRole
  account_type?: string | null
  status?: string | null
  is_active?: boolean | null
}

export interface AppSession {
  user: User
  profile: AppProfile
}
