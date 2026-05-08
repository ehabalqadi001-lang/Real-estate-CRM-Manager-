'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { MarketplaceFilterState } from '@/domains/marketplace/types'
import { Building, Filter, Home, Search, X } from 'lucide-react'
import { useI18n } from '@/hooks/use-i18n'

const initialFilters: MarketplaceFilterState = {
  query: '',
  listingKind: 'all',
  propertyType: 'all',
  city: 'all',
  minPrice: '',
  maxPrice: '',
  bedrooms: 'all',
}

export default function MarketplaceFilters() {
  const { t } = useI18n()
  const [filters, setFilters] = useState<MarketplaceFilterState>(initialFilters)

  const activeCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'listingKind') return value !== 'all'
    return value !== '' && value !== 'all'
  }).length

  const updateFilter = (key: keyof MarketplaceFilterState, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  return (
    <section className="mb-8 rounded-3xl border border-market-line bg-white p-4 shadow-[0_18px_50px_rgba(16,32,51,0.06)] sm:p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Filter className="size-5 text-market-navy" />
            <h2 className="text-xl font-black text-market-ink">{t('فلترة العقارات', 'Filter Properties')}</h2>
            {activeCount > 0 && <Badge className="bg-market-mist text-market-teal">{activeCount} {t('نشط', 'active')}</Badge>}
          </div>
          <p className="mt-1 text-sm font-semibold text-market-slate">
            {t('استخدم الفلاتر للوصول السريع إلى أفضل الوحدات المناسبة لك.', 'Use filters to quickly find the best matching properties.')}
          </p>
        </div>
        {activeCount > 0 && (
          <Button variant="outline" onClick={() => setFilters(initialFilters)} className="rounded-2xl border-market-line">
            <X className="ms-1 size-4" />
            {t('مسح الفلاتر', 'Clear Filters')}
          </Button>
        )}
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="space-y-2">
          <Label htmlFor="market-search">{t('بحث', 'Search')}</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-market-slate" />
            <Input
              id="market-search"
              value={filters.query}
              onChange={(event) => updateFilter('query', event.target.value)}
              placeholder={t('اسم الكمبوند، المنطقة، نوع الوحدة', 'Compound name, area, unit type')}
              className="h-11 rounded-2xl border-market-line bg-market-paper pr-10 font-semibold"
            />
          </div>
        </div>

        <FilterSelect
          label={t('نوع الإعلان', 'Listing Type')}
          value={filters.listingKind}
          onValueChange={(value) => updateFilter('listingKind', value)}
          icon={<Home className="size-4" />}
          options={[
            ['all', t('الكل', 'All')],
            ['primary', 'Primary'],
            ['resale', 'Resale'],
          ]}
        />

        <FilterSelect
          label={t('نوع العقار', 'Property Type')}
          value={filters.propertyType}
          onValueChange={(value) => updateFilter('propertyType', value)}
          icon={<Building className="size-4" />}
          options={[
            ['all', t('كل الأنواع', 'All Types')],
            ['apartment', t('شقة', 'Apartment')],
            ['villa', t('فيلا', 'Villa')],
            ['townhouse', t('تاون هاوس', 'Townhouse')],
            ['office', t('إداري', 'Office')],
            ['shop', t('تجاري', 'Commercial')],
          ]}
        />

        <FilterSelect
          label={t('المدينة', 'City')}
          value={filters.city}
          onValueChange={(value) => updateFilter('city', value)}
          options={[
            ['all', t('كل المدن', 'All Cities')],
            ['new-cairo', t('القاهرة الجديدة', 'New Cairo')],
            ['sheikh-zayed', t('الشيخ زايد', 'Sheikh Zayed')],
            ['shorouk', t('الشروق', 'Al Shorouk')],
            ['north-coast', t('الساحل الشمالي', 'North Coast')],
          ]}
        />

        <FilterSelect
          label={t('الغرف', 'Bedrooms')}
          value={filters.bedrooms}
          onValueChange={(value) => updateFilter('bedrooms', value)}
          options={[
            ['all', t('أي عدد', 'Any')],
            ['1', '1'],
            ['2', '2'],
            ['3', '3'],
            ['4+', '4+'],
          ]}
        />
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="min-price">{t('أقل سعر', 'Min Price')}</Label>
          <Input
            id="min-price"
            inputMode="numeric"
            value={filters.minPrice}
            onChange={(event) => updateFilter('minPrice', event.target.value)}
            placeholder={t('مثال: 1500000', 'e.g. 1500000')}
            className="h-11 rounded-2xl border-market-line bg-market-paper font-semibold"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max-price">{t('أعلى سعر', 'Max Price')}</Label>
          <Input
            id="max-price"
            inputMode="numeric"
            value={filters.maxPrice}
            onChange={(event) => updateFilter('maxPrice', event.target.value)}
            placeholder={t('مثال: 8000000', 'e.g. 8000000')}
            className="h-11 rounded-2xl border-market-line bg-market-paper font-semibold"
          />
        </div>
      </div>
    </section>
  )
}

function FilterSelect({
  label,
  value,
  onValueChange,
  options,
  icon,
}: {
  label: string
  value: string
  onValueChange: (value: string) => void
  options: [string, string][]
  icon?: ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={(nextValue) => onValueChange(nextValue ?? 'all')}>
        <SelectTrigger className="h-11 rounded-2xl border-market-line bg-market-paper font-semibold">
          <span className="flex items-center gap-2">
            {icon}
            <SelectValue />
          </span>
        </SelectTrigger>
        <SelectContent>
          {options.map(([optionValue, optionLabel]) => (
            <SelectItem key={optionValue} value={optionValue}>
              {optionLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
