import type { User } from '@supabase/supabase-js'

// ─── أدوار النظام الكاملة ────────────────────────────────────────────
// الأدوار الحديثة (v2) — تتطابق مع قاعدة البيانات
export type AppRole =
  // إدارة المنصة
  | 'super_admin'
  | 'platform_admin'
  // إدارة الشركة
  | 'company_owner'
  | 'company_admin'
  | 'branch_manager'
  | 'senior_agent'
  | 'sales_director'
  | 'team_leader'
  // الوسطاء والمبيعات
  | 'broker'
  | 'freelancer'
  | 'buyer_manager'
  | 'seller_resale_manager'
  // الدعم والتشغيل
  | 'finance_officer'
  | 'hr_officer'
  | 'customer_support'
  | 'developer_relations_manager'
  // ── Fast Investment Departmental Roles ──
  // Ad Approvals
  | 'ad_reviewer'
  | 'ad_manager'
  // Account Management
  | 'users_am'
  | 'ads_am'
  | 'am_supervisor'
  // Finance
  | 'collection_rep'
  | 'finance_manager'
  // Data Entry
  | 'inventory_rep'
  | 'data_manager'
  // Marketing
  | 'campaign_specialist'
  | 'marketing_manager'
  // Customer Service
  | 'cs_agent'
  | 'cs_supervisor'
  // أدوار قديمة للتوافق مع الكود الموجود
  | 'admin'    // = company_admin (legacy)
  | 'company'  // = company_owner (legacy)
  | 'agent'    // = broker (legacy)
  | 'individual'
  | 'viewer'

// مجموعات الأدوار للتحقق السريع
export const MANAGER_ROLES: AppRole[] = [
  'super_admin', 'platform_admin', 'company_owner', 'company_admin',
  'branch_manager', 'sales_director', 'team_leader', 'admin', 'company',
]

export const BROKER_ROLES: AppRole[] = [
  'broker', 'freelancer', 'senior_agent', 'agent',
]

export const FINANCE_ROLES: AppRole[] = [
  'finance_officer', 'company_owner', 'company_admin', 'super_admin', 'admin', 'company',
]

export const INVENTORY_WRITE_ROLES: AppRole[] = [
  'super_admin', 'platform_admin', 'company_owner', 'company_admin',
  'sales_director', 'admin', 'company',
]

export function isManagerRole(role: AppRole | string | null | undefined): boolean {
  return MANAGER_ROLES.includes(role as AppRole)
}

export function isBrokerRole(role: AppRole | string | null | undefined): boolean {
  return BROKER_ROLES.includes(role as AppRole)
}

export function isSuperAdmin(role: AppRole | string | null | undefined): boolean {
  return role === 'super_admin' || role === 'platform_admin'
}

// ─── Profile ────────────────────────────────────────────────────────
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

// ─── Session ────────────────────────────────────────────────────────
export interface AppSession {
  user: User
  profile: AppProfile
}
