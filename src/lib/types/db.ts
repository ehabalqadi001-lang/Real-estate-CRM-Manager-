// Database TypeScript interfaces — generated from actual Supabase schema
// Last sync: 2026-04-17

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type UserRole =
  | 'super_admin' | 'Super_Admin'
  | 'admin'       | 'Admin'
  | 'company_admin'| 'company'
  | 'branch_manager'
  | 'senior_agent'
  | 'agent'
  | 'broker'
  | 'developer_user'

export type LeadStatus =
  | 'Fresh Leads' | 'fresh'
  | 'Contacted'
  | 'Interested'
  | 'Site Visit'
  | 'Negotiation'
  | 'Contracted'
  | 'Not Interested'
  | 'Follow Up'
  | 'Won'
  | 'Lost'

export type LeadTemperature = 'hot' | 'warm' | 'cold'
export type DealStage = 'New' | 'Negotiation' | 'Contracted' | 'Registration' | 'Handover' | 'Lost' | 'contract_signed'
export type UnitStatus = 'available' | 'reserved' | 'sold' | 'under_offer'
export type PayoutStatus = 'draft' | 'pending_approval' | 'approved' | 'paid' | 'cancelled'
export type ExpenseCategory = 'rent' | 'salary' | 'marketing' | 'utilities' | 'travel' | 'other'

// ─── PROFILES ────────────────────────────────────────────────────
export interface Profile {
  id: string
  full_name: string | null
  role: UserRole | null
  status: string | null
  account_type: string | null
  phone: string | null
  region: string | null
  company_name: string | null
  company_id: string | null
  national_id: string | null
  hire_date: string | null
  is_active: boolean
  created_at: string
}

// ─── LEADS ───────────────────────────────────────────────────────
export interface Lead {
  id: string
  client_name: string | null
  full_name: string | null
  name: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  source: string | null
  status: LeadStatus | null
  temperature: LeadTemperature | null
  assigned_to: string | null
  user_id: string | null
  company_id: string | null
  property_type: string | null
  expected_value: number | null
  budget: number | null
  score: number | null
  lead_score: number | null
  district: string | null
  interest: string | null
  notes: string | null
  next_followup_date: string | null
  created_at: string
  updated_at: string | null
}

// ─── BUYER REQUIREMENTS ──────────────────────────────────────────
export interface BuyerRequirement {
  id: string
  lead_id: string | null
  company_id: string | null
  min_budget: number | null
  max_budget: number | null
  property_types: string[] | null
  preferred_areas: string[] | null
  min_area_sqm: number | null
  max_area_sqm: number | null
  min_bedrooms: number | null
  max_bedrooms: number | null
  finishing: string[] | null
  payment_type: string | null
  max_down_payment: number | null
  max_installment_years: number | null
  purpose: string | null
  timeline: string | null
  notes: string | null
  created_at: string
  updated_at: string | null
}

// ─── LEAD ACTIVITIES ─────────────────────────────────────────────
export interface LeadActivity {
  id: string
  lead_id: string
  user_id: string
  type: 'call' | 'meeting' | 'note' | 'whatsapp' | 'email' | 'site_visit' | 'status_change'
  outcome: string | null
  note: string | null
  duration_min: number | null
  scheduled_at: string | null
  created_at: string
  profiles?: Pick<Profile, 'full_name'>
}

// ─── DEVELOPERS ──────────────────────────────────────────────────
export interface Developer {
  id: string
  name: string
  city: string | null
  email: string | null
  phone: string | null
  license_number: string | null
  region: string | null
  class_grade: string | null
  contract_end_date: string | null
  created_at: string
}

// ─── PROJECTS ────────────────────────────────────────────────────
export interface Project {
  id: string
  name: string
  developer_id: string | null
  company_id: string | null
  location: string | null
  city: string | null
  total_units: number | null
  available_units: number | null
  min_price: number | null
  max_price: number | null
  delivery_year: number | null
  project_type: string | null
  status: string | null
  images: string[] | null
  description: string | null
  amenities: string[] | null
  commission_pct: number | null
  lat: number | null
  lng: number | null
  cover_image: string | null
  created_at: string
  updated_at: string | null
  developers?: Pick<Developer, 'name'>
}

