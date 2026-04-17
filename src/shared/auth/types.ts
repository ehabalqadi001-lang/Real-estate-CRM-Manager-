import type { User } from '@supabase/supabase-js'

export type AppRole =
  | 'super_admin'
  | 'platform_admin'
  | 'company_owner'
  | 'company_admin'
  | 'sales_director'
  | 'team_leader'
  | 'broker'
  | 'freelancer'
  | 'buyer_manager'
  | 'seller_resale_manager'
  | 'finance_officer'
  | 'hr_officer'
  | 'customer_support'
  | 'developer_relations_manager'
  | 'admin'
  | 'company'
  | 'agent'
  | 'viewer'

export interface AppProfile {
  id: string
  company_id: string | null
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

