'use client'

import { useState } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Search, Filter, X, MapPin } from 'lucide-react'

interface Filters {
  search: string
  propertyType: string
  location: string
  minPrice: number
  maxPrice: number
  bedrooms: string
  bathrooms: string
  area: [number, number]
}

export default function MarketplaceFilters() {
  const [filters, setFilters] = useState<Filters>({
    search: '',
    propertyType: '',
    location: '',
    minPrice: 0,
    maxPrice: 10000000, // 10M EGP
    bedrooms: '',
    bathrooms: '',
    area: [50, 500], // sqm
  })

  const [showAdvanced, setShowAdvanced] = useState(false)

  const updateFilter = (key: keyof Filters, value: string | number | [number, number] | null) => {
    setFilters(prev => ({ ...prev, [key]: value ?? '' }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      propertyType: '',
      location: '',
      minPrice: 0,
      maxPrice: 10000000,
      bedrooms: '',
      bathrooms: '',
      area: [50, 500],
    })
  }

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'area') return value[0] !== 50 || value[1] !== 500
    if (key === 'minPrice') return value > 0
    if (key === 'maxPrice') return value < 10000000
    return value !== ''
  }).length

  return (
    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl text-navy dark:text-white flex items-center">
            <Filter className="h-5 w-5 ml-2" />
            فلترة النتائج
          </CardTitle>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="bg-navy/10 text-navy">
              {activeFiltersCount} فلتر نشط
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              البحث
            </Label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="search"
                placeholder="ابحث عن عقار..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pr-10"
              />
            </div>
          </div>

          {/* Property Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              نوع العقار
            </Label>
            <Select value={filters.propertyType} onValueChange={(value) => updateFilter('propertyType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apartment">شقة</SelectItem>
                <SelectItem value="villa">فيلا</SelectItem>
                <SelectItem value="townhouse">تاون هاوس</SelectItem>
                <SelectItem value="penthouse">بنتهاوس</SelectItem>
                <SelectItem value="studio">استوديو</SelectItem>
                <SelectItem value="duplex">دوبلكس</SelectItem>
                <SelectItem value="office">مكتب</SelectItem>
                <SelectItem value="shop">محل</SelectItem>
                <SelectItem value="warehouse">مستودع</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              الموقع
            </Label>
            <div className="relative">
              <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="المنطقة أو المدينة"
                value={filters.location}
                onChange={(e) => updateFilter('location', e.target.value)}
                className="pr-10"
              />
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              نطاق السعر (ج.م)
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="من"
                value={filters.minPrice || ''}
                onChange={(e) => updateFilter('minPrice', Number(e.target.value) || 0)}
              />
              <Input
                type="number"
                placeholder="إلى"
                value={filters.maxPrice || ''}
                onChange={(e) => updateFilter('maxPrice', Number(e.target.value) || 10000000)}
              />
            </div>
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-navy hover:text-navy-light hover:bg-navy/10"
          >
            <Filter className="h-4 w-4 ml-2" />
            {showAdvanced ? 'إخفاء الخيارات المتقدمة' : 'عرض الخيارات المتقدمة'}
          </Button>

          {activeFiltersCount > 0 && (
            <Button
              variant="outline"
              onClick={clearFilters}
              className="text-slate-600 hover:text-slate-800"
            >
              <X className="h-4 w-4 ml-2" />
              مسح جميع الفلاتر
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            {/* Bedrooms */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                عدد الغرف
              </Label>
              <Select value={filters.bedrooms} onValueChange={(value) => updateFilter('bedrooms', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="أي عدد" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="studio">استوديو</SelectItem>
                  <SelectItem value="1">1 غرفة</SelectItem>
                  <SelectItem value="2">2 غرفة</SelectItem>
                  <SelectItem value="3">3 غرف</SelectItem>
                  <SelectItem value="4">4 غرف</SelectItem>
                  <SelectItem value="5+">5+ غرف</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bathrooms */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                عدد الحمامات
              </Label>
              <Select value={filters.bathrooms} onValueChange={(value) => updateFilter('bathrooms', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="أي عدد" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 حمام</SelectItem>
                  <SelectItem value="2">2 حمام</SelectItem>
                  <SelectItem value="3">3 حمامات</SelectItem>
                  <SelectItem value="4+">4+ حمامات</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Area Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                المساحة (م²): {filters.area[0]} - {filters.area[1]}
              </Label>
              <Slider
                value={filters.area}
                onValueChange={(value) => {
                  const range = Array.isArray(value) ? value : [value]
                  updateFilter('area', [range[0] ?? 50, range[1] ?? 500])
                }}
                max={1000}
                min={20}
                step={10}
                className="w-full"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
