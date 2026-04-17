import type { MarketplaceProperty } from './types'

type RawAd = {
  id: string
  title: string
  description: string | null
  price: number | string
  currency: string | null
  property_type: string | null
  location: string | null
  area_sqm: number | string | null
  bedrooms: number | null
  bathrooms: number | null
  images: string[] | null
  is_featured: boolean | null
  is_urgent: boolean | null
  status: MarketplaceProperty['status']
  views_count: number | null
  created_at: string
  profiles?: {
    full_name?: string | null
    company_name?: string | null
    account_type?: string | null
  } | {
    full_name?: string | null
    company_name?: string | null
    account_type?: string | null
  }[] | null
}

export function mapAdToMarketplaceProperty(ad: RawAd): MarketplaceProperty {
  const location = ad.location ?? 'مصر'
  const [district = location, city = location] = location.split('،').map((part) => part.trim())
  const profile = Array.isArray(ad.profiles) ? ad.profiles[0] : ad.profiles

  return {
    id: ad.id,
    title: ad.title,
    description: ad.description ?? '',
    price: Number(ad.price),
    currency: 'EGP',
    listingKind: ad.property_type?.includes('primary') ? 'primary' : 'resale',
    propertyType: normalizePropertyType(ad.property_type),
    city,
    district,
    location,
    areaSqm: Number(ad.area_sqm ?? 0),
    bedrooms: ad.bedrooms,
    bathrooms: ad.bathrooms,
    imageUrl: ad.images?.[0] ?? 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80',
    featured: Boolean(ad.is_featured),
    urgent: Boolean(ad.is_urgent),
    status: ad.status,
    viewsCount: ad.views_count ?? 0,
    seller: {
      name: profile?.company_name ?? profile?.full_name ?? 'معلن موثق',
      type: normalizeSellerType(profile?.account_type),
      rating: 4.8,
      verified: Boolean(profile?.company_name),
    },
    createdAt: ad.created_at,
  }
}

function normalizePropertyType(type: string | null | undefined) {
  const types: Record<string, string> = {
    apartment: 'شقة',
    villa: 'فيلا',
    townhouse: 'تاون هاوس',
    penthouse: 'بنتهاوس',
    studio: 'استوديو',
    duplex: 'دوبلكس',
    office: 'مكتب',
    shop: 'محل',
  }

  return types[type ?? ''] ?? type ?? 'عقار'
}

function normalizeSellerType(type: string | null | undefined): MarketplaceProperty['seller']['type'] {
  if (type === 'company') return 'company'
  if (type === 'developer') return 'developer'
  if (type === 'broker') return 'broker'
  return 'individual'
}
