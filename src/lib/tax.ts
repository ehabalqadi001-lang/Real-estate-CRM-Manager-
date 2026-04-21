import { calculateTax } from '@/lib/format'

export type TaxBreakdown = ReturnType<typeof calculateTax>

export function calculateDealVat(amount: number, countryCode?: string | null): TaxBreakdown {
  return calculateTax(amount, countryCode)
}

export function calculateCommissionVat(amount: number, countryCode?: string | null): TaxBreakdown {
  return calculateTax(amount, countryCode)
}
