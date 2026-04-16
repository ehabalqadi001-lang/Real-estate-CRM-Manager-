import { create } from 'zustand'

export interface Deal {
  id: string
  title: string
  client_name: string
  developer_name: string | null
  amount: number | null
  status: string
  stage: string | null
  user_id: string
  company_id: string | null
  created_at: string
}

interface DealsStore {
  deals: Deal[]
  statusFilter: string
  setDeals: (deals: Deal[]) => void
  setStatusFilter: (s: string) => void
}

export const useDealsStore = create<DealsStore>((set) => ({
  deals: [],
  statusFilter: 'all',
  setDeals: (deals) => set({ deals }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
}))
