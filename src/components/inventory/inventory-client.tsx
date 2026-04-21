'use client'

import dynamic from 'next/dynamic'
import type React from 'react'
import { useMemo, useState } from 'react'
import { Building2, ChevronDown, Filter, LayoutGrid, List, Map, Search, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { UnitCard } from './unit-card'
import { UnitDetailSheet } from './unit-detail-sheet'
import type { InventoryDeveloper, InventorySortKey, InventoryUnit, InventoryViewMode } from './inventory-types'

const InventoryMap = dynamic(() => import('./inventory-map').then((mod) => mod.InventoryMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-[520px] items-center justify-center rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] text-[var(--fi-muted)]">
      جار تحميل الخريطة...
    </div>
  ),
})

interface InventoryClientProps {
  units: InventoryUnit[]
  developers: InventoryDeveloper[]
  initialDeveloperIds?: string[]
}

const unitTypes = [
  ['apartment', 'شقة'],
  ['villa', 'فيلا'],
  ['duplex', 'دوبلكس'],
  ['penthouse', 'بنتهاوس'],
  ['studio', 'استوديو'],
  ['office', 'مكتب'],
  ['shop', 'محل'],
  ['chalet', 'شاليه'],
  ['townhouse', 'تاون هاوس'],
] as const

const finishingOptions = [
  ['fully_finished', 'تشطيب كامل'],
  ['semi_finished', 'نصف تشطيب'],
  ['core_shell', 'بدون تشطيب'],
  ['furnished', 'مفروش'],
] as const

const statusOptions = [
  ['available', 'متاح'],
  ['reserved', 'محجوز'],
  ['held', 'محتجز'],
] as const

function formatEgp(value: number) {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(value)
}

