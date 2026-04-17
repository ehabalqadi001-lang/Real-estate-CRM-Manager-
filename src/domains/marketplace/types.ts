export type MarketplaceUser = {
  id: string
  email: string | null
  name: string
  role: string | null
}

export type SellerTrust = {
  name: string
  type: 'individual' | 'company' | 'developer' | 'broker'
  rating: number
  verified: boolean
}

export type MarketplaceProperty = {
  id: string
  title: string
  description: string
  price: number
  currency: 'EGP'
  listingKind: 'primary' | 'resale'
  propertyType: string
  city: string
  district: string
  location: string
  areaSqm: number
  bedrooms: number | null
  bathrooms: number | null
  imageUrl: string
  featured: boolean
  urgent: boolean
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'sold'
  viewsCount: number
  seller: SellerTrust
  createdAt: string
}

export type AdPackage = {
  id: string
  name: string
  audience: 'individual' | 'company'
  price: number
  adsIncluded: number
  featuredAds: number
  verifiedBadge: boolean
}

export type MarketplaceFilterState = {
  query: string
  listingKind: 'all' | 'primary' | 'resale'
  propertyType: string
  city: string
  minPrice: string
  maxPrice: string
  bedrooms: string
}
