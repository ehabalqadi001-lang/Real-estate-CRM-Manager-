export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          agent_id: string | null
          company_id: string | null
          created_at: string | null
          done_at: string | null
          duration_minutes: number | null
          id: string
          lead_id: string | null
          notes: string | null
          outcome: string | null
          scheduled_at: string | null
          type: string | null
        }
        Insert: {
          agent_id?: string | null
          company_id?: string | null
          created_at?: string | null
          done_at?: string | null
          duration_minutes?: number | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          outcome?: string | null
          scheduled_at?: string | null
          type?: string | null
        }
        Update: {
          agent_id?: string | null
          company_id?: string | null
          created_at?: string | null
          done_at?: string | null
          duration_minutes?: number | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          outcome?: string | null
          scheduled_at?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_packages: {
        Row: {
          ads_included: number
          created_at: string | null
          description: string | null
          featured_ads: number | null
          id: string
          is_active: boolean | null
          name: string
          points_included: number
          price: number
          type: string
          updated_at: string | null
          verified_badge_included: boolean
        }
        Insert: {
          ads_included: number
          created_at?: string | null
          description?: string | null
          featured_ads?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          points_included?: number
          price: number
          type: string
          updated_at?: string | null
          verified_badge_included?: boolean
        }
        Update: {
          ads_included?: number
          created_at?: string | null
          description?: string | null
          featured_ads?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          points_included?: number
          price?: number
          type?: string
          updated_at?: string | null
          verified_badge_included?: boolean
        }
        Relationships: []
      }
      ads: {
        Row: {
          area_location: string | null
          area_sqm: number | null
          bathrooms: number | null
          bedrooms: number | null
          city: string | null
          compound_name: string | null
          created_at: string | null
          currency: string | null
          delivery_status: string | null
          description: string | null
          detailed_address: string | null
          developer_id: string | null
          district: string | null
          doc_files: string[] | null
          documents: string[] | null
          down_payment: number | null
          expires_at: string | null
          external_area_sqm: number | null
          favorites_count: number | null
          features: string | null
          finishing: string | null
          id: string
          images: string[] | null
          installment_amount: number | null
          internal_area_sqm: number | null
          is_featured: boolean | null
          is_furnished: boolean | null
          is_rented: boolean | null
          is_urgent: boolean | null
          layout_file: string | null
          listing_kind: string
          location: string
          marketing_description: string | null
          masterplan_file: string | null
          package_id: string | null
          points_cost: number
          price: number | null
          pricing_strategy: string | null
          project_id: string | null
          property_type: string
          rejection_reason: string | null
          rental_value: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          rooms: number | null
          seller_type: string
          special_notes: string | null
          status: string
          submitted_at: string
          title: string
          total_cash_price: number | null
          unit_number: string | null
          unit_type: string | null
          updated_at: string | null
          user_id: string
          views_count: number | null
        }
        Insert: {
          area_location?: string | null
          area_sqm?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          compound_name?: string | null
          created_at?: string | null
          currency?: string | null
          delivery_status?: string | null
          description?: string | null
          detailed_address?: string | null
          developer_id?: string | null
          district?: string | null
          doc_files?: string[] | null
          documents?: string[] | null
          down_payment?: number | null
          expires_at?: string | null
          external_area_sqm?: number | null
          favorites_count?: number | null
          features?: string | null
          finishing?: string | null
          id?: string
          images?: string[] | null
          installment_amount?: number | null
          internal_area_sqm?: number | null
          is_featured?: boolean | null
          is_furnished?: boolean | null
          is_rented?: boolean | null
          is_urgent?: boolean | null
          layout_file?: string | null
          listing_kind?: string
          location: string
          marketing_description?: string | null
          masterplan_file?: string | null
          package_id?: string | null
          points_cost?: number
          price?: number | null
          pricing_strategy?: string | null
          project_id?: string | null
          property_type: string
          rejection_reason?: string | null
          rental_value?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rooms?: number | null
          seller_type?: string
          special_notes?: string | null
          status?: string
          submitted_at?: string
          title: string
          total_cash_price?: number | null
          unit_number?: string | null
          unit_type?: string | null
          updated_at?: string | null
          user_id: string
          views_count?: number | null
        }
        Update: {
          area_location?: string | null
          area_sqm?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          compound_name?: string | null
          created_at?: string | null
          currency?: string | null
          delivery_status?: string | null
          description?: string | null
          detailed_address?: string | null
          developer_id?: string | null
          district?: string | null
          doc_files?: string[] | null
          documents?: string[] | null
          down_payment?: number | null
          expires_at?: string | null
          external_area_sqm?: number | null
          favorites_count?: number | null
          features?: string | null
          finishing?: string | null
          id?: string
          images?: string[] | null
          installment_amount?: number | null
          internal_area_sqm?: number | null
          is_featured?: boolean | null
          is_furnished?: boolean | null
          is_rented?: boolean | null
          is_urgent?: boolean | null
          layout_file?: string | null
          listing_kind?: string
          location?: string
          marketing_description?: string | null
          masterplan_file?: string | null
          package_id?: string | null
          points_cost?: number
          price?: number | null
          pricing_strategy?: string | null
          project_id?: string | null
          property_type?: string
          rejection_reason?: string | null
          rental_value?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rooms?: number | null
          seller_type?: string
          special_notes?: string | null
          status?: string
          submitted_at?: string
          title?: string
          total_cash_price?: number | null
          unit_number?: string | null
          unit_type?: string | null
          updated_at?: string | null
          user_id?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ads_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ads_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "ad_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_targets: {
        Row: {
          agent_id: string
          company_id: string | null
          created_at: string | null
          deals_target: number | null
          id: string
          leads_target: number | null
          month: string
          revenue_target: number | null
        }
        Insert: {
          agent_id: string
          company_id?: string | null
          created_at?: string | null
          deals_target?: number | null
          id?: string
          leads_target?: number | null
          month: string
          revenue_target?: number | null
        }
        Update: {
          agent_id?: string
          company_id?: string | null
          created_at?: string | null
          deals_target?: number | null
          id?: string
          leads_target?: number | null
          month?: string
          revenue_target?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_targets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          company_id: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          role_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          role_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          role_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "agents_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          body: string | null
          color: string | null
          company_id: string | null
          created_at: string | null
          created_by: string | null
          cta_text: string | null
          cta_url: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          priority: string | null
          start_date: string | null
          target_audience: string | null
          title: string
          type: string | null
        }
        Insert: {
          body?: string | null
          color?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          cta_text?: string | null
          cta_url?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          priority?: string | null
          start_date?: string | null
          target_audience?: string | null
          title: string
          type?: string | null
        }
        Update: {
          body?: string | null
          color?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          cta_text?: string | null
          cta_url?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          priority?: string | null
          start_date?: string | null
          target_audience?: string | null
          title?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
        ]
      }
      ap_bills: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          bill_date: string
          bill_number: string
          commission_id: string | null
          company_id: string
          created_at: string
          created_by: string
          currency: string
          description: string
          due_date: string | null
          id: string
          journal_entry_id: string | null
          notes: string | null
          paid_amount: number
          status: string
          subtotal: number
          tax_amount: number | null
          tax_pct: number
          total_amount: number | null
          updated_at: string
          vendor_id: string | null
          vendor_name: string
          vendor_type: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          bill_date?: string
          bill_number: string
          commission_id?: string | null
          company_id: string
          created_at?: string
          created_by: string
          currency?: string
          description: string
          due_date?: string | null
          id?: string
          journal_entry_id?: string | null
          notes?: string | null
          paid_amount?: number
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_pct?: number
          total_amount?: number | null
          updated_at?: string
          vendor_id?: string | null
          vendor_name: string
          vendor_type?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          bill_date?: string
          bill_number?: string
          commission_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string
          currency?: string
          description?: string
          due_date?: string | null
          id?: string
          journal_entry_id?: string | null
          notes?: string | null
          paid_amount?: number
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_pct?: number
          total_amount?: number | null
          updated_at?: string
          vendor_id?: string | null
          vendor_name?: string
          vendor_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ap_bills_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap_bills_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "commissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap_bills_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap_bills_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "ap_bills_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap_bills_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      ap_payments: {
        Row: {
          amount: number
          bank_reference: string | null
          bill_id: string
          company_id: string
          created_at: string
          id: string
          journal_entry_id: string | null
          notes: string | null
          paid_by: string
          payment_date: string
          payment_method: string | null
          receipt_url: string | null
        }
        Insert: {
          amount: number
          bank_reference?: string | null
          bill_id: string
          company_id: string
          created_at?: string
          id?: string
          journal_entry_id?: string | null
          notes?: string | null
          paid_by: string
          payment_date?: string
          payment_method?: string | null
          receipt_url?: string | null
        }
        Update: {
          amount?: number
          bank_reference?: string | null
          bill_id?: string
          company_id?: string
          created_at?: string
          id?: string
          journal_entry_id?: string | null
          notes?: string | null
          paid_by?: string
          payment_date?: string
          payment_method?: string | null
          receipt_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ap_payments_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "ap_bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap_payments_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "v_ap_outstanding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap_payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap_payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "ap_payments_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap_payments_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ar_invoices: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          currency: string
          deal_id: string | null
          description: string
          developer_id: string | null
          due_date: string | null
          id: string
          invoice_number: string
          issue_date: string
          journal_entry_id: string | null
          notes: string | null
          paid_amount: number
          status: string
          subtotal: number
          tax_amount: number | null
          tax_pct: number
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          currency?: string
          deal_id?: string | null
          description: string
          developer_id?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          issue_date?: string
          journal_entry_id?: string | null
          notes?: string | null
          paid_amount?: number
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_pct?: number
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          currency?: string
          deal_id?: string | null
          description?: string
          developer_id?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          journal_entry_id?: string | null
          notes?: string | null
          paid_amount?: number
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_pct?: number
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ar_invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ar_invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "ar_invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ar_invoices_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ar_invoices_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals_kanban"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ar_invoices_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ar_invoices_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      ar_payments: {
        Row: {
          amount: number
          bank_reference: string | null
          company_id: string
          created_at: string
          id: string
          invoice_id: string
          journal_entry_id: string | null
          notes: string | null
          payment_date: string
          payment_method: string | null
          receipt_url: string | null
          recorded_by: string
        }
        Insert: {
          amount: number
          bank_reference?: string | null
          company_id: string
          created_at?: string
          id?: string
          invoice_id: string
          journal_entry_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          receipt_url?: string | null
          recorded_by: string
        }
        Update: {
          amount?: number
          bank_reference?: string | null
          company_id?: string
          created_at?: string
          id?: string
          invoice_id?: string
          journal_entry_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          receipt_url?: string | null
          recorded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "ar_payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ar_payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "ar_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "ar_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ar_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "v_ar_aging"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ar_payments_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ar_payments_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_logs: {
        Row: {
          break_minutes: number
          check_in: string | null
          check_out: string | null
          company_id: string
          created_at: string
          employee_id: string
          id: string
          log_date: string
          notes: string | null
          recorded_by: string | null
          status: string
        }
        Insert: {
          break_minutes?: number
          check_in?: string | null
          check_out?: string | null
          company_id: string
          created_at?: string
          employee_id: string
          id?: string
          log_date: string
          notes?: string | null
          recorded_by?: string | null
          status?: string
        }
        Update: {
          break_minutes?: number
          check_in?: string | null
          check_out?: string | null
          company_id?: string
          created_at?: string
          employee_id?: string
          id?: string
          log_date?: string
          notes?: string | null
          recorded_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "attendance_logs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_logs_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action_type: string
          company_id: string | null
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          company_id?: string | null
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          company_id?: string | null
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_name: string
          account_number: string | null
          bank_name: string
          company_id: string
          created_at: string
          currency: string
          current_balance: number
          gl_account_id: string | null
          iban: string | null
          id: string
          is_active: boolean
          is_primary: boolean
          swift: string | null
          updated_at: string
        }
        Insert: {
          account_name: string
          account_number?: string | null
          bank_name: string
          company_id: string
          created_at?: string
          currency?: string
          current_balance?: number
          gl_account_id?: string | null
          iban?: string | null
          id?: string
          is_active?: boolean
          is_primary?: boolean
          swift?: string | null
          updated_at?: string
        }
        Update: {
          account_name?: string
          account_number?: string | null
          bank_name?: string
          company_id?: string
          created_at?: string
          currency?: string
          current_balance?: number
          gl_account_id?: string | null
          iban?: string | null
          id?: string
          is_active?: boolean
          is_primary?: boolean
          swift?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "bank_accounts_gl_account_id_fkey"
            columns: ["gl_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transactions: {
        Row: {
          amount: number
          bank_account_id: string
          company_id: string
          created_at: string
          description: string
          id: string
          is_reconciled: boolean
          journal_entry_id: string | null
          reconciled_at: string | null
          reconciliation_id: string | null
          reference: string | null
          transaction_date: string
          type: string
          value_date: string | null
        }
        Insert: {
          amount: number
          bank_account_id: string
          company_id: string
          created_at?: string
          description: string
          id?: string
          is_reconciled?: boolean
          journal_entry_id?: string | null
          reconciled_at?: string | null
          reconciliation_id?: string | null
          reference?: string | null
          transaction_date: string
          type: string
          value_date?: string | null
        }
        Update: {
          amount?: number
          bank_account_id?: string
          company_id?: string
          created_at?: string
          description?: string
          id?: string
          is_reconciled?: boolean
          journal_entry_id?: string | null
          reconciled_at?: string | null
          reconciliation_id?: string | null
          reference?: string | null
          transaction_date?: string
          type?: string
          value_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "bank_transactions_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_events: {
        Row: {
          company_id: string | null
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          is_processed: boolean
          payload: Json
          processed_at: string | null
          provider: string | null
          provider_event_id: string | null
          subscription_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          is_processed?: boolean
          payload?: Json
          processed_at?: string | null
          provider?: string | null
          provider_event_id?: string | null
          subscription_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          is_processed?: boolean
          payload?: Json
          processed_at?: string | null
          provider?: string | null
          provider_event_id?: string | null
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "billing_events_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "tenant_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_deals: {
        Row: {
          broker_id: string | null
          commission_amt: number | null
          commission_pct: number | null
          company_id: string | null
          created_at: string | null
          deal_id: string | null
          id: string
          role: string | null
          status: string | null
        }
        Insert: {
          broker_id?: string | null
          commission_amt?: number | null
          commission_pct?: number | null
          company_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          id?: string
          role?: string | null
          status?: string | null
        }
        Update: {
          broker_id?: string | null
          commission_amt?: number | null
          commission_pct?: number | null
          company_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          id?: string
          role?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "broker_deals_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "broker_leaderboard"
            referencedColumns: ["broker_id"]
          },
          {
            foreignKeyName: "broker_deals_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "broker_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "broker_deals_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_deals_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals_kanban"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_documents: {
        Row: {
          broker_id: string
          company_id: string | null
          created_at: string | null
          expiry_date: string | null
          file_size: number | null
          id: string
          mime_type: string | null
          name: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          type: string
          url: string
        }
        Insert: {
          broker_id: string
          company_id?: string | null
          created_at?: string | null
          expiry_date?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          type: string
          url: string
        }
        Update: {
          broker_id?: string
          company_id?: string | null
          created_at?: string | null
          expiry_date?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "broker_documents_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "broker_leaderboard"
            referencedColumns: ["broker_id"]
          },
          {
            foreignKeyName: "broker_documents_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "broker_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_profiles: {
        Row: {
          active_leads: number | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_iban: string | null
          bank_name: string | null
          bio: string | null
          commercial_license: string | null
          commercial_license_url: string | null
          commission_rate: number | null
          company_id: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          full_name: string
          id: string
          join_date: string | null
          license_number: string | null
          national_id: string | null
          national_id_expiry: string | null
          national_id_url: string | null
          notification_prefs: Json | null
          onboarding_completed: boolean | null
          onboarding_step: number | null
          pending_commissions: number | null
          phone: string | null
          phone_secondary: string | null
          photo_url: string | null
          preferred_areas: string[] | null
          profile_id: string | null
          profile_image: string | null
          rating: number | null
          rejection_reason: string | null
          specialties: string[] | null
          status: string | null
          tax_card_number: string | null
          tax_card_url: string | null
          tier: string | null
          total_commissions_earned: number | null
          total_deals: number | null
          total_sales: number | null
          total_sales_value: number | null
          unit_types_interest: string[] | null
          updated_at: string | null
          user_id: string | null
          verification_status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          active_leads?: number | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_iban?: string | null
          bank_name?: string | null
          bio?: string | null
          commercial_license?: string | null
          commercial_license_url?: string | null
          commission_rate?: number | null
          company_id?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          full_name: string
          id?: string
          join_date?: string | null
          license_number?: string | null
          national_id?: string | null
          national_id_expiry?: string | null
          national_id_url?: string | null
          notification_prefs?: Json | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          pending_commissions?: number | null
          phone?: string | null
          phone_secondary?: string | null
          photo_url?: string | null
          preferred_areas?: string[] | null
          profile_id?: string | null
          profile_image?: string | null
          rating?: number | null
          rejection_reason?: string | null
          specialties?: string[] | null
          status?: string | null
          tax_card_number?: string | null
          tax_card_url?: string | null
          tier?: string | null
          total_commissions_earned?: number | null
          total_deals?: number | null
          total_sales?: number | null
          total_sales_value?: number | null
          unit_types_interest?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          active_leads?: number | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_iban?: string | null
          bank_name?: string | null
          bio?: string | null
          commercial_license?: string | null
          commercial_license_url?: string | null
          commission_rate?: number | null
          company_id?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          full_name?: string
          id?: string
          join_date?: string | null
          license_number?: string | null
          national_id?: string | null
          national_id_expiry?: string | null
          national_id_url?: string | null
          notification_prefs?: Json | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          pending_commissions?: number | null
          phone?: string | null
          phone_secondary?: string | null
          photo_url?: string | null
          preferred_areas?: string[] | null
          profile_id?: string | null
          profile_image?: string | null
          rating?: number | null
          rejection_reason?: string | null
          specialties?: string[] | null
          status?: string | null
          tax_card_number?: string | null
          tax_card_url?: string | null
          tier?: string | null
          total_commissions_earned?: number | null
          total_deals?: number | null
          total_sales?: number | null
          total_sales_value?: number | null
          unit_types_interest?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "broker_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "broker_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_profiles_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_ratings: {
        Row: {
          broker_id: string
          company_id: string | null
          created_at: string | null
          deal_id: string | null
          feedback: string | null
          id: string
          rated_by: string | null
          rating: number
          rating_type: string | null
        }
        Insert: {
          broker_id: string
          company_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          feedback?: string | null
          id?: string
          rated_by?: string | null
          rating: number
          rating_type?: string | null
        }
        Update: {
          broker_id?: string
          company_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          feedback?: string | null
          id?: string
          rated_by?: string | null
          rating?: number
          rating_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "broker_ratings_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "broker_leaderboard"
            referencedColumns: ["broker_id"]
          },
          {
            foreignKeyName: "broker_ratings_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "broker_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_ratings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_ratings_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_ratings_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals_kanban"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_ratings_rated_by_fkey"
            columns: ["rated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      buildings: {
        Row: {
          company_id: string | null
          created_at: string | null
          floors: number | null
          id: string
          name: string
          project_id: string
          units_per_floor: number | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          floors?: number | null
          id?: string
          name: string
          project_id: string
          units_per_floor?: number | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          floors?: number | null
          id?: string
          name?: string
          project_id?: string
          units_per_floor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "buildings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buildings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "buildings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_requirements: {
        Row: {
          company_id: string | null
          created_at: string | null
          finishing: string[] | null
          id: string
          lead_id: string | null
          max_area_sqm: number | null
          max_bedrooms: number | null
          max_budget: number | null
          max_down_payment: number | null
          max_installment_years: number | null
          min_area_sqm: number | null
          min_bedrooms: number | null
          min_budget: number | null
          notes: string | null
          payment_type: string | null
          preferred_areas: string[] | null
          property_types: string[] | null
          purpose: string | null
          timeline: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          finishing?: string[] | null
          id?: string
          lead_id?: string | null
          max_area_sqm?: number | null
          max_bedrooms?: number | null
          max_budget?: number | null
          max_down_payment?: number | null
          max_installment_years?: number | null
          min_area_sqm?: number | null
          min_bedrooms?: number | null
          min_budget?: number | null
          notes?: string | null
          payment_type?: string | null
          preferred_areas?: string[] | null
          property_types?: string[] | null
          purpose?: string | null
          timeline?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          finishing?: string[] | null
          id?: string
          lead_id?: string | null
          max_area_sqm?: number | null
          max_bedrooms?: number | null
          max_budget?: number | null
          max_down_payment?: number | null
          max_installment_years?: number | null
          min_area_sqm?: number | null
          min_bedrooms?: number | null
          min_budget?: number | null
          notes?: string | null
          payment_type?: string | null
          preferred_areas?: string[] | null
          property_types?: string[] | null
          purpose?: string | null
          timeline?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buyer_requirements_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_of_accounts: {
        Row: {
          code: string
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          name_ar: string | null
          normal_balance: string
          parent_id: string | null
          sort_order: number
          sub_type: string | null
          type: string
        }
        Insert: {
          code: string
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          name_ar?: string | null
          normal_balance?: string
          parent_id?: string | null
          sort_order?: number
          sub_type?: string | null
          type: string
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          name_ar?: string | null
          normal_balance?: string
          parent_id?: string | null
          sort_order?: number
          sub_type?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chart_of_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "chart_of_accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          ad_id: string
          attachment_url: string | null
          channel: string
          company_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          message_type: string | null
          read_at: string | null
          receiver_id: string
          sender_id: string
          support_assigned_to: string | null
        }
        Insert: {
          ad_id: string
          attachment_url?: string | null
          channel?: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          message_type?: string | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
          support_assigned_to?: string | null
        }
        Update: {
          ad_id?: string
          attachment_url?: string | null
          channel?: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          message_type?: string | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
          support_assigned_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
        ]
      }
      client_meetings: {
        Row: {
          agent_id: string | null
          company_id: string | null
          created_at: string | null
          done_at: string | null
          id: string
          lead_id: string | null
          meeting_type: string | null
          notes: string | null
          outcome: string | null
          scheduled_at: string | null
        }
        Insert: {
          agent_id?: string | null
          company_id?: string | null
          created_at?: string | null
          done_at?: string | null
          id?: string
          lead_id?: string | null
          meeting_type?: string | null
          notes?: string | null
          outcome?: string | null
          scheduled_at?: string | null
        }
        Update: {
          agent_id?: string | null
          company_id?: string | null
          created_at?: string | null
          done_at?: string | null
          id?: string
          lead_id?: string | null
          meeting_type?: string | null
          notes?: string | null
          outcome?: string | null
          scheduled_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_meetings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_meetings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "client_meetings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          budget_range: string | null
          client_type: string | null
          company_id: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          lead_source: string | null
          name: string | null
          national_id: string | null
          notes: string | null
          phone: string
        }
        Insert: {
          budget_range?: string | null
          client_type?: string | null
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          lead_source?: string | null
          name?: string | null
          national_id?: string | null
          notes?: string | null
          phone: string
        }
        Update: {
          budget_range?: string | null
          client_type?: string | null
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          lead_source?: string | null
          name?: string | null
          national_id?: string | null
          notes?: string | null
          phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
        ]
      }
      commission_calculations: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          breakdown: Json
          company_id: string
          created_at: string
          deal_id: string
          deal_value: number
          employee_id: string
          id: string
          notes: string | null
          paid_in_run_id: string | null
          payroll_item_id: string | null
          period_month: number
          period_year: number
          status: string
          total_commission: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          breakdown?: Json
          company_id: string
          created_at?: string
          deal_id: string
          deal_value?: number
          employee_id: string
          id?: string
          notes?: string | null
          paid_in_run_id?: string | null
          payroll_item_id?: string | null
          period_month: number
          period_year: number
          status?: string
          total_commission?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          breakdown?: Json
          company_id?: string
          created_at?: string
          deal_id?: string
          deal_value?: number
          employee_id?: string
          id?: string
          notes?: string | null
          paid_in_run_id?: string | null
          payroll_item_id?: string | null
          period_month?: number
          period_year?: number
          status?: string
          total_commission?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_calculations_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_calculations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_calculations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "commission_calculations_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_calculations_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals_kanban"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_calculations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_calculations_paid_in_run_id_fkey"
            columns: ["paid_in_run_id"]
            isOneToOne: false
            referencedRelation: "payroll_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_calculations_payroll_item_id_fkey"
            columns: ["payroll_item_id"]
            isOneToOne: false
            referencedRelation: "payroll_items"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_rates: {
        Row: {
          agent_share_percentage: number | null
          company_share_percentage: number | null
          created_at: string | null
          developer_id: string | null
          effective_from: string | null
          effective_to: string | null
          id: string
          max_value: number | null
          min_value: number | null
          project_id: string | null
          rate_percentage: number
        }
        Insert: {
          agent_share_percentage?: number | null
          company_share_percentage?: number | null
          created_at?: string | null
          developer_id?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          max_value?: number | null
          min_value?: number | null
          project_id?: string | null
          rate_percentage: number
        }
        Update: {
          agent_share_percentage?: number | null
          company_share_percentage?: number | null
          created_at?: string | null
          developer_id?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          max_value?: number | null
          min_value?: number | null
          project_id?: string | null
          rate_percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "commission_rates_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_rates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_rules: {
        Row: {
          commission_pct: number
          company_id: string | null
          created_at: string | null
          developer_id: string | null
          id: string
          payout_days: number
          sale_type: string
        }
        Insert: {
          commission_pct: number
          company_id?: string | null
          created_at?: string | null
          developer_id?: string | null
          id?: string
          payout_days: number
          sale_type: string
        }
        Update: {
          commission_pct?: number
          company_id?: string | null
          created_at?: string | null
          developer_id?: string | null
          id?: string
          payout_days?: number
          sale_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_rules_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_tiers: {
        Row: {
          applies_to_role: string | null
          bonus_flat: number
          commission_pct: number
          company_id: string
          created_at: string
          from_amount: number
          id: string
          is_active: boolean
          name: string
          period_type: string
          sort_order: number
          to_amount: number | null
        }
        Insert: {
          applies_to_role?: string | null
          bonus_flat?: number
          commission_pct?: number
          company_id: string
          created_at?: string
          from_amount?: number
          id?: string
          is_active?: boolean
          name: string
          period_type?: string
          sort_order?: number
          to_amount?: number | null
        }
        Update: {
          applies_to_role?: string | null
          bonus_flat?: number
          commission_pct?: number
          company_id?: string
          created_at?: string
          from_amount?: number
          id?: string
          is_active?: boolean
          name?: string
          period_type?: string
          sort_order?: number
          to_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_tiers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_tiers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
        ]
      }
      commissions: {
        Row: {
          agent_amount: number | null
          agent_id: string | null
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          bank_details: string | null
          beneficiary_name: string | null
          collected_amount: number | null
          commission_rate: number | null
          commission_type: string | null
          company_amount: number | null
          company_id: string | null
          created_at: string | null
          deal_id: string | null
          deal_value: number | null
          expected_date: string | null
          gross_commission: number | null
          gross_deal_value: number | null
          id: string
          member_id: string | null
          notes: string | null
          paid_at: string | null
          payment_date: string | null
          payment_method: string | null
          payment_reference: string | null
          pending_amount: number | null
          percentage: number | null
          rate: number | null
          receipt_url: string | null
          requested_at: string | null
          rule_id: string | null
          status: string | null
          team_member_id: string | null
          total_amount: number | null
        }
        Insert: {
          agent_amount?: number | null
          agent_id?: string | null
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          bank_details?: string | null
          beneficiary_name?: string | null
          collected_amount?: number | null
          commission_rate?: number | null
          commission_type?: string | null
          company_amount?: number | null
          company_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          deal_value?: number | null
          expected_date?: string | null
          gross_commission?: number | null
          gross_deal_value?: number | null
          id?: string
          member_id?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          pending_amount?: number | null
          percentage?: number | null
          rate?: number | null
          receipt_url?: string | null
          requested_at?: string | null
          rule_id?: string | null
          status?: string | null
          team_member_id?: string | null
          total_amount?: number | null
        }
        Update: {
          agent_amount?: number | null
          agent_id?: string | null
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          bank_details?: string | null
          beneficiary_name?: string | null
          collected_amount?: number | null
          commission_rate?: number | null
          commission_type?: string | null
          company_amount?: number | null
          company_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          deal_value?: number | null
          expected_date?: string | null
          gross_commission?: number | null
          gross_deal_value?: number | null
          id?: string
          member_id?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          pending_amount?: number | null
          percentage?: number | null
          rate?: number | null
          receipt_url?: string | null
          requested_at?: string | null
          rule_id?: string | null
          status?: string | null
          team_member_id?: string | null
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "commissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "commissions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals_kanban"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "commission_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          active: boolean | null
          country: string
          created_at: string | null
          feature_flags: Json
          id: string
          is_suspended: boolean
          locale: string
          logo_url: string | null
          max_listings: number
          max_users: number
          metadata: Json
          name: string
          onboarded_at: string | null
          owner_id: string | null
          plan_tier: string
          slug: string | null
          suspended_at: string | null
          suspended_reason: string | null
          timezone: string
          trial_ends_at: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          active?: boolean | null
          country?: string
          created_at?: string | null
          feature_flags?: Json
          id?: string
          is_suspended?: boolean
          locale?: string
          logo_url?: string | null
          max_listings?: number
          max_users?: number
          metadata?: Json
          name: string
          onboarded_at?: string | null
          owner_id?: string | null
          plan_tier?: string
          slug?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          timezone?: string
          trial_ends_at?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          active?: boolean | null
          country?: string
          created_at?: string | null
          feature_flags?: Json
          id?: string
          is_suspended?: boolean
          locale?: string
          logo_url?: string | null
          max_listings?: number
          max_users?: number
          metadata?: Json
          name?: string
          onboarded_at?: string | null
          owner_id?: string | null
          plan_tier?: string
          slug?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          timezone?: string
          trial_ends_at?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          address: string | null
          company_name: string | null
          currency: string | null
          email_notifications: boolean | null
          id: string
          tax_rate: number | null
          updated_at: string | null
          whatsapp_notifications: boolean | null
        }
        Insert: {
          address?: string | null
          company_name?: string | null
          currency?: string | null
          email_notifications?: boolean | null
          id?: string
          tax_rate?: number | null
          updated_at?: string | null
          whatsapp_notifications?: boolean | null
        }
        Update: {
          address?: string | null
          company_name?: string | null
          currency?: string | null
          email_notifications?: boolean | null
          id?: string
          tax_rate?: number | null
          updated_at?: string | null
          whatsapp_notifications?: boolean | null
        }
        Relationships: []
      }
      contract_milestones: {
        Row: {
          actual_date: string | null
          company_id: string
          contract_id: string
          created_at: string | null
          description: string | null
          id: string
          planned_date: string | null
          sort_order: number | null
          status: string
          title: string
        }
        Insert: {
          actual_date?: string | null
          company_id: string
          contract_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          planned_date?: string | null
          sort_order?: number | null
          status?: string
          title: string
        }
        Update: {
          actual_date?: string | null
          company_id?: string
          contract_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          planned_date?: string | null
          sort_order?: number | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_milestones_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_milestones_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_status_log: {
        Row: {
          changed_by: string | null
          company_id: string | null
          contract_id: string
          created_at: string | null
          from_status: string | null
          id: string
          notes: string | null
          to_status: string
        }
        Insert: {
          changed_by?: string | null
          company_id?: string | null
          contract_id: string
          created_at?: string | null
          from_status?: string | null
          id?: string
          notes?: string | null
          to_status: string
        }
        Update: {
          changed_by?: string | null
          company_id?: string | null
          contract_id?: string
          created_at?: string | null
          from_status?: string | null
          id?: string
          notes?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_status_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_status_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_status_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "contract_status_log_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          body_html: string
          company_id: string | null
          contract_type: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          is_global: boolean
          language: string
          name: string
          name_ar: string | null
          updated_at: string
          variables: Json
          version: number
        }
        Insert: {
          body_html?: string
          company_id?: string | null
          contract_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_global?: boolean
          language?: string
          name: string
          name_ar?: string | null
          updated_at?: string
          variables?: Json
          version?: number
        }
        Update: {
          body_html?: string
          company_id?: string | null
          contract_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_global?: boolean
          language?: string
          name?: string
          name_ar?: string | null
          updated_at?: string
          variables?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "contract_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "contract_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          agent_id: string | null
          client_address: string | null
          client_name: string
          client_national_id: string | null
          client_phone: string | null
          club_membership_fee: number | null
          company_id: string
          contract_date: string | null
          contract_number: string | null
          contract_type: string
          created_at: string | null
          deal_id: string | null
          down_payment: number
          esign_reference: string | null
          handover_date: string | null
          id: string
          installment_months: number | null
          internal_notes: string | null
          maintenance_fee: number | null
          metadata: Json | null
          notes: string | null
          pdf_url: string | null
          remaining_amount: number | null
          signed_at: string | null
          signed_pdf_url: string | null
          status: string
          total_value: number
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          agent_id?: string | null
          client_address?: string | null
          client_name: string
          client_national_id?: string | null
          client_phone?: string | null
          club_membership_fee?: number | null
          company_id: string
          contract_date?: string | null
          contract_number?: string | null
          contract_type?: string
          created_at?: string | null
          deal_id?: string | null
          down_payment?: number
          esign_reference?: string | null
          handover_date?: string | null
          id?: string
          installment_months?: number | null
          internal_notes?: string | null
          maintenance_fee?: number | null
          metadata?: Json | null
          notes?: string | null
          pdf_url?: string | null
          remaining_amount?: number | null
          signed_at?: string | null
          signed_pdf_url?: string | null
          status?: string
          total_value?: number
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string | null
          client_address?: string | null
          client_name?: string
          client_national_id?: string | null
          client_phone?: string | null
          club_membership_fee?: number | null
          company_id?: string
          contract_date?: string | null
          contract_number?: string | null
          contract_type?: string
          created_at?: string | null
          deal_id?: string | null
          down_payment?: number
          esign_reference?: string | null
          handover_date?: string | null
          id?: string
          installment_months?: number | null
          internal_notes?: string | null
          maintenance_fee?: number | null
          metadata?: Json | null
          notes?: string | null
          pdf_url?: string | null
          remaining_amount?: number | null
          signed_at?: string | null
          signed_pdf_url?: string | null
          status?: string
          total_value?: number
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals_kanban"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_journeys: {
        Row: {
          company_id: string
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          lead_id: string
          triggered_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          lead_id: string
          triggered_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          lead_id?: string
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_journeys_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_journeys_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_journeys_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_activities: {
        Row: {
          action_type: string
          company_id: string | null
          created_at: string | null
          deal_id: string | null
          description: string
          id: string
          user_id: string | null
        }
        Insert: {
          action_type: string
          company_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          description: string
          id?: string
          user_id?: string | null
        }
        Update: {
          action_type?: string
          company_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          description?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "deal_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_approvals: {
        Row: {
          approved_by: string | null
          approver_id: string | null
          company_id: string
          created_at: string | null
          deal_id: string
          decided_at: string | null
          id: string
          level: number
          level_name: string
          notes: string | null
          status: string
        }
        Insert: {
          approved_by?: string | null
          approver_id?: string | null
          company_id: string
          created_at?: string | null
          deal_id: string
          decided_at?: string | null
          id?: string
          level?: number
          level_name: string
          notes?: string | null
          status?: string
        }
        Update: {
          approved_by?: string | null
          approver_id?: string | null
          company_id?: string
          created_at?: string | null
          deal_id?: string
          decided_at?: string | null
          id?: string
          level?: number
          level_name?: string
          notes?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_approvals_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_approvals_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_approvals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_approvals_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_approvals_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals_kanban"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_stage_log: {
        Row: {
          changed_by: string | null
          company_id: string | null
          created_at: string | null
          deal_id: string
          from_stage: string | null
          id: string
          notes: string | null
          to_stage: string
        }
        Insert: {
          changed_by?: string | null
          company_id?: string | null
          created_at?: string | null
          deal_id: string
          from_stage?: string | null
          id?: string
          notes?: string | null
          to_stage: string
        }
        Update: {
          changed_by?: string | null
          company_id?: string | null
          created_at?: string | null
          deal_id?: string
          from_stage?: string | null
          id?: string
          notes?: string | null
          to_stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_stage_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_stage_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_stage_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "deal_stage_log_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_stage_log_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals_kanban"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          actual_close_date: string | null
          agent_id: string | null
          amount: number | null
          assigned_to: string | null
          buyer_name: string | null
          client_id: string | null
          client_name: string | null
          company_id: string | null
          contract_id: string | null
          contract_signed_at: string | null
          created_at: string | null
          deal_date: string | null
          developer_name: string | null
          discount: number | null
          expected_close_date: string | null
          final_price: number | null
          handover_date: string | null
          id: string
          lead_id: string | null
          lost_reason: string | null
          notes: string | null
          payout_id: string | null
          probability: number | null
          project_name: string | null
          property_type: string | null
          source: string | null
          stage: string | null
          status: string | null
          tags: string[] | null
          title: string
          unit_id: string | null
          unit_reservation_id: string | null
          unit_value: number | null
          updated_at: string | null
          value: number | null
        }
        Insert: {
          actual_close_date?: string | null
          agent_id?: string | null
          amount?: number | null
          assigned_to?: string | null
          buyer_name?: string | null
          client_id?: string | null
          client_name?: string | null
          company_id?: string | null
          contract_id?: string | null
          contract_signed_at?: string | null
          created_at?: string | null
          deal_date?: string | null
          developer_name?: string | null
          discount?: number | null
          expected_close_date?: string | null
          final_price?: number | null
          handover_date?: string | null
          id?: string
          lead_id?: string | null
          lost_reason?: string | null
          notes?: string | null
          payout_id?: string | null
          probability?: number | null
          project_name?: string | null
          property_type?: string | null
          source?: string | null
          stage?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          unit_id?: string | null
          unit_reservation_id?: string | null
          unit_value?: number | null
          updated_at?: string | null
          value?: number | null
        }
        Update: {
          actual_close_date?: string | null
          agent_id?: string | null
          amount?: number | null
          assigned_to?: string | null
          buyer_name?: string | null
          client_id?: string | null
          client_name?: string | null
          company_id?: string | null
          contract_id?: string | null
          contract_signed_at?: string | null
          created_at?: string | null
          deal_date?: string | null
          developer_name?: string | null
          discount?: number | null
          expected_close_date?: string | null
          final_price?: number | null
          handover_date?: string | null
          id?: string
          lead_id?: string | null
          lost_reason?: string | null
          notes?: string | null
          payout_id?: string | null
          probability?: number | null
          project_name?: string | null
          property_type?: string | null
          source?: string | null
          stage?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          unit_id?: string | null
          unit_reservation_id?: string | null
          unit_value?: number | null
          updated_at?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "payouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_unit_reservation_id_fkey"
            columns: ["unit_reservation_id"]
            isOneToOne: false
            referencedRelation: "active_reservations_with_timer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_unit_reservation_id_fkey"
            columns: ["unit_reservation_id"]
            isOneToOne: false
            referencedRelation: "unit_reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      developers: {
        Row: {
          active: boolean | null
          address: string | null
          city: string | null
          class_grade: string | null
          contract_end_date: string | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          license_number: string | null
          logo_url: string | null
          name: string
          name_ar: string | null
          phone: string | null
          region: string | null
          tier: string | null
          website: string | null
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          city?: string | null
          class_grade?: string | null
          contract_end_date?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          license_number?: string | null
          logo_url?: string | null
          name: string
          name_ar?: string | null
          phone?: string | null
          region?: string | null
          tier?: string | null
          website?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string | null
          city?: string | null
          class_grade?: string | null
          contract_end_date?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          license_number?: string | null
          logo_url?: string | null
          name?: string
          name_ar?: string | null
          phone?: string | null
          region?: string | null
          tier?: string | null
          website?: string | null
        }
        Relationships: []
      }
      document_signatories: {
        Row: {
          company_id: string
          created_at: string
          decline_reason: string | null
          declined_at: string | null
          document_id: string
          id: string
          ip_address: unknown
          order_number: number
          sent_at: string | null
          signature_image_url: string | null
          signed_at: string | null
          signer_email: string | null
          signer_name: string
          signer_phone: string | null
          signer_type: string
          status: string
          user_agent: string | null
          viewed_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          decline_reason?: string | null
          declined_at?: string | null
          document_id: string
          id?: string
          ip_address?: unknown
          order_number?: number
          sent_at?: string | null
          signature_image_url?: string | null
          signed_at?: string | null
          signer_email?: string | null
          signer_name: string
          signer_phone?: string | null
          signer_type: string
          status?: string
          user_agent?: string | null
          viewed_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          decline_reason?: string | null
          declined_at?: string | null
          document_id?: string
          id?: string
          ip_address?: unknown
          order_number?: number
          sent_at?: string | null
          signature_image_url?: string | null
          signed_at?: string | null
          signer_email?: string | null
          signer_name?: string
          signer_phone?: string | null
          signer_type?: string
          status?: string
          user_agent?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_signatories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_signatories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "document_signatories_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          annual_leave_balance: number
          bank_account_name: string | null
          bank_account_number: string | null
          bank_iban: string | null
          bank_name: string | null
          base_salary: number
          company_id: string
          created_at: string
          department_id: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employee_number: string
          employment_type: string
          hire_date: string
          id: string
          job_title: string | null
          notes: string | null
          pay_cycle: string
          probation_end_date: string | null
          salary_currency: string
          social_insurance_no: string | null
          tax_id: string | null
          termination_date: string | null
          termination_reason: string | null
          updated_at: string
        }
        Insert: {
          annual_leave_balance?: number
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_iban?: string | null
          bank_name?: string | null
          base_salary?: number
          company_id: string
          created_at?: string
          department_id?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_number: string
          employment_type?: string
          hire_date: string
          id: string
          job_title?: string | null
          notes?: string | null
          pay_cycle?: string
          probation_end_date?: string | null
          salary_currency?: string
          social_insurance_no?: string | null
          tax_id?: string | null
          termination_date?: string | null
          termination_reason?: string | null
          updated_at?: string
        }
        Update: {
          annual_leave_balance?: number
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_iban?: string | null
          bank_name?: string | null
          base_salary?: number
          company_id?: string
          created_at?: string
          department_id?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_number?: string
          employment_type?: string
          hire_date?: string
          id?: string
          job_title?: string | null
          notes?: string | null
          pay_cycle?: string
          probation_end_date?: string | null
          salary_currency?: string
          social_insurance_no?: string | null
          tax_id?: string | null
          termination_date?: string | null
          termination_reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      eoi_records: {
        Row: {
          agent_id: string | null
          bank_reference: string | null
          client_id: string | null
          company_id: string
          converted_at: string | null
          converted_to_deal_id: string | null
          created_at: string
          currency: string
          eoi_amount: number
          eoi_date: string
          eoi_number: string
          expires_at: string | null
          id: string
          lead_id: string | null
          notes: string | null
          payment_method: string | null
          receipt_url: string | null
          status: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          bank_reference?: string | null
          client_id?: string | null
          company_id: string
          converted_at?: string | null
          converted_to_deal_id?: string | null
          created_at?: string
          currency?: string
          eoi_amount?: number
          eoi_date?: string
          eoi_number: string
          expires_at?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          status?: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          bank_reference?: string | null
          client_id?: string | null
          company_id?: string
          converted_at?: string | null
          converted_to_deal_id?: string | null
          created_at?: string
          currency?: string
          eoi_amount?: number
          eoi_date?: string
          eoi_number?: string
          expires_at?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          status?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eoi_records_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eoi_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eoi_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eoi_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "eoi_records_converted_to_deal_id_fkey"
            columns: ["converted_to_deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eoi_records_converted_to_deal_id_fkey"
            columns: ["converted_to_deal_id"]
            isOneToOne: false
            referencedRelation: "deals_kanban"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eoi_records_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eoi_records_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          category: string
          company_id: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string
          expense_date: string
          id: string
          notes: string | null
          receipt_url: string | null
          status: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          category: string
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description: string
          expense_date?: string
          id?: string
          notes?: string | null
          receipt_url?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string
          expense_date?: string
          id?: string
          notes?: string | null
          receipt_url?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_periods: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          company_id: string
          created_at: string
          id: string
          name: string
          period_end: string
          period_start: string
          status: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          company_id: string
          created_at?: string
          id?: string
          name: string
          period_end: string
          period_start: string
          status?: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          period_end?: string
          period_start?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_periods_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_periods_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_periods_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
        ]
      }
      installment_plans: {
        Row: {
          amount: number
          company_id: string
          contract_id: string
          created_at: string | null
          due_date: string
          id: string
          installment_number: number
          installment_type: string
          notes: string | null
          paid_amount: number | null
          paid_at: string | null
          payment_method: string | null
          receipt_number: string | null
          receipt_url: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          company_id: string
          contract_id: string
          created_at?: string | null
          due_date: string
          id?: string
          installment_number: number
          installment_type?: string
          notes?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          payment_method?: string | null
          receipt_number?: string | null
          receipt_url?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          company_id?: string
          contract_id?: string
          created_at?: string | null
          due_date?: string
          id?: string
          installment_number?: number
          installment_type?: string
          notes?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          payment_method?: string | null
          receipt_number?: string | null
          receipt_url?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "installment_plans_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installment_plans_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      installments: {
        Row: {
          amount: number
          company_id: string | null
          created_at: string | null
          deal_id: string | null
          due_date: string
          id: string
          installment_number: number
          paid_date: string | null
          status: string | null
        }
        Insert: {
          amount: number
          company_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          due_date: string
          id?: string
          installment_number: number
          paid_date?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          company_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          due_date?: string
          id?: string
          installment_number?: number
          paid_date?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "installments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
        ]
      }
      inventory: {
        Row: {
          area: number | null
          bathrooms: number | null
          bedrooms: number | null
          building_id: string | null
          company_id: string | null
          compound: string
          created_at: string | null
          delivery_date: string | null
          developer: string
          developer_id: string | null
          finishing_status: string | null
          finishing_type: string | null
          floor: string | null
          garden_area: number | null
          has_garden: boolean | null
          has_roof: boolean | null
          id: string
          maintenance_pct: number | null
          notes: string | null
          orientation: string | null
          payment_plan: Json | null
          price: number
          project_id: string | null
          project_name: string | null
          property_type: string | null
          reception_count: number | null
          roof_area: number | null
          rooms: number | null
          search_vector: unknown
          status: string | null
          tags: string[] | null
          unit_name: string | null
          unit_number: string | null
          unit_type: string | null
          view_type: string | null
        }
        Insert: {
          area?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          building_id?: string | null
          company_id?: string | null
          compound: string
          created_at?: string | null
          delivery_date?: string | null
          developer: string
          developer_id?: string | null
          finishing_status?: string | null
          finishing_type?: string | null
          floor?: string | null
          garden_area?: number | null
          has_garden?: boolean | null
          has_roof?: boolean | null
          id?: string
          maintenance_pct?: number | null
          notes?: string | null
          orientation?: string | null
          payment_plan?: Json | null
          price: number
          project_id?: string | null
          project_name?: string | null
          property_type?: string | null
          reception_count?: number | null
          roof_area?: number | null
          rooms?: number | null
          search_vector?: unknown
          status?: string | null
          tags?: string[] | null
          unit_name?: string | null
          unit_number?: string | null
          unit_type?: string | null
          view_type?: string | null
        }
        Update: {
          area?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          building_id?: string | null
          company_id?: string | null
          compound?: string
          created_at?: string | null
          delivery_date?: string | null
          developer?: string
          developer_id?: string | null
          finishing_status?: string | null
          finishing_type?: string | null
          floor?: string | null
          garden_area?: number | null
          has_garden?: boolean | null
          has_roof?: boolean | null
          id?: string
          maintenance_pct?: number | null
          notes?: string | null
          orientation?: string | null
          payment_plan?: Json | null
          price?: number
          project_id?: string | null
          project_name?: string | null
          property_type?: string | null
          reception_count?: number | null
          roof_area?: number | null
          rooms?: number | null
          search_vector?: unknown
          status?: string | null
          tags?: string[] | null
          unit_name?: string | null
          unit_number?: string | null
          unit_type?: string | null
          view_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "inventory_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          description: string
          entry_date: string
          entry_number: string
          fiscal_period_id: string | null
          id: string
          is_posted: boolean
          is_reversed: boolean
          posted_at: string | null
          posted_by: string | null
          reference: string | null
          reversal_of_id: string | null
          source: string
          source_id: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          description: string
          entry_date?: string
          entry_number: string
          fiscal_period_id?: string | null
          id?: string
          is_posted?: boolean
          is_reversed?: boolean
          posted_at?: string | null
          posted_by?: string | null
          reference?: string | null
          reversal_of_id?: string | null
          source?: string
          source_id?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string
          entry_date?: string
          entry_number?: string
          fiscal_period_id?: string | null
          id?: string
          is_posted?: boolean
          is_reversed?: boolean
          posted_at?: string | null
          posted_by?: string | null
          reference?: string | null
          reversal_of_id?: string | null
          source?: string
          source_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "journal_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_fiscal_period_id_fkey"
            columns: ["fiscal_period_id"]
            isOneToOne: false
            referencedRelation: "fiscal_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_reversal_of_id_fkey"
            columns: ["reversal_of_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_lines: {
        Row: {
          account_id: string
          company_id: string
          created_at: string
          credit: number
          debit: number
          description: string | null
          entry_id: string
          id: string
        }
        Insert: {
          account_id: string
          company_id: string
          created_at?: string
          credit?: number
          debit?: number
          description?: string | null
          entry_id: string
          id?: string
        }
        Update: {
          account_id?: string
          company_id?: string
          created_at?: string
          credit?: number
          debit?: number
          description?: string | null
          entry_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "journal_lines_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_records: {
        Row: {
          actual_value: number
          company_id: string
          created_at: string
          employee_id: string
          id: string
          notes: string | null
          period_month: number
          period_year: number
          recorded_by: string | null
          target_value: number
          template_id: string
          updated_at: string
        }
        Insert: {
          actual_value?: number
          company_id: string
          created_at?: string
          employee_id: string
          id?: string
          notes?: string | null
          period_month: number
          period_year: number
          recorded_by?: string | null
          target_value?: number
          template_id: string
          updated_at?: string
        }
        Update: {
          actual_value?: number
          company_id?: string
          created_at?: string
          employee_id?: string
          id?: string
          notes?: string | null
          period_month?: number
          period_year?: number
          recorded_by?: string | null
          target_value?: number
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kpi_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "kpi_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_records_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_records_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "kpi_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_templates: {
        Row: {
          applies_to_role: string | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          metric_type: string
          name: string
          name_ar: string | null
          sort_order: number
          target_formula: string
          weight_pct: number
        }
        Insert: {
          applies_to_role?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          metric_type?: string
          name: string
          name_ar?: string | null
          sort_order?: number
          target_formula?: string
          weight_pct?: number
        }
        Update: {
          applies_to_role?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          metric_type?: string
          name?: string
          name_ar?: string | null
          sort_order?: number
          target_formula?: string
          weight_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "kpi_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          company_id: string | null
          created_at: string | null
          duration_min: number | null
          id: string
          lead_id: string
          note: string | null
          outcome: string | null
          scheduled_at: string | null
          type: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          duration_min?: number | null
          id?: string
          lead_id: string
          note?: string | null
          outcome?: string | null
          scheduled_at?: string | null
          type: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          duration_min?: number | null
          id?: string
          lead_id?: string
          note?: string | null
          outcome?: string | null
          scheduled_at?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_reports: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          lead_id: string | null
          report_text: string
          status_logged: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          report_text: string
          status_logged?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          report_text?: string
          status_logged?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "lead_reports_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_sources: {
        Row: {
          channel: string | null
          company_id: string
          conversion_rate: number | null
          converted_leads: number | null
          cost_per_lead: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          name_en: string | null
          sort_order: number | null
          total_leads: number | null
          type: string
        }
        Insert: {
          channel?: string | null
          company_id: string
          conversion_rate?: number | null
          converted_leads?: number | null
          cost_per_lead?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_en?: string | null
          sort_order?: number | null
          total_leads?: number | null
          type?: string
        }
        Update: {
          channel?: string | null
          company_id?: string
          conversion_rate?: number | null
          converted_leads?: number | null
          cost_per_lead?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_en?: string | null
          sort_order?: number | null
          total_leads?: number | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_sources_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          budget: number | null
          budget_max: number | null
          budget_min: number | null
          client_name: string | null
          company_id: string | null
          created_at: string | null
          district: string | null
          email: string | null
          expected_value: number | null
          floor_pref: string | null
          full_name: string | null
          id: string
          interest: string | null
          language: string | null
          last_contact_at: string | null
          lead_score: number | null
          name: string | null
          nationality: string | null
          next_followup_date: string | null
          notes: string | null
          phone: string | null
          preferred_area: string | null
          property_type: string | null
          referrer_id: string | null
          score: number | null
          search_vector: unknown
          source: string | null
          source_id: string | null
          status: string | null
          temperature: string | null
          timeline: string | null
          unit_type_pref: string | null
          updated_at: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          whatsapp: string | null
        }
        Insert: {
          assigned_to?: string | null
          budget?: number | null
          budget_max?: number | null
          budget_min?: number | null
          client_name?: string | null
          company_id?: string | null
          created_at?: string | null
          district?: string | null
          email?: string | null
          expected_value?: number | null
          floor_pref?: string | null
          full_name?: string | null
          id?: string
          interest?: string | null
          language?: string | null
          last_contact_at?: string | null
          lead_score?: number | null
          name?: string | null
          nationality?: string | null
          next_followup_date?: string | null
          notes?: string | null
          phone?: string | null
          preferred_area?: string | null
          property_type?: string | null
          referrer_id?: string | null
          score?: number | null
          search_vector?: unknown
          source?: string | null
          source_id?: string | null
          status?: string | null
          temperature?: string | null
          timeline?: string | null
          unit_type_pref?: string | null
          updated_at?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          whatsapp?: string | null
        }
        Update: {
          assigned_to?: string | null
          budget?: number | null
          budget_max?: number | null
          budget_min?: number | null
          client_name?: string | null
          company_id?: string | null
          created_at?: string | null
          district?: string | null
          email?: string | null
          expected_value?: number | null
          floor_pref?: string | null
          full_name?: string | null
          id?: string
          interest?: string | null
          language?: string | null
          last_contact_at?: string | null
          lead_score?: number | null
          name?: string | null
          nationality?: string | null
          next_followup_date?: string | null
          notes?: string | null
          phone?: string | null
          preferred_area?: string | null
          property_type?: string | null
          referrer_id?: string | null
          score?: number | null
          search_vector?: unknown
          source?: string | null
          source_id?: string | null
          status?: string | null
          temperature?: string | null
          timeline?: string | null
          unit_type_pref?: string | null
          updated_at?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "lead_source_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "lead_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          approved_by: string | null
          company_id: string
          created_at: string
          days_count: number
          decided_at: string | null
          employee_id: string
          end_date: string
          id: string
          leave_type_id: string
          manager_notes: string | null
          reason: string | null
          start_date: string
          status: string
        }
        Insert: {
          approved_by?: string | null
          company_id: string
          created_at?: string
          days_count: number
          decided_at?: string | null
          employee_id: string
          end_date: string
          id?: string
          leave_type_id: string
          manager_notes?: string | null
          reason?: string | null
          start_date: string
          status?: string
        }
        Update: {
          approved_by?: string | null
          company_id?: string
          created_at?: string
          days_count?: number
          decided_at?: string | null
          employee_id?: string
          end_date?: string
          id?: string
          leave_type_id?: string
          manager_notes?: string | null
          reason?: string | null
          start_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_types: {
        Row: {
          carry_over_days: number
          company_id: string
          created_at: string
          days_per_year: number
          id: string
          is_active: boolean
          is_paid: boolean
          name: string
          name_ar: string | null
          requires_approval: boolean
        }
        Insert: {
          carry_over_days?: number
          company_id: string
          created_at?: string
          days_per_year?: number
          id?: string
          is_active?: boolean
          is_paid?: boolean
          name: string
          name_ar?: string | null
          requires_approval?: boolean
        }
        Update: {
          carry_over_days?: number
          company_id?: string
          created_at?: string
          days_per_year?: number
          id?: string
          is_active?: boolean
          is_paid?: boolean
          name?: string
          name_ar?: string | null
          requires_approval?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "leave_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
        ]
      }
      legal_audit_logs: {
        Row: {
          action: string
          actor_id: string
          actor_name: string | null
          actor_role: string | null
          company_id: string
          created_at: string
          details: Json
          document_id: string | null
          id: string
          ip_address: unknown
          new_status: string | null
          old_status: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id: string
          actor_name?: string | null
          actor_role?: string | null
          company_id: string
          created_at?: string
          details?: Json
          document_id?: string | null
          id?: string
          ip_address?: unknown
          new_status?: string | null
          old_status?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          actor_name?: string | null
          actor_role?: string | null
          company_id?: string
          created_at?: string
          details?: Json
          document_id?: string | null
          id?: string
          ip_address?: unknown
          new_status?: string | null
          old_status?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legal_audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "legal_audit_logs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_documents: {
        Row: {
          cancel_reason: string | null
          cancelled_at: string | null
          client_id: string | null
          client_name: string | null
          company_id: string
          created_at: string
          deal_id: string | null
          document_number: string
          document_type: string
          generated_by: string
          generated_html: string | null
          id: string
          notes: string | null
          pdf_url: string | null
          signed_at: string | null
          signed_pdf_url: string | null
          status: string
          template_id: string | null
          title: string
          unit_id: string | null
          updated_at: string
          valid_until: string | null
          variables_snapshot: Json
        }
        Insert: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          client_id?: string | null
          client_name?: string | null
          company_id: string
          created_at?: string
          deal_id?: string | null
          document_number: string
          document_type: string
          generated_by: string
          generated_html?: string | null
          id?: string
          notes?: string | null
          pdf_url?: string | null
          signed_at?: string | null
          signed_pdf_url?: string | null
          status?: string
          template_id?: string | null
          title: string
          unit_id?: string | null
          updated_at?: string
          valid_until?: string | null
          variables_snapshot?: Json
        }
        Update: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          client_id?: string | null
          client_name?: string | null
          company_id?: string
          created_at?: string
          deal_id?: string | null
          document_number?: string
          document_type?: string
          generated_by?: string
          generated_html?: string | null
          id?: string
          notes?: string | null
          pdf_url?: string | null
          signed_at?: string | null
          signed_pdf_url?: string | null
          status?: string
          template_id?: string | null
          title?: string
          unit_id?: string | null
          updated_at?: string
          valid_until?: string | null
          variables_snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "legal_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "legal_documents_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_documents_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals_kanban"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_documents_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_documents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contract_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_documents_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_templates: {
        Row: {
          company_id: string
          content_html: string | null
          content_json: Json | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          required_variables: string[]
          template_type: string
          updated_at: string
        }
        Insert: {
          company_id: string
          content_html?: string | null
          content_json?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          required_variables?: string[]
          template_type: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          content_html?: string | null
          content_json?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          required_variables?: string[]
          template_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
        ]
      }
      message_templates: {
        Row: {
          body_ar: string
          body_en: string | null
          channel: string
          company_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          key: string
          name: string
          subject: string | null
          usage_count: number | null
        }
        Insert: {
          body_ar: string
          body_en?: string | null
          channel?: string
          company_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key: string
          name: string
          subject?: string | null
          usage_count?: number | null
        }
        Update: {
          body_ar?: string
          body_en?: string | null
          channel?: string
          company_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key?: string
          name?: string
          subject?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "message_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          company_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          read_at: string | null
          related_entity_id: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          read_at?: string | null
          related_entity_id?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          read_at?: string | null
          related_entity_id?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
        ]
      }
      payment_plans: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          down_payment_percentage: number | null
          id: string
          installment_frequency: string | null
          installment_years: number | null
          maintenance_fee_percentage: number | null
          name: string
          unit_id: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          down_payment_percentage?: number | null
          id?: string
          installment_frequency?: string | null
          installment_years?: number | null
          maintenance_fee_percentage?: number | null
          name: string
          unit_id?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          down_payment_percentage?: number | null
          id?: string
          installment_frequency?: string | null
          installment_years?: number | null
          maintenance_fee_percentage?: number | null
          name?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_plans_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_receipts: {
        Row: {
          amount: number
          bank_reference: string | null
          client_name: string
          client_national_id: string | null
          client_phone: string | null
          company_id: string
          created_at: string
          currency: string
          id: string
          is_void: boolean
          issued_by: string
          notes: string | null
          payment_date: string
          payment_method: string | null
          pdf_url: string | null
          receipt_number: string
          receipt_type: string
          source_id: string | null
          source_type: string | null
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          amount: number
          bank_reference?: string | null
          client_name: string
          client_national_id?: string | null
          client_phone?: string | null
          company_id: string
          created_at?: string
          currency?: string
          id?: string
          is_void?: boolean
          issued_by: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          pdf_url?: string | null
          receipt_number: string
          receipt_type?: string
          source_id?: string | null
          source_type?: string | null
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          amount?: number
          bank_reference?: string | null
          client_name?: string
          client_national_id?: string | null
          client_phone?: string | null
          company_id?: string
          created_at?: string
          currency?: string
          id?: string
          is_void?: boolean
          issued_by?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          pdf_url?: string | null
          receipt_number?: string
          receipt_type?: string
          source_id?: string | null
          source_type?: string | null
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_receipts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_receipts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "payment_receipts_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_receipts_voided_by_fkey"
            columns: ["voided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_items: {
        Row: {
          agent_id: string
          amount: number
          commission_id: string | null
          company_id: string | null
          created_at: string | null
          deal_id: string | null
          description: string | null
          id: string
          net_amount: number | null
          paid_at: string | null
          payout_id: string
          status: string | null
          tax_amount: number | null
        }
        Insert: {
          agent_id: string
          amount: number
          commission_id?: string | null
          company_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          description?: string | null
          id?: string
          net_amount?: number | null
          paid_at?: string | null
          payout_id: string
          status?: string | null
          tax_amount?: number | null
        }
        Update: {
          agent_id?: string
          amount?: number
          commission_id?: string | null
          company_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          description?: string | null
          id?: string
          net_amount?: number | null
          paid_at?: string | null
          payout_id?: string
          status?: string | null
          tax_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payout_items_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_items_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "commissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "payout_items_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_items_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals_kanban"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_items_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "payouts"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          paid_at: string | null
          period_month: number
          period_year: number
          status: string
          title: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          period_month: number
          period_year: number
          status?: string
          title: string
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          period_month?: number
          period_year?: number
          status?: string
          title?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payouts_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_items: {
        Row: {
          absent_days: number
          allowances: number
          attendance_days: number
          base_salary: number
          bonus_amount: number
          commission_amount: number
          company_id: string
          created_at: string
          deduction_advances: number
          deduction_insurance: number
          deduction_other: number
          deduction_tax: number
          employee_id: string
          gross_salary: number | null
          id: string
          net_salary: number | null
          notes: string | null
          overtime_amount: number
          overtime_hours: number
          run_id: string
        }
        Insert: {
          absent_days?: number
          allowances?: number
          attendance_days?: number
          base_salary?: number
          bonus_amount?: number
          commission_amount?: number
          company_id: string
          created_at?: string
          deduction_advances?: number
          deduction_insurance?: number
          deduction_other?: number
          deduction_tax?: number
          employee_id: string
          gross_salary?: number | null
          id?: string
          net_salary?: number | null
          notes?: string | null
          overtime_amount?: number
          overtime_hours?: number
          run_id: string
        }
        Update: {
          absent_days?: number
          allowances?: number
          attendance_days?: number
          base_salary?: number
          bonus_amount?: number
          commission_amount?: number
          company_id?: string
          created_at?: string
          deduction_advances?: number
          deduction_insurance?: number
          deduction_other?: number
          deduction_tax?: number
          employee_id?: string
          gross_salary?: number | null
          id?: string
          net_salary?: number | null
          notes?: string | null
          overtime_amount?: number
          overtime_hours?: number
          run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "payroll_items_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_items_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "payroll_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_runs: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_id: string
          created_at: string
          created_by: string
          employee_count: number
          id: string
          notes: string | null
          paid_at: string | null
          period_month: number
          period_year: number
          run_date: string
          run_number: string
          status: string
          total_deductions: number
          total_gross: number
          total_net: number
          total_tax: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          created_at?: string
          created_by: string
          employee_count?: number
          id?: string
          notes?: string | null
          paid_at?: string | null
          period_month: number
          period_year: number
          run_date?: string
          run_number: string
          status?: string
          total_deductions?: number
          total_gross?: number
          total_net?: number
          total_tax?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          created_at?: string
          created_by?: string
          employee_count?: number
          id?: string
          notes?: string | null
          paid_at?: string | null
          period_month?: number
          period_year?: number
          run_date?: string
          run_number?: string
          status?: string
          total_deductions?: number
          total_gross?: number
          total_net?: number
          total_tax?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_runs_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_runs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_runs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "payroll_runs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          created_at: string | null
          description: string | null
          id: string
          key: string
          resource: string
        }
        Insert: {
          action: string
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          resource: string
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          resource?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string | null
          avatar_url: string | null
          branch_id: string | null
          client_notes: string | null
          commercial_reg_no: string | null
          company_id: string | null
          company_name: string | null
          created_at: string | null
          email: string | null
          full_name: string
          hire_date: string | null
          id: string
          id_document_url: string | null
          is_active: boolean | null
          license_document_url: string | null
          national_id: string | null
          notification_prefs: Json | null
          phone: string | null
          preferred_contact: string | null
          region: string | null
          role: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          account_type?: string | null
          avatar_url?: string | null
          branch_id?: string | null
          client_notes?: string | null
          commercial_reg_no?: string | null
          company_id?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          hire_date?: string | null
          id: string
          id_document_url?: string | null
          is_active?: boolean | null
          license_document_url?: string | null
          national_id?: string | null
          notification_prefs?: Json | null
          phone?: string | null
          preferred_contact?: string | null
          region?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          account_type?: string | null
          avatar_url?: string | null
          branch_id?: string | null
          client_notes?: string | null
          commercial_reg_no?: string | null
          company_id?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          hire_date?: string | null
          id?: string
          id_document_url?: string | null
          is_active?: boolean | null
          license_document_url?: string | null
          national_id?: string | null
          notification_prefs?: Json | null
          phone?: string | null
          preferred_contact?: string | null
          region?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_amenities: {
        Row: {
          category: string
          icon: string | null
          id: string
          is_available: boolean | null
          name_ar: string
          name_en: string | null
          project_id: string
          sort_order: number | null
        }
        Insert: {
          category?: string
          icon?: string | null
          id?: string
          is_available?: boolean | null
          name_ar: string
          name_en?: string | null
          project_id: string
          sort_order?: number | null
        }
        Update: {
          category?: string
          icon?: string | null
          id?: string
          is_available?: boolean | null
          name_ar?: string
          name_en?: string | null
          project_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_amenities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_documents: {
        Row: {
          company_id: string
          created_at: string | null
          download_count: number | null
          file_size: number | null
          id: string
          is_active: boolean | null
          is_public: boolean | null
          language: string | null
          mime_type: string | null
          name: string
          project_id: string
          type: string
          updated_at: string | null
          url: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          download_count?: number | null
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          language?: string | null
          mime_type?: string | null
          name: string
          project_id: string
          type?: string
          updated_at?: string | null
          url: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          download_count?: number | null
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          language?: string | null
          mime_type?: string | null
          name?: string
          project_id?: string
          type?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_media: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          is_primary: boolean | null
          project_id: string
          sort_order: number | null
          thumbnail_url: string | null
          title: string | null
          type: string
          url: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          project_id: string
          sort_order?: number | null
          thumbnail_url?: string | null
          title?: string | null
          type?: string
          url: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          project_id?: string
          sort_order?: number | null
          thumbnail_url?: string | null
          title?: string | null
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_media_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_media_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          amenities: string[] | null
          area_type: string | null
          available_units: number | null
          city: string | null
          commission_pct: number | null
          company_id: string | null
          cover_image: string | null
          cover_image_url: string | null
          created_at: string | null
          delivery_date: string | null
          delivery_year: number | null
          description: string | null
          developer_id: string | null
          developer_name: string | null
          down_payment_pct: number | null
          featured: boolean | null
          gallery_urls: string[] | null
          id: string
          images: string[] | null
          is_featured: boolean | null
          lat: number | null
          latitude: number | null
          lng: number | null
          location: string | null
          longitude: number | null
          max_area: number | null
          max_price: number | null
          min_area: number | null
          min_price: number | null
          name: string
          name_ar: string | null
          payment_years: number | null
          project_type: string | null
          search_vector: unknown
          slug: string | null
          status: string | null
          tags: string[] | null
          total_units: number | null
          updated_at: string | null
        }
        Insert: {
          amenities?: string[] | null
          area_type?: string | null
          available_units?: number | null
          city?: string | null
          commission_pct?: number | null
          company_id?: string | null
          cover_image?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          delivery_date?: string | null
          delivery_year?: number | null
          description?: string | null
          developer_id?: string | null
          developer_name?: string | null
          down_payment_pct?: number | null
          featured?: boolean | null
          gallery_urls?: string[] | null
          id?: string
          images?: string[] | null
          is_featured?: boolean | null
          lat?: number | null
          latitude?: number | null
          lng?: number | null
          location?: string | null
          longitude?: number | null
          max_area?: number | null
          max_price?: number | null
          min_area?: number | null
          min_price?: number | null
          name: string
          name_ar?: string | null
          payment_years?: number | null
          project_type?: string | null
          search_vector?: unknown
          slug?: string | null
          status?: string | null
          tags?: string[] | null
          total_units?: number | null
          updated_at?: string | null
        }
        Update: {
          amenities?: string[] | null
          area_type?: string | null
          available_units?: number | null
          city?: string | null
          commission_pct?: number | null
          company_id?: string | null
          cover_image?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          delivery_date?: string | null
          delivery_year?: number | null
          description?: string | null
          developer_id?: string | null
          developer_name?: string | null
          down_payment_pct?: number | null
          featured?: boolean | null
          gallery_urls?: string[] | null
          id?: string
          images?: string[] | null
          is_featured?: boolean | null
          lat?: number | null
          latitude?: number | null
          lng?: number | null
          location?: string | null
          longitude?: number | null
          max_area?: number | null
          max_price?: number | null
          min_area?: number | null
          min_price?: number | null
          name?: string
          name_ar?: string | null
          payment_years?: number | null
          project_type?: string | null
          search_vector?: unknown
          slug?: string | null
          status?: string | null
          tags?: string[] | null
          total_units?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "projects_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          commission_rate: number | null
          company_id: string
          created_at: string
          id: string
          location: string
          price: number | null
          property_name: string
          property_type: string
          status: string | null
        }
        Insert: {
          commission_rate?: number | null
          company_id: string
          created_at?: string
          id?: string
          location: string
          price?: number | null
          property_name: string
          property_type: string
          status?: string | null
        }
        Update: {
          commission_rate?: number | null
          company_id?: string
          created_at?: string
          id?: string
          location?: string
          price?: number | null
          property_name?: string
          property_type?: string
          status?: string | null
        }
        Relationships: []
      }
      reconciliation_runs: {
        Row: {
          bank_account_id: string
          closing_balance: number
          company_id: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          difference: number | null
          gl_balance: number
          id: string
          notes: string | null
          opening_balance: number
          period_end: string
          period_start: string
          status: string
        }
        Insert: {
          bank_account_id: string
          closing_balance?: number
          company_id: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          difference?: number | null
          gl_balance?: number
          id?: string
          notes?: string | null
          opening_balance?: number
          period_end: string
          period_start: string
          status?: string
        }
        Update: {
          bank_account_id?: string
          closing_balance?: number
          company_id?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          difference?: number | null
          gl_balance?: number
          id?: string
          notes?: string | null
          opening_balance?: number
          period_end?: string
          period_start?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_runs_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_runs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_runs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "reconciliation_runs_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          company_id: string
          created_at: string | null
          deal_id: string | null
          id: string
          lead_id: string | null
          notes: string | null
          referrer_id: string | null
          referrer_name: string | null
          referrer_phone: string | null
          referrer_type: string
          reward_paid_at: string | null
          reward_status: string | null
          reward_type: string | null
          reward_value: number | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          deal_id?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          referrer_id?: string | null
          referrer_name?: string | null
          referrer_phone?: string | null
          referrer_type?: string
          reward_paid_at?: string | null
          reward_status?: string | null
          reward_type?: string | null
          reward_value?: number | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          deal_id?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          referrer_id?: string | null
          referrer_name?: string | null
          referrer_phone?: string | null
          referrer_type?: string
          reward_paid_at?: string | null
          reward_status?: string | null
          reward_type?: string | null
          reward_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals_kanban"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resale_listings: {
        Row: {
          agent_id: string | null
          area_sqm: number | null
          asking_price: number
          bathrooms: number | null
          bedrooms: number | null
          building: string | null
          company_id: string | null
          created_at: string | null
          finishing: string | null
          floor: number | null
          id: string
          images: string[] | null
          installment_remaining: number | null
          is_verified: boolean | null
          original_price: number | null
          project_name: string
          seller_name: string | null
          seller_notes: string | null
          seller_phone: string | null
          sold_at: string | null
          status: string | null
          unit_number: string | null
          unit_type: string | null
          updated_at: string | null
          views: number | null
        }
        Insert: {
          agent_id?: string | null
          area_sqm?: number | null
          asking_price: number
          bathrooms?: number | null
          bedrooms?: number | null
          building?: string | null
          company_id?: string | null
          created_at?: string | null
          finishing?: string | null
          floor?: number | null
          id?: string
          images?: string[] | null
          installment_remaining?: number | null
          is_verified?: boolean | null
          original_price?: number | null
          project_name: string
          seller_name?: string | null
          seller_notes?: string | null
          seller_phone?: string | null
          sold_at?: string | null
          status?: string | null
          unit_number?: string | null
          unit_type?: string | null
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          agent_id?: string | null
          area_sqm?: number | null
          asking_price?: number
          bathrooms?: number | null
          bedrooms?: number | null
          building?: string | null
          company_id?: string | null
          created_at?: string | null
          finishing?: string | null
          floor?: number | null
          id?: string
          images?: string[] | null
          installment_remaining?: number | null
          is_verified?: boolean | null
          original_price?: number | null
          project_name?: string
          seller_name?: string | null
          seller_notes?: string | null
          seller_phone?: string | null
          sold_at?: string | null
          status?: string | null
          unit_number?: string | null
          unit_type?: string | null
          updated_at?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "resale_listings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resale_listings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string | null
          granted: boolean | null
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string | null
          granted?: boolean | null
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string | null
          granted?: boolean | null
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          department_id: string | null
          description: string | null
          id: string
          is_system: boolean | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          department_id?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          department_id?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_logs: {
        Row: {
          company_id: string
          cost: number | null
          created_at: string | null
          delivered_at: string | null
          failed_reason: string | null
          id: string
          lead_id: string | null
          message: string
          provider: string | null
          provider_msg_id: string | null
          recipient_name: string | null
          recipient_phone: string
          sent_at: string | null
          sent_by: string | null
          status: string
          template_key: string | null
        }
        Insert: {
          company_id: string
          cost?: number | null
          created_at?: string | null
          delivered_at?: string | null
          failed_reason?: string | null
          id?: string
          lead_id?: string | null
          message: string
          provider?: string | null
          provider_msg_id?: string | null
          recipient_name?: string | null
          recipient_phone: string
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          template_key?: string | null
        }
        Update: {
          company_id?: string
          cost?: number | null
          created_at?: string | null
          delivered_at?: string | null
          failed_reason?: string | null
          id?: string
          lead_id?: string | null
          message?: string
          provider?: string | null
          provider_msg_id?: string | null
          recipient_name?: string | null
          recipient_phone?: string
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          template_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_logs_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_invoices: {
        Row: {
          attempt_count: number
          company_id: string
          created_at: string
          currency: string
          due_date: string | null
          id: string
          invoice_number: string
          last_attempt_at: string | null
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          payment_reference: string | null
          pdf_url: string | null
          period_end: string
          period_start: string
          status: string
          subscription_id: string
          subtotal: number
          tax_amount: number
          total_amount: number
        }
        Insert: {
          attempt_count?: number
          company_id: string
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          invoice_number: string
          last_attempt_at?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          pdf_url?: string | null
          period_end: string
          period_start: string
          status?: string
          subscription_id: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
        }
        Update: {
          attempt_count?: number
          company_id?: string
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          last_attempt_at?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          pdf_url?: string | null
          period_end?: string
          period_start?: string
          status?: string
          subscription_id?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "subscription_invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "subscription_invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "tenant_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          feature_flags: Json
          id: string
          is_active: boolean
          max_listings: number
          max_storage_gb: number
          max_users: number
          name: string
          price_annual: number
          price_monthly: number
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          feature_flags?: Json
          id?: string
          is_active?: boolean
          max_listings?: number
          max_storage_gb?: number
          max_users?: number
          name: string
          price_annual?: number
          price_monthly?: number
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          feature_flags?: Json
          id?: string
          is_active?: boolean
          max_listings?: number
          max_storage_gb?: number
          max_users?: number
          name?: string
          price_annual?: number
          price_monthly?: number
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string | null
          company_id: string | null
          created_at: string | null
          description: string | null
          id: string
          priority: string
          resolution_notes: string | null
          resolved_at: string | null
          status: string
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
        ]
      }
      targets: {
        Row: {
          achieved_deals: number | null
          achieved_revenue: number | null
          agent_id: string | null
          company_id: string | null
          created_at: string | null
          deals_target: number | null
          id: string
          leads_actual: number | null
          leads_target: number | null
          month: string | null
          period_month: number | null
          period_year: number | null
          revenue_target: number | null
          target_deals: number | null
          target_revenue: number | null
        }
        Insert: {
          achieved_deals?: number | null
          achieved_revenue?: number | null
          agent_id?: string | null
          company_id?: string | null
          created_at?: string | null
          deals_target?: number | null
          id?: string
          leads_actual?: number | null
          leads_target?: number | null
          month?: string | null
          period_month?: number | null
          period_year?: number | null
          revenue_target?: number | null
          target_deals?: number | null
          target_revenue?: number | null
        }
        Update: {
          achieved_deals?: number | null
          achieved_revenue?: number | null
          agent_id?: string | null
          company_id?: string | null
          created_at?: string | null
          deals_target?: number | null
          id?: string
          leads_actual?: number | null
          leads_target?: number | null
          month?: string | null
          period_month?: number | null
          period_year?: number | null
          revenue_target?: number | null
          target_deals?: number | null
          target_revenue?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "targets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "targets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
        ]
      }
      team_members: {
        Row: {
          company_id: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          role: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          role?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
        ]
      }
      tenant_subscriptions: {
        Row: {
          amount: number
          billing_cycle: string
          cancel_at_period_end: boolean
          cancel_reason: string | null
          cancelled_at: string | null
          company_id: string
          created_at: string
          currency: string
          current_period_end: string
          current_period_start: string
          grace_period_ends_at: string | null
          id: string
          metadata: Json
          next_billing_date: string | null
          payment_method_last4: string | null
          payment_method_type: string | null
          payment_provider: string | null
          plan_id: string
          provider_customer_id: string | null
          provider_subscription_id: string | null
          status: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          billing_cycle?: string
          cancel_at_period_end?: boolean
          cancel_reason?: string | null
          cancelled_at?: string | null
          company_id: string
          created_at?: string
          currency?: string
          current_period_end?: string
          current_period_start?: string
          grace_period_ends_at?: string | null
          id?: string
          metadata?: Json
          next_billing_date?: string | null
          payment_method_last4?: string | null
          payment_method_type?: string | null
          payment_provider?: string | null
          plan_id: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          billing_cycle?: string
          cancel_at_period_end?: boolean
          cancel_reason?: string | null
          cancelled_at?: string | null
          company_id?: string
          created_at?: string
          currency?: string
          current_period_end?: string
          current_period_start?: string
          grace_period_ends_at?: string | null
          id?: string
          metadata?: Json
          next_billing_date?: string | null
          payment_method_last4?: string | null
          payment_method_type?: string | null
          payment_provider?: string | null
          plan_id?: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "tenant_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          ad_id: string | null
          amount: number
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          currency: string | null
          id: string
          notes: string | null
          package_id: string | null
          payment_id: string | null
          payment_method: string | null
          points_earned: number | null
          points_spent: number | null
          provider_payload: Json
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ad_id?: string | null
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          notes?: string | null
          package_id?: string | null
          payment_id?: string | null
          payment_method?: string | null
          points_earned?: number | null
          points_spent?: number | null
          provider_payload?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ad_id?: string | null
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          notes?: string | null
          package_id?: string | null
          payment_id?: string | null
          payment_method?: string | null
          points_earned?: number | null
          points_spent?: number | null
          provider_payload?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "ad_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_media: {
        Row: {
          company_id: string
          created_at: string | null
          description: string | null
          file_size: number | null
          height: number | null
          id: string
          is_primary: boolean | null
          mime_type: string | null
          sort_order: number | null
          thumbnail_url: string | null
          title: string | null
          type: string
          unit_id: string
          url: string
          width: number | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          description?: string | null
          file_size?: number | null
          height?: number | null
          id?: string
          is_primary?: boolean | null
          mime_type?: string | null
          sort_order?: number | null
          thumbnail_url?: string | null
          title?: string | null
          type?: string
          unit_id: string
          url: string
          width?: number | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          description?: string | null
          file_size?: number | null
          height?: number | null
          id?: string
          is_primary?: boolean | null
          mime_type?: string | null
          sort_order?: number | null
          thumbnail_url?: string | null
          title?: string | null
          type?: string
          unit_id?: string
          url?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "unit_media_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_media_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_reservations: {
        Row: {
          agent_id: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          client_name: string | null
          client_phone: string | null
          company_id: string | null
          converted_at: string | null
          created_at: string | null
          deal_id: string | null
          deposit_amount: number | null
          expires_at: string | null
          extension_count: number | null
          id: string
          lead_id: string | null
          max_extensions: number | null
          notes: string | null
          receipt_url: string | null
          reservation_fee: number | null
          reserved_at: string | null
          reserved_by: string | null
          status: string | null
          unit_id: string
        }
        Insert: {
          agent_id?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          client_name?: string | null
          client_phone?: string | null
          company_id?: string | null
          converted_at?: string | null
          created_at?: string | null
          deal_id?: string | null
          deposit_amount?: number | null
          expires_at?: string | null
          extension_count?: number | null
          id?: string
          lead_id?: string | null
          max_extensions?: number | null
          notes?: string | null
          receipt_url?: string | null
          reservation_fee?: number | null
          reserved_at?: string | null
          reserved_by?: string | null
          status?: string | null
          unit_id: string
        }
        Update: {
          agent_id?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          client_name?: string | null
          client_phone?: string | null
          company_id?: string | null
          converted_at?: string | null
          created_at?: string | null
          deal_id?: string | null
          deposit_amount?: number | null
          expires_at?: string | null
          extension_count?: number | null
          id?: string
          lead_id?: string | null
          max_extensions?: number | null
          notes?: string | null
          receipt_url?: string | null
          reservation_fee?: number | null
          reserved_at?: string | null
          reserved_by?: string | null
          status?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_reservations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_reservations_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_reservations_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals_kanban"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_reservations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_reservations_reserved_by_fkey"
            columns: ["reserved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_reservations_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          area_sqm: number | null
          bathrooms: number | null
          bedrooms: number | null
          building: string | null
          company_id: string | null
          created_at: string | null
          down_payment: number | null
          features: string[] | null
          finishing: string | null
          floor: number | null
          floor_number: number | null
          floor_plan_url: string | null
          held_by: string | null
          held_until: string | null
          id: string
          images: string[] | null
          installment_years: number | null
          monthly_installment: number | null
          notes: string | null
          price: number | null
          project_id: string | null
          reserved_at: string | null
          reserved_by: string | null
          status: string | null
          unit_number: string
          unit_type: string | null
          updated_at: string | null
          view: string | null
          virtual_tour_url: string | null
        }
        Insert: {
          area_sqm?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          building?: string | null
          company_id?: string | null
          created_at?: string | null
          down_payment?: number | null
          features?: string[] | null
          finishing?: string | null
          floor?: number | null
          floor_number?: number | null
          floor_plan_url?: string | null
          held_by?: string | null
          held_until?: string | null
          id?: string
          images?: string[] | null
          installment_years?: number | null
          monthly_installment?: number | null
          notes?: string | null
          price?: number | null
          project_id?: string | null
          reserved_at?: string | null
          reserved_by?: string | null
          status?: string | null
          unit_number: string
          unit_type?: string | null
          updated_at?: string | null
          view?: string | null
          virtual_tour_url?: string | null
        }
        Update: {
          area_sqm?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          building?: string | null
          company_id?: string | null
          created_at?: string | null
          down_payment?: number | null
          features?: string[] | null
          finishing?: string | null
          floor?: number | null
          floor_number?: number | null
          floor_plan_url?: string | null
          held_by?: string | null
          held_until?: string | null
          id?: string
          images?: string[] | null
          installment_years?: number | null
          monthly_installment?: number | null
          notes?: string | null
          price?: number | null
          project_id?: string | null
          reserved_at?: string | null
          reserved_by?: string | null
          status?: string | null
          unit_number?: string
          unit_type?: string | null
          updated_at?: string | null
          view?: string | null
          virtual_tour_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "units_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "units_held_by_fkey"
            columns: ["held_by"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_balances: {
        Row: {
          balance: number | null
          created_at: string | null
          id: string
          total_earned: number | null
          total_spent: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          id?: string
          total_earned?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          id?: string
          total_earned?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_permission_overrides: {
        Row: {
          company_id: string | null
          created_at: string | null
          expires_at: string | null
          granted: boolean
          granted_by: string | null
          id: string
          permission_id: string | null
          reason: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          granted: boolean
          granted_by?: string | null
          id?: string
          permission_id?: string | null
          reason?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          granted?: boolean
          granted_by?: string | null
          id?: string
          permission_id?: string | null
          reason?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_permission_overrides_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permission_overrides_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "user_permission_overrides_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          account_type: string | null
          avatar_url: string | null
          branch_id: string | null
          commercial_register_images: Json | null
          company_id: string | null
          company_name: string | null
          created_at: string | null
          email: string
          first_name: string
          full_name: string | null
          id: string
          id_back_image: string | null
          id_front_image: string | null
          last_name: string
          onboarding_completed: boolean | null
          phone: string
          role: string | null
          status: string | null
          tax_card_images: Json | null
          vat_image: string | null
          work_cell: string | null
        }
        Insert: {
          account_type?: string | null
          avatar_url?: string | null
          branch_id?: string | null
          commercial_register_images?: Json | null
          company_id?: string | null
          company_name?: string | null
          created_at?: string | null
          email: string
          first_name: string
          full_name?: string | null
          id: string
          id_back_image?: string | null
          id_front_image?: string | null
          last_name: string
          onboarding_completed?: boolean | null
          phone: string
          role?: string | null
          status?: string | null
          tax_card_images?: Json | null
          vat_image?: string | null
          work_cell?: string | null
        }
        Update: {
          account_type?: string | null
          avatar_url?: string | null
          branch_id?: string | null
          commercial_register_images?: Json | null
          company_id?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          full_name?: string | null
          id?: string
          id_back_image?: string | null
          id_front_image?: string | null
          last_name?: string
          onboarding_completed?: boolean | null
          phone?: string
          role?: string | null
          status?: string | null
          tax_card_images?: Json | null
          vat_image?: string | null
          work_cell?: string | null
        }
        Relationships: []
      }
      user_role_assignments: {
        Row: {
          company_id: string | null
          expires_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          role_id: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role_id?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_role_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          role_name: string
          role_type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          role_name: string
          role_type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          role_name?: string
          role_type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      whatsapp_ai_logs: {
        Row: {
          ai_reply: string
          client_phone: string
          company_id: string | null
          created_at: string | null
          id: string
          model: string | null
          user_message: string
        }
        Insert: {
          ai_reply: string
          client_phone: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          model?: string | null
          user_message: string
        }
        Update: {
          ai_reply?: string
          client_phone?: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          model?: string | null
          user_message?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_ai_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_ai_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
        ]
      }
      whatsapp_logs: {
        Row: {
          client_phone: string
          company_id: string | null
          deal_id: string | null
          id: string
          lead_id: string | null
          message_body: string
          sent_at: string | null
          status: string | null
        }
        Insert: {
          client_phone: string
          company_id?: string | null
          deal_id?: string | null
          id?: string
          lead_id?: string | null
          message_body: string
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          client_phone?: string
          company_id?: string | null
          deal_id?: string | null
          id?: string
          lead_id?: string | null
          message_body?: string
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "whatsapp_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          agent_id: string | null
          company_id: string | null
          content: string | null
          created_at: string | null
          delivered_at: string | null
          direction: string
          id: string
          lead_id: string | null
          message_type: string
          phone_number: string
          provider: string | null
          provider_payload: Json | null
          read_at: string | null
          sent_at: string | null
          status: string | null
          template_name: string | null
          template_params: Json | null
          waba_message_id: string | null
        }
        Insert: {
          agent_id?: string | null
          company_id?: string | null
          content?: string | null
          created_at?: string | null
          delivered_at?: string | null
          direction: string
          id?: string
          lead_id?: string | null
          message_type: string
          phone_number: string
          provider?: string | null
          provider_payload?: Json | null
          read_at?: string | null
          sent_at?: string | null
          status?: string | null
          template_name?: string | null
          template_params?: Json | null
          waba_message_id?: string | null
        }
        Update: {
          agent_id?: string | null
          company_id?: string | null
          content?: string | null
          created_at?: string | null
          delivered_at?: string | null
          direction?: string
          id?: string
          lead_id?: string | null
          message_type?: string
          phone_number?: string
          provider?: string | null
          provider_payload?: Json | null
          read_at?: string | null
          sent_at?: string | null
          status?: string | null
          template_name?: string | null
          template_params?: Json | null
          waba_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "whatsapp_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          active: boolean | null
          body_text: string
          category: string | null
          company_id: string | null
          created_at: string | null
          display_name: string
          id: string
          language: string | null
          name: string
          variables: string[] | null
        }
        Insert: {
          active?: boolean | null
          body_text: string
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          display_name: string
          id?: string
          language?: string | null
          name: string
          variables?: string[] | null
        }
        Update: {
          active?: boolean | null
          body_text?: string
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          display_name?: string
          id?: string
          language?: string | null
          name?: string
          variables?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
        ]
      }
    }
    Views: {
      active_reservations_with_timer: {
        Row: {
          client_name: string | null
          client_phone: string | null
          company_id: string | null
          deal_id: string | null
          expires_at: string | null
          id: string | null
          lead_id: string | null
          project_name: string | null
          reserved_at: string | null
          reserved_by_name: string | null
          seconds_remaining: number | null
          status: string | null
          unit_id: string | null
          unit_name: string | null
          unit_type: string | null
          urgency: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unit_reservations_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_reservations_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals_kanban"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_reservations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_reservations_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_leaderboard: {
        Row: {
          active_leads: number | null
          broker_id: string | null
          company_id: string | null
          email: string | null
          full_name: string | null
          pending_commissions: number | null
          photo_url: string | null
          rank_by_deals: number | null
          rank_by_sales: number | null
          rating: number | null
          total_commissions_earned: number | null
          total_deals: number | null
          total_sales_value: number | null
          verification_status: string | null
        }
        Relationships: []
      }
      deals_kanban: {
        Row: {
          age_days: number | null
          agent_id: string | null
          agent_name: string | null
          client_name: string | null
          company_id: string | null
          created_at: string | null
          expected_close_date: string | null
          id: string | null
          lead_score: number | null
          phone: string | null
          probability: number | null
          project_name: string | null
          stage: string | null
          unit_name: string | null
          unit_type: string | null
          unit_value: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_source_analytics: {
        Row: {
          channel: string | null
          company_id: string | null
          conversion_rate_pct: number | null
          converted: number | null
          id: string | null
          name: string | null
          total_leads: number | null
          total_revenue: number | null
          type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_sources_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_performance: {
        Row: {
          agent_id: string | null
          agent_name: string | null
          commissions_earned: number | null
          company_id: string | null
          deals_lost: number | null
          deals_won: number | null
          month: string | null
          revenue: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      overdue_installments_view: {
        Row: {
          agent_id: string | null
          amount: number | null
          client_name: string | null
          client_phone: string | null
          company_id: string | null
          contract_id: string | null
          contract_number: string | null
          days_overdue: number | null
          due_date: string | null
          id: string | null
          installment_number: number | null
          outstanding: number | null
          paid_amount: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installment_plans_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      v_ap_outstanding: {
        Row: {
          bill_date: string | null
          bill_number: string | null
          commission_id: string | null
          company_id: string | null
          days_overdue: number | null
          due_date: string | null
          id: string | null
          outstanding: number | null
          paid_amount: number | null
          status: string | null
          total_amount: number | null
          vendor_name: string | null
          vendor_type: string | null
        }
        Insert: {
          bill_date?: string | null
          bill_number?: string | null
          commission_id?: string | null
          company_id?: string | null
          days_overdue?: never
          due_date?: string | null
          id?: string | null
          outstanding?: never
          paid_amount?: number | null
          status?: string | null
          total_amount?: number | null
          vendor_name?: string | null
          vendor_type?: string | null
        }
        Update: {
          bill_date?: string | null
          bill_number?: string | null
          commission_id?: string | null
          company_id?: string | null
          days_overdue?: never
          due_date?: string | null
          id?: string | null
          outstanding?: never
          paid_amount?: number | null
          status?: string | null
          total_amount?: number | null
          vendor_name?: string | null
          vendor_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ap_bills_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "commissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap_bills_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap_bills_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
        ]
      }
      v_ar_aging: {
        Row: {
          aging_bucket: string | null
          company_id: string | null
          created_by: string | null
          days_overdue: number | null
          developer_name: string | null
          due_date: string | null
          id: string | null
          invoice_number: string | null
          issue_date: string | null
          outstanding: number | null
          paid_amount: number | null
          status: string | null
          total_amount: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ar_invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ar_invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "ar_invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_commission_pipeline: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          breakdown: Json | null
          commission_status: string | null
          company_id: string | null
          created_at: string | null
          deal_date: string | null
          deal_id: string | null
          deal_stage: string | null
          deal_title: string | null
          deal_value: number | null
          effective_rate_pct: number | null
          employee_id: string | null
          employee_name: string | null
          employee_role: string | null
          id: string | null
          period_month: number | null
          period_year: number | null
          project_name: string | null
          total_commission: number | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_calculations_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_calculations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_calculations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "commission_calculations_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_calculations_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals_kanban"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_calculations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      v_kpi_scorecard: {
        Row: {
          achievement_pct: number | null
          actual_value: number | null
          company_id: string | null
          employee_id: string | null
          employee_name: string | null
          employee_role: string | null
          kpi_name: string | null
          kpi_name_ar: string | null
          metric_type: string | null
          period_month: number | null
          period_year: number | null
          target_value: number | null
          weight_pct: number | null
          weighted_score: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kpi_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "kpi_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      v_payroll_summary: {
        Row: {
          absent_days: number | null
          allowances: number | null
          attendance_days: number | null
          base_salary: number | null
          bonus_amount: number | null
          commission_amount: number | null
          company_id: string | null
          deduction_advances: number | null
          deduction_insurance: number | null
          deduction_other: number | null
          deduction_tax: number | null
          employee_id: string | null
          employee_name: string | null
          employee_role: string | null
          gross_salary: number | null
          net_salary: number | null
          period_month: number | null
          period_year: number | null
          run_id: string | null
          run_status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_health"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "payroll_items_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_items_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "payroll_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      v_tenant_health: {
        Row: {
          company_id: string | null
          company_name: string | null
          is_suspended: boolean | null
          onboarded_at: string | null
          plan_name: string | null
          plan_tier: string | null
          subscription_expires: string | null
          subscription_status: string | null
          total_deals: number | null
          total_leads: number | null
          trial_ends_at: string | null
          user_count: number | null
        }
        Relationships: []
      }
      v_user_effective_permissions: {
        Row: {
          action: string | null
          granted: boolean | null
          permission_key: string | null
          resource: string | null
          source: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      auth_company_id: { Args: never; Returns: string }
      auth_user_company_id: { Args: never; Returns: string }
      auth_user_role: { Args: never; Returns: string }
      calculate_tiered_commission: {
        Args: {
          p_company_id: string
          p_deal_value: number
          p_period_type?: string
          p_role?: string
        }
        Returns: Json
      }
      create_deal_approval_workflow: {
        Args: { p_company_id: string; p_deal_id: string }
        Returns: undefined
      }
      current_company_id: { Args: never; Returns: string }
      current_user_company_id: { Args: never; Returns: string }
      current_user_role: { Args: never; Returns: string }
      current_user_status: { Args: never; Returns: string }
      extend_reservation: {
        Args: { p_hours?: number; p_reservation_id: string }
        Returns: Json
      }
      get_contract_financial_summary: {
        Args: { p_contract_id: string }
        Returns: Json
      }
      get_dashboard_kpis: { Args: { p_company_id: string }; Returns: Json }
      get_deals_summary: { Args: { p_company_id: string }; Returns: Json }
      get_overdue_installments: {
        Args: { p_company_id: string }
        Returns: {
          amount: number
          client_name: string
          contract_id: string
          contract_number: string
          days_overdue: number
          due_date: string
          installment_number: number
        }[]
      }
      insert_default_amenities: {
        Args: { p_project_id: string }
        Returns: undefined
      }
      is_company_manager: { Args: never; Returns: boolean }
      is_finance_manager: { Args: never; Returns: boolean }
      is_hr_manager: { Args: never; Returns: boolean }
      is_legal_manager: { Args: never; Returns: boolean }
      is_platform_admin: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      next_journal_entry_number: {
        Args: { p_company_id: string }
        Returns: string
      }
      next_receipt_number: { Args: { p_company_id: string }; Returns: string }
      refresh_broker_stats: {
        Args: { p_broker_id: string }
        Returns: undefined
      }
      release_expired_unit_holds: { Args: never; Returns: number }
      search_leads: {
        Args: {
          p_company_id: string
          p_limit?: number
          p_offset?: number
          p_query: string
          p_status?: string
        }
        Returns: {
          client_name: string
          created_at: string
          expected_value: number
          id: string
          phone: string
          rank: number
          score: number
          source: string
          status: string
          temperature: string
        }[]
      }
      seed_message_templates: {
        Args: { p_company_id: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      deal_status: "Lead" | "Viewing" | "Offer" | "Contracted" | "Registered"
      lead_status:
        | "fresh"
        | "old"
        | "followup"
        | "meeting"
        | "sitevisit"
        | "win"
        | "lose"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      deal_status: ["Lead", "Viewing", "Offer", "Contracted", "Registered"],
      lead_status: [
        "fresh",
        "old",
        "followup",
        "meeting",
        "sitevisit",
        "win",
        "lose",
      ],
    },
  },
} as const
