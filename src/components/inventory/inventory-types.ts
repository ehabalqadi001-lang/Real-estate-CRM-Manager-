export type InventoryViewMode = 'grid' | 'list' | 'map'

export type InventorySortKey = 'newest' | 'price_asc' | 'price_desc' | 'area_desc'

export type UnitStatus = 'available' | 'reserved' | 'sold' | 'held'

export interface InventoryDeveloper {
  id: string
  name: string
  nameAr: string
  logoUrl: string | null
  tier: string | null
  active: boolean
  phone: string | null
  email: string | null
}

export interface InventoryProject {
  id: string
  name: string
  nameAr: string
  developerId: string | null
  city: string
  location: string | null
  latitude: number | null
  longitude: number | null
  coverImageUrl: string | null
  galleryUrls: string[]
  amenities: string[]
  status: string | null
}

export interface PaymentPlan {
  id: string
  unitId: string
  name: string
  downPaymentPercentage: number | null
  installmentYears: number | null
  installmentFrequency: string | null
  maintenanceFeePercentage: number | null
  description: string | null
  active: boolean
}

export interface InventoryUnit {
  id: string
  unitNumber: string
  projectId: string | null
  projectName: string
  projectNameAr: string
  developerId: string | null
  developerName: string
  developerNameAr: string
  developerLogoUrl: string | null
  city: string
  location: string | null
  latitude: number | null
  longitude: number | null
  unitType: string
  areaSqm: number
  bedrooms: number | null
  bathrooms: number | null
  floorNumber: number | null
  building: string | null
  finishing: string | null
  view: string | null
  price: number
  downPayment: number | null
  monthlyInstallment: number | null
  installmentYears: number | null
  status: UnitStatus
  heldUntil: string | null
  coverImageUrl: string | null
  galleryUrls: string[]
  floorPlanUrl: string | null
  virtualTourUrl: string | null
  features: string[]
  notes: string | null
  createdAt: string | null
  paymentPlans: PaymentPlan[]
}

export interface InventoryStats {
  total: number
  available: number
  reserved: number
  held: number
  sold: number
  totalValue: number
  averagePrice: number
}