// ─── UNITS ───────────────────────────────────────────────────────
export interface Unit {
  id: string
  project_id: string | null
  unit_number: string | null
  floor: number | null
  unit_type: string | null
  area_sqm: number | null
  bedrooms: number | null
  bathrooms: number | null
  price: number | null
  status: UnitStatus | null
  finishing: string | null
  view: string | null
  features: string[] | null
  images: string[] | null
  reserved_by: string | null
  reserved_at: string | null
  created_at: string
  updated_at: string | null
  projects?: Pick<Project, 'name' | 'commission_pct'>
}

// ─── DEALS ───────────────────────────────────────────────────────
export interface Deal {
  id: string
  lead_id: string | null
  unit_id: string | null
  agent_id: string | null
  company_id: string | null
  title: string | null
  client_name: string | null
  buyer_name: string | null
  developer_name: string | null
  project_name: string | null
  property_type: string | null
  stage: DealStage | null
  status: string | null
  final_price: number | null
  unit_value: number | null
  amount: number | null
  value: number | null
  discount: number | null
  deal_date: string | null
  contract_signed_at: string | null
  handover_date: string | null
  notes: string | null
  created_at: string
}

// ─── COMMISSIONS ─────────────────────────────────────────────────
export interface Commission {
  id: string
  deal_id: string | null
  agent_id: string | null
  company_id: string | null
  rule_id: string | null
  amount: number | null
  rate: number | null
  total_amount: number | null
  commission_rate: number | null
  status: 'pending' | 'approved' | 'paid' | 'disputed' | 'cancelled' | null
  commission_type: string | null
  expected_date: string | null
  paid_at: string | null
  notes: string | null
  created_at: string
}

// ─── PAYOUTS ─────────────────────────────────────────────────────
export interface Payout {
  id: string
  company_id: string | null
  created_by: string | null
  title: string
  period_month: number
  period_year: number
  total_amount: number
  status: PayoutStatus
  approved_by: string | null
  approved_at: string | null
  paid_at: string | null
  notes: string | null
  created_at: string
  updated_at: string | null
}

export interface PayoutItem {
  id: string
  payout_id: string
  commission_id: string | null
  agent_id: string
  deal_id: string | null
  description: string | null
  amount: number
  tax_amount: number
  net_amount: number
  status: string
  paid_at: string | null
  created_at: string
  profiles?: Pick<Profile, 'full_name'>
  deals?: Pick<Deal, 'client_name' | 'project_name'>
}

// ─── EXPENSES ────────────────────────────────────────────────────
export interface Expense {
  id: string
  company_id: string | null
  created_by: string | null
  category: ExpenseCategory
  description: string
  amount: number
  currency: string
  expense_date: string
  receipt_url: string | null
  status: 'pending' | 'approved' | 'rejected'
  approved_by: string | null
  approved_at: string | null
  notes: string | null
  created_at: string
}

// ─── TARGETS ─────────────────────────────────────────────────────
export interface Target {
  id: string
  agent_id: string
  company_id: string | null
  period_month: number
  period_year: number
  target_deals: number | null
  target_revenue: number | null
  achieved_deals: number | null
  achieved_revenue: number | null
  revenue_target: number | null
  deals_target: number | null
  leads_target: number | null
  created_at: string
}

// ─── BROKER PROFILES ─────────────────────────────────────────────
export interface BrokerProfile {
  id: string
  user_id: string | null
  company_id: string | null
  full_name: string
  phone: string | null
  email: string | null
  national_id: string | null
  license_number: string | null
  tier: 'platinum' | 'gold' | 'silver' | 'bronze' | null
  status: string | null
  total_sales: number | null
  total_deals: number | null
  commission_rate: number | null
  specialties: string[] | null
  created_at: string
}

