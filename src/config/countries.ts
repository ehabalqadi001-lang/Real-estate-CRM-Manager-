export const COUNTRIES = {
  EG: {
    name: 'مصر',
    currency: 'EGP',
    currencySymbol: 'ج.م',
    currencyLocale: 'ar-EG',
    phone: '+20',
    language: 'ar',
    taxRate: 0.14,
    regulatoryBody: 'هيئة التطوير العقاري',
    cities: ['القاهرة', 'الجيزة', 'الإسكندرية', 'العين السخنة', 'رأس السدر', 'الساحل الشمالي', 'المنصورة'],
  },
  AE: {
    name: 'الإمارات',
    currency: 'AED',
    currencySymbol: 'د.إ',
    currencyLocale: 'ar-AE',
    phone: '+971',
    language: 'ar',
    taxRate: 0.05,
    regulatoryBody: 'RERA دبي',
    cities: ['دبي', 'أبوظبي', 'الشارقة', 'عجمان', 'رأس الخيمة'],
  },
  SA: {
    name: 'السعودية',
    currency: 'SAR',
    currencySymbol: 'ر.س',
    currencyLocale: 'ar-SA',
    phone: '+966',
    language: 'ar',
    taxRate: 0.15,
    regulatoryBody: 'الهيئة العامة للعقار REGA',
    cities: ['الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر'],
  },
} as const

export type CountryCode = keyof typeof COUNTRIES

export const DEFAULT_COUNTRY: CountryCode = 'EG'

export function isCountryCode(value: string | null | undefined): value is CountryCode {
  return value === 'EG' || value === 'AE' || value === 'SA'
}

export function localeForCountry(countryCode: CountryCode) {
  if (countryCode === 'AE') return 'ar-AE'
  if (countryCode === 'SA') return 'ar-SA'
  return 'ar'
}
