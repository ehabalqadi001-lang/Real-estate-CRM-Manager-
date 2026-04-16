import { create } from 'zustand'

export interface Lead {
  id: string
  client_name: string
  phone: string | null
  email: string | null
  status: string
  property_type: string | null
  expected_value: number | null
  user_id: string
  company_id: string | null
  created_at: string
}

interface LeadsStore {
  leads: Lead[]
  searchQuery: string
  statusFilter: string
  setLeads: (leads: Lead[]) => void
  setSearchQuery: (q: string) => void
  setStatusFilter: (s: string) => void
}

export const useLeadsStore = create<LeadsStore>((set) => ({
  leads: [],
  searchQuery: '',
  statusFilter: 'all',
  setLeads: (leads) => set({ leads }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
}))
