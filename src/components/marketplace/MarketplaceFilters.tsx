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
  const [filters, setFilters] = useState<MarketplaceFilterState>(initialFilters)

  const activeCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'listingKind') return value !== 'all'
    return value !== '' && value !== 'all'
  }).length

  const updateFilter = (key: keyof MarketplaceFilterState, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  return (
    <section className="nextora-card mb-8 rounded-3xl p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Filter className="size-5 text-market-navy" />
            <h2 className="text-xl font-black text-market-ink">فلترة العقارات</h2>
            {activeCount > 0 && <Badge className="bg-market-mist text-market-teal">{activeCount} نشط</Badge>}
          </div>
          <p className="mt-1 text-sm font-semibold text-market-slate">
            استخدم الفلاتر للوصول السريع إلى أفضل الوحدات المناسبة لك.
          </p>
        </div>
        {activeCount > 0 && (
          <Button variant="outline" onClick={() => setFilters(initialFilters)} className="rounded-2xl border-market-line bg-transparent text-white hover:bg-white/10">
            <X className="ms-1 size-4" />
            مسح الفلاتر
          </Button>
        )}
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="space-y-2">
          <Label htmlFor="market-search">بحث</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-market-slate" />
            <Input
              id="market-search"
              value={filters.query}
              onChange={(event) => updateFilter('query', event.target.value)}
              placeholder="اسم الكمبوند، المنطقة، نوع الوحدة"
              className="h-11 rounded-2xl border-market-line bg-market-paper pr-10 font-semibold text-white"
            />
          </div>
        </div>

        <FilterSelect
          label="نوع الإعلان"
          value={filters.listingKind}
          onValueChange={(value) => updateFilter('listingKind', value)}
          icon={<Home className="size-4" />}
          options={[
            ['all', 'الكل'],
            ['primary', 'Primary'],
            ['resale', 'Resale'],
          ]}
        />

        <FilterSelect
          label="نوع العقار"
          value={filters.propertyType}
          onValueChange={(value) => updateFilter('propertyType', value)}
          icon={<Building className="size-4" />}
          options={[
            ['all', 'كل الأنواع'],
            ['apartment', 'شقة'],
            ['villa', 'فيلا'],
            ['townhouse', 'تاون هاوس'],
            ['office', 'إداري'],
            ['shop', 'تجاري'],
          ]}
        />

        <FilterSelect
          label="المدينة"
          value={filters.city}
          onValueChange={(value) => updateFilter('city', value)}
          options={[
            ['all', 'كل المدن'],
            ['new-cairo', 'القاهرة الجديدة'],
            ['sheikh-zayed', 'الشيخ زايد'],
            ['shorouk', 'الشروق'],
            ['north-coast', 'الساحل الشمالي'],
          ]}
        />

        <FilterSelect
          label="الغرف"
          value={filters.bedrooms}
          onValueChange={(value) => updateFilter('bedrooms', value)}
          options={[
            ['all', 'أي عدد'],
            ['1', '1'],
            ['2', '2'],
            ['3', '3'],
            ['4+', '4+'],
          ]}
        />
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="min-price">أقل سعر</Label>
          <Input
            id="min-price"
            inputMode="numeric"
            value={filters.minPrice}
            onChange={(event) => updateFilter('minPrice', event.target.value)}
            placeholder="مثال: 1500000"
            className="h-11 rounded-2xl border-market-line bg-market-paper font-semibold text-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max-price">أعلى سعر</Label>
          <Input
            id="max-price"
            inputMode="numeric"
            value={filters.maxPrice}
            onChange={(event) => updateFilter('maxPrice', event.target.value)}
            placeholder="مثال: 8000000"
            className="h-11 rounded-2xl border-market-line bg-market-paper font-semibold text-white"
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
        <SelectTrigger className="h-11 rounded-2xl border-market-line bg-market-paper font-semibold text-white">
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
