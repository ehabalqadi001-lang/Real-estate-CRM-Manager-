// Tiered commission logic per FAST INVESTMENT rules:
// Tier 1: 0–5,000,000 EGP → 1.5%
// Tier 2: above 5,000,000 EGP → 2.0%
export function calculateTieredCommission(saleValue: number, agentRate?: number | null): number {
  if (agentRate != null && agentRate > 0) {
    return (saleValue * agentRate) / 100
  }
  const tier1Cap = 5_000_000
  if (saleValue <= tier1Cap) return saleValue * 0.015
  return tier1Cap * 0.015 + (saleValue - tier1Cap) * 0.02
}