export function InventoryClient({ units, developers, initialDeveloperIds = [] }: InventoryClientProps) {
  const [view, setView] = useState<InventoryViewMode>('grid')
  const [query, setQuery] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [sort, setSort] = useState<InventorySortKey>('newest')
  const [selectedUnit, setSelectedUnit] = useState<InventoryUnit | null>(null)
  const [localUnits, setLocalUnits] = useState(units)
  const [developerIds, setDeveloperIds] = useState<string[]>(initialDeveloperIds)
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['available', 'held'])
  const [selectedFinishing, setSelectedFinishing] = useState<string[]>([])
  const [city, setCity] = useState('')
  const [bedrooms, setBedrooms] = useState('all')

  const bounds = useMemo(() => {
    const prices = localUnits.map((unit) => unit.price)
    const areas = localUnits.map((unit) => unit.areaSqm)
    return {
      minPrice: Math.min(...prices, 0),
      maxPrice: Math.max(...prices, 50_000_000),
      minArea: Math.min(...areas, 0),
      maxArea: Math.max(...areas, 1_000),
    }
  }, [localUnits])

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50_000_000])
  const [areaRange, setAreaRange] = useState<[number, number]>([0, 1_000])

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return localUnits
      .filter((unit) => {
        const matchesQuery = !normalizedQuery
          || unit.unitNumber.toLowerCase().includes(normalizedQuery)
          || unit.projectNameAr.toLowerCase().includes(normalizedQuery)
          || unit.developerNameAr.toLowerCase().includes(normalizedQuery)
          || unit.city.toLowerCase().includes(normalizedQuery)

        const matchesDeveloper = developerIds.length === 0 || (unit.developerId && developerIds.includes(unit.developerId))
        const matchesType = selectedTypes.length === 0 || selectedTypes.includes(unit.unitType)
        const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(unit.status)
        const matchesFinishing = selectedFinishing.length === 0 || (unit.finishing && selectedFinishing.includes(unit.finishing))
        const matchesCity = !city || unit.city.includes(city) || (unit.location ?? '').includes(city)
        const matchesPrice = unit.price >= priceRange[0] && unit.price <= priceRange[1]
        const matchesArea = unit.areaSqm >= areaRange[0] && unit.areaSqm <= areaRange[1]
        const matchesBedrooms = bedrooms === 'all'
          || (bedrooms === '4+' ? Number(unit.bedrooms ?? 0) >= 4 : Number(unit.bedrooms ?? 0) === Number(bedrooms))

        return matchesQuery
          && matchesDeveloper
          && matchesType
          && matchesStatus
          && matchesFinishing
          && matchesCity
          && matchesPrice
          && matchesArea
          && matchesBedrooms
      })
      .sort((a, b) => {
        if (sort === 'price_asc') return a.price - b.price
        if (sort === 'price_desc') return b.price - a.price
        if (sort === 'area_desc') return b.areaSqm - a.areaSqm
        return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      })
  }, [areaRange, bedrooms, city, developerIds, localUnits, priceRange, query, selectedFinishing, selectedStatuses, selectedTypes, sort])

  function toggleValue(value: string, current: string[], setValue: (next: string[]) => void) {
    setValue(current.includes(value) ? current.filter((item) => item !== value) : [...current, value])
  }

  function handleHeld(unitId: string, heldUntil: string) {
    setLocalUnits((current) => current.map((unit) => unit.id === unitId ? { ...unit, status: 'held', heldUntil } : unit))
    setSelectedUnit((current) => current?.id === unitId ? { ...current, status: 'held', heldUntil } : current)
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]" dir="rtl">
      <aside className={`${filtersOpen ? 'block' : 'hidden'} lg:block`}>
        <Card className="sticky top-4 border-[var(--fi-line)] bg-[var(--fi-paper)]">
          <CardContent className="space-y-5 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-[var(--fi-ink)]">
                <SlidersHorizontal className="size-4" />
                فلاتر المخزون
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => {
                setDeveloperIds([])
                setSelectedTypes([])
                setSelectedStatuses([])
                setSelectedFinishing([])
                setCity('')
                setBedrooms('all')
                setPriceRange([bounds.minPrice, bounds.maxPrice])
                setAreaRange([bounds.minArea, bounds.maxArea])
              }}>
                إعادة ضبط
              </Button>
            </div>

            <FilterGroup title="المطور">
              <div className="space-y-2">
                {developers.map((developer) => (
                  <label key={developer.id} className="flex items-center gap-2 text-sm text-[var(--fi-ink)]">
                    <input
                      type="checkbox"
                      checked={developerIds.includes(developer.id)}
                      onChange={() => toggleValue(developer.id, developerIds, setDeveloperIds)}
                    />
                    {developer.nameAr}
                  </label>
                ))}
              </div>
            </FilterGroup>

            <FilterGroup title="نوع الوحدة">
              <ChipGrid options={unitTypes} selected={selectedTypes} onToggle={(value) => toggleValue(value, selectedTypes, setSelectedTypes)} />
            </FilterGroup>

            <FilterGroup title="المدينة / المنطقة">
              <Input value={city} onChange={(event) => setCity(event.target.value)} placeholder="القاهرة الجديدة، العاصمة..." />
            </FilterGroup>

            <FilterGroup title={`السعر: ${formatEgp(priceRange[0])} - ${formatEgp(priceRange[1])}`}>
              <Slider min={bounds.minPrice} max={bounds.maxPrice || 1} step={50_000} value={priceRange} onValueChange={(value) => setPriceRange(value as [number, number])} />
            </FilterGroup>

            <FilterGroup title={`المساحة: ${areaRange[0]} - ${areaRange[1]} م²`}>
              <Slider min={bounds.minArea} max={bounds.maxArea || 1} step={5} value={areaRange} onValueChange={(value) => setAreaRange(value as [number, number])} />
            </FilterGroup>

            <FilterGroup title="عدد الغرف">
              <div className="grid grid-cols-5 gap-2">
                {['all', '1', '2', '3', '4+'].map((value) => (
                  <Button key={value} type="button" variant={bedrooms === value ? 'default' : 'outline'} size="sm" onClick={() => setBedrooms(value)}>
                    {value === 'all' ? 'الكل' : value}
                  </Button>
                ))}
              </div>
            </FilterGroup>

            <FilterGroup title="التشطيب">
              <ChipGrid options={finishingOptions} selected={selectedFinishing} onToggle={(value) => toggleValue(value, selectedFinishing, setSelectedFinishing)} />
            </FilterGroup>

            <FilterGroup title="الحالة">
              <ChipGrid options={statusOptions} selected={selectedStatuses} onToggle={(value) => toggleValue(value, selectedStatuses, setSelectedStatuses)} />
            </FilterGroup>
          </CardContent>
        </Card>
      </aside>

      <section className="min-w-0 space-y-4">
        <div className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] p-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[var(--fi-muted)]" />
              <Input className="pr-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="بحث بالمشروع أو الوحدة أو المطور..." />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex">
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as InventorySortKey)}
                className="h-8 rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] px-2 text-sm text-[var(--fi-ink)]"
                aria-label="ترتيب"
              >
                <option value="newest">الأحدث</option>
                <option value="price_asc">السعر تصاعدي</option>
                <option value="price_desc">السعر تنازلي</option>
                <option value="area_desc">المساحة</option>
              </select>
              <Button type="button" variant="outline" onClick={() => setFiltersOpen((value) => !value)} className="lg:hidden">
                <Filter className="size-4" />
                الفلاتر
              </Button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-[var(--fi-muted)]">
              عرض <strong className="text-[var(--fi-ink)]">{filtered.length}</strong> وحدة من أصل {localUnits.length}
            </p>
            <div className="flex rounded-lg border border-[var(--fi-line)] p-1">
              {[
                ['grid', LayoutGrid, 'بطاقات'],
                ['list', List, 'قائمة'],
                ['map', Map, 'خريطة'],
              ].map(([key, Icon, label]) => (
                <Button
                  key={key as string}
                  type="button"
                  size="sm"
                  variant={view === key ? 'default' : 'ghost'}
                  onClick={() => setView(key as InventoryViewMode)}
                  aria-label={label as string}
                >
                  <Icon className="size-4" />
                  <span className="hidden sm:inline">{label as string}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] p-10 text-center">
            <Building2 className="mx-auto mb-3 size-10 text-[var(--fi-muted)]" />
            <p className="font-black text-[var(--fi-ink)]">لا توجد وحدات تطابق الفلاتر الحالية</p>
            <p className="mt-1 text-sm text-[var(--fi-muted)]">جرّب توسيع نطاق السعر أو إزالة بعض الفلاتر.</p>
          </div>
        ) : view === 'grid' ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((unit) => <UnitCard key={unit.id} unit={unit} onDetails={setSelectedUnit} onHeld={handleHeld} />)}
          </div>
        ) : view === 'list' ? (
          <div className="overflow-hidden rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)]">
            {filtered.map((unit) => (
              <button
                key={unit.id}
                type="button"
                onClick={() => setSelectedUnit(unit)}
                className="grid w-full gap-2 border-b border-[var(--fi-line)] p-4 text-right last:border-b-0 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto] md:items-center"
              >
                <span className="font-black text-[var(--fi-ink)]">{unit.projectNameAr} - {unit.unitNumber}</span>
                <span className="text-sm text-[var(--fi-muted)]">{unit.developerNameAr}</span>
                <span className="text-sm text-[var(--fi-muted)]">{unit.areaSqm} م² · {unit.bedrooms ?? 0} غرف</span>
                <span className="font-black text-[var(--fi-ink)]">{formatEgp(unit.price)}</span>
                <ChevronDown className="size-4 text-[var(--fi-muted)]" />
              </button>
            ))}
          </div>
        ) : (
          <InventoryMap units={filtered} onDetails={setSelectedUnit} />
        )}
      </section>

      <UnitDetailSheet
        unit={selectedUnit}
        open={Boolean(selectedUnit)}
        onOpenChange={(open) => {
          if (!open) setSelectedUnit(null)
        }}
        onHeld={handleHeld}
      />
    </div>
  )
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-black text-[var(--fi-ink)]">{title}</Label>
      {children}
    </div>
  )
}

function ChipGrid({
  options,
  selected,
  onToggle,
}: {
  options: readonly (readonly [string, string])[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(([value, label]) => (
        <Button key={value} type="button" size="sm" variant={selected.includes(value) ? 'default' : 'outline'} onClick={() => onToggle(value)}>
          {label}
        </Button>
      ))}
    </div>
  )
}
