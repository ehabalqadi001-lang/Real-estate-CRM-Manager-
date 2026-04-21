import { HDate } from '@hebcal/core'
import { COUNTRIES, DEFAULT_COUNTRY, isCountryCode, type CountryCode } from '@/config/countries'

export function normalizeCountryCode(countryCode?: string | null): CountryCode {
  return isCountryCode(countryCode) ? countryCode : DEFAULT_COUNTRY
}

export function formatCurrency(amount: number, countryCode?: string | null): string {
  const country = COUNTRIES[normalizeCountryCode(countryCode)]
  const value = new Intl.NumberFormat(country.currencyLocale, {
    maximumFractionDigits: 0,
  }).format(Number(amount || 0))

  return `${value} ${country.currencySymbol}`
}

export function formatDate(date: Date | string | number, countryCode?: string | null, includeHijri = false): string {
  const country = COUNTRIES[normalizeCountryCode(countryCode)]
  const parsed = new Date(date)
  const gregorian = new Intl.DateTimeFormat(country.currencyLocale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(parsed)

  if (!includeHijri) return gregorian

  const hijri = new Intl.DateTimeFormat(`${country.currencyLocale}-u-ca-islamic`, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(parsed)

  return `${gregorian} / ${hijri}`
}

export function formatHebrewCalendarDate(date: Date | string | number): string {
  const hDate = new HDate(new Date(date))
  return hDate.renderGematriya()
}

export function formatPhoneNumber(phone: string, countryCode?: string | null): string {
  const country = COUNTRIES[normalizeCountryCode(countryCode)]
  const digits = phone.replace(/[^\d+]/g, '')
  if (digits.startsWith('+')) return digits
  if (digits.startsWith(country.phone.replace('+', ''))) return `+${digits}`
  if (digits.startsWith('0')) return `${country.phone}${digits.slice(1)}`
  return `${country.phone}${digits}`
}

export function calculateTax(amount: number, countryCode?: string | null) {
  const country = COUNTRIES[normalizeCountryCode(countryCode)]
  const subtotal = Number(amount || 0)
  const tax = Math.round(subtotal * country.taxRate * 100) / 100
  const total = subtotal + tax

  return {
    countryCode: normalizeCountryCode(countryCode),
    taxRate: country.taxRate,
    subtotal,
    tax,
    total,
    formattedSubtotal: formatCurrency(subtotal, countryCode),
    formattedTax: formatCurrency(tax, countryCode),
    formattedTotal: formatCurrency(total, countryCode),
  }
}
