// Commission Calculation Engine
// Evaluates applicable rules and computes agent + company commission

export interface CommissionBreakdown {
  agentAmount:    number
  companyAmount:  number
  brokerAmount:   number
  totalAmount:    number
  agentRate:      number
  companyRate:    number
  brokerRate:     number
  appliedRuleId:  string | null
  appliedRuleName:string | null
}

export interface CommissionRule {
  id:            string
  developer_id:  string | null
  sale_type:     string | null
  commission_pct: number
  payout_days:   number | null
  name?:         string
}

export function calculateCommission(
  dealValue: number,
  rules: CommissionRule[],
  developerId?: string | null,
  saleType = 'primary',
  brokerSharePct = 0
): CommissionBreakdown {
  // Find best matching rule: developer-specific > generic
  const rule =
    rules.find(r => r.developer_id === developerId && r.sale_type === saleType) ??
    rules.find(r => r.developer_id === developerId) ??
    rules.find(r => r.sale_type === saleType) ??
    rules[0] ??
    null

  const totalRate     = rule?.commission_pct ?? 2.5
  const totalCommission = dealValue * (totalRate / 100)

  // Split: broker takes their cut first, rest is company+agent
  const brokerAmount  = totalCommission * (brokerSharePct / 100)
  const remaining     = totalCommission - brokerAmount

  // Company keeps 40%, agent gets 60% of remaining (configurable)
  const agentSplit    = 0.60
  const agentAmount   = remaining * agentSplit
  const companyAmount = remaining * (1 - agentSplit)

  return {
    agentAmount:     Math.round(agentAmount),
    companyAmount:   Math.round(companyAmount),
    brokerAmount:    Math.round(brokerAmount),
    totalAmount:     Math.round(totalCommission),
    agentRate:       totalRate * agentSplit * (1 - brokerSharePct / 100),
    companyRate:     totalRate * (1 - agentSplit) * (1 - brokerSharePct / 100),
    brokerRate:      totalRate * (brokerSharePct / 100),
    appliedRuleId:   rule?.id ?? null,
    appliedRuleName: rule?.name ?? null,
  }
}

export function formatCommissionBreakdown(b: CommissionBreakdown, dealValue: number) {
  const fmt = (n: number) => new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(n)
  return {
    lines: [
      { label: 'قيمة الصفقة',     value: fmt(dealValue),       highlight: false },
      { label: 'عمولة إجمالية',   value: `${fmt(b.totalAmount)} ج.م (${b.agentRate + b.companyRate + b.brokerRate}%)`, highlight: false },
      { label: 'نصيب الوكيل',     value: `${fmt(b.agentAmount)} ج.م`,   highlight: true },
      { label: 'نصيب الشركة',     value: `${fmt(b.companyAmount)} ج.م`,  highlight: false },
      ...(b.brokerAmount > 0 ? [{ label: 'نصيب الوسيط', value: `${fmt(b.brokerAmount)} ج.م`, highlight: false }] : []),
    ]
  }
}