// ─── NOTIFICATIONS ───────────────────────────────────────────────
export interface Notification {
  id: string
  user_id: string
  title: string
  message: string | null
  type: 'info' | 'success' | 'warning' | 'error'
  is_read: boolean
  link?: string | null
  related_entity_id?: string | null
  created_at: string
}

// ─── RESALE LISTINGS ─────────────────────────────────────────────
export interface ResaleListing {
  id: string
  company_id: string | null
  agent_id: string | null
  unit_number: string | null
  project_name: string
  building: string | null
  floor: number | null
  area_sqm: number | null
  unit_type: string | null
  bedrooms: number | null
  bathrooms: number | null
  finishing: string | null
  asking_price: number
  original_price: number | null
  installment_remaining: number | null
  seller_name: string | null
  seller_phone: string | null
  status: 'active' | 'under_offer' | 'sold' | 'withdrawn'
  is_verified: boolean
  views: number
  created_at: string
}

// ─── UNIT RESERVATIONS ───────────────────────────────────────────
export interface UnitReservation {
  id: string
  unit_id: string
  lead_id: string | null
  deal_id: string | null
  agent_id: string | null
  company_id: string | null
  status: 'active' | 'converted' | 'cancelled' | 'expired'
  reserved_at: string
  expires_at: string | null
  deposit_amount: number | null
  notes: string | null
  created_at: string
}

// ─── Database type map (for typed supabase client) ───────────────
export interface Database {
  public: {
    Tables: {
      profiles:           { Row: Profile;           Insert: Partial<Profile>;           Update: Partial<Profile>;           Relationships: [] }
      leads:              { Row: Lead;               Insert: Partial<Lead>;               Update: Partial<Lead>;               Relationships: [] }
      lead_activities:    { Row: LeadActivity;       Insert: Partial<LeadActivity>;       Update: Partial<LeadActivity>;       Relationships: [] }
      buyer_requirements: { Row: BuyerRequirement;   Insert: Partial<BuyerRequirement>;   Update: Partial<BuyerRequirement>;   Relationships: [] }
      developers:         { Row: Developer;           Insert: Partial<Developer>;           Update: Partial<Developer>;           Relationships: [] }
      projects:           { Row: Project;             Insert: Partial<Project>;             Update: Partial<Project>;             Relationships: [] }
      units:              { Row: Unit;                Insert: Partial<Unit>;                Update: Partial<Unit>;                Relationships: [] }
      deals:              { Row: Deal;                Insert: Partial<Deal>;                Update: Partial<Deal>;                Relationships: [] }
      commissions:        { Row: Commission;          Insert: Partial<Commission>;          Update: Partial<Commission>;          Relationships: [] }
      payouts:            { Row: Payout;              Insert: Partial<Payout>;              Update: Partial<Payout>;              Relationships: [] }
      payout_items:       { Row: PayoutItem;          Insert: Partial<PayoutItem>;          Update: Partial<PayoutItem>;          Relationships: [] }
      expenses:           { Row: Expense;             Insert: Partial<Expense>;             Update: Partial<Expense>;             Relationships: [] }
      targets:            { Row: Target;              Insert: Partial<Target>;              Update: Partial<Target>;              Relationships: [] }
      broker_profiles:    { Row: BrokerProfile;       Insert: Partial<BrokerProfile>;       Update: Partial<BrokerProfile>;       Relationships: [] }
      notifications:      { Row: Notification;        Insert: Partial<Notification>;        Update: Partial<Notification>;        Relationships: [] }
      resale_listings:    { Row: ResaleListing;       Insert: Partial<ResaleListing>;       Update: Partial<ResaleListing>;       Relationships: [] }
      unit_reservations:  { Row: UnitReservation;     Insert: Partial<UnitReservation>;     Update: Partial<UnitReservation>;     Relationships: [] }
      whatsapp_logs:      { Row: Record<string,unknown>; Insert: Record<string,unknown>; Update: Record<string,unknown>; Relationships: [] }
      commission_rules:   { Row: Record<string,unknown>; Insert: Record<string,unknown>; Update: Record<string,unknown>; Relationships: [] }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
