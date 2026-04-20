export type CommissionStatus = 'pending' | 'approved' | 'processing' | 'paid' | 'disputed' | 'cancelled'

export type CommissionRow = {
  id: string
  dealId: string | null
  agentId: string | null
  agentName: string
  clientName: string
  dealTitle: string
  projectName: string
  grossDealValue: number
  commissionRate: number
  grossCommission: number
  agentAmount: number
  companyAmount: number
  status: CommissionStatus
  paymentMethod: string | null
  paymentReference: string | null
  paymentDate: string | null
  receiptUrl: string | null
  notes: string | null
  createdAt: string
  paidAt: string | null
}

export type CommissionProjectOption = {
  id: string
  name: string
  developerId: string | null
  developerName: string
}

export type CommissionRateOption = {
  id: string
  developerId: string | null
  projectId: string | null
  minValue: number
  maxValue: number | null
  ratePercentage: number
  agentSharePercentage: number
  companySharePercentage: number
}

export type CommissionLeadOption = {
  id: string
  name: string
}
