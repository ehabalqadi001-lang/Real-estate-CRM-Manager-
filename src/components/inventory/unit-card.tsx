'use client'

import Image from 'next/image'
import { Bath, BedDouble, Building2, CalendarClock, Eye, Hand, MapPin, Ruler, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { holdInventoryUnit } from '@/app/dashboard/inventory/actions'
import { HoldTimer } from './hold-timer'
import type { InventoryUnit } from './inventory-types'

interface UnitCardProps {
  unit: InventoryUnit
  onDetails: (unit: InventoryUnit) => void
  onHeld: (unitId: string, heldUntil: string) => void
}

const statusLabels: Record<InventoryUnit['status'], string> = {
  available: 'متاح',
  reserved: 'محجوز',
  sold: 'مباع',
  held: 'محتجز',
}

const statusClass: Record<InventoryUnit['status'], string> = {
  available: 'border-[var(--fi-line)] bg-[var(--fi-soft)] text-[var(--fi-emerald)]',
  reserved: 'border-[var(--fi-line)] bg-[var(--fi-soft)] text-[var(--fi-ink)]',
  sold: 'border-[var(--fi-line)] bg-[var(--fi-soft)] text-[var(--fi-muted)]',
  held: 'border-[var(--fi-line)] bg-[var(--fi-soft)] text-[var(--fi-ink)]',
}

const unitTypeLabels: Record<string, string> = {
  apartment: 'شقة',
  villa: 'فيلا',
  duplex: 'دوبلكس',
  penthouse: 'بنتهاوس',
  studio: 'استوديو',
  office: 'مكتب',
  shop: 'محل',
  chalet: 'شاليه',
  townhouse: 'تاون هاوس',
}

function formatEgp(value: number) {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(value)
}

export function UnitCard({ unit, onDetails, onHeld }: UnitCardProps) {
  async function handleHold() {
    const result = await holdInventoryUnit(unit.id)
    if (!result.ok) {
      toast.error(result.message)
      return
    }

    toast.success(result.message)
    if (result.heldUntil) onHeld(unit.id, result.heldUntil)
  }

  async function handleShare() {
    const url = `${window.location.origin}/inventory?unit=${unit.id}`
    await navigator.clipboard.writeText(url)
    toast.success('تم نسخ رابط المشاركة')
  }

  return (
    <article className="overflow-hidden rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] shadow-sm transition hover:shadow-md">
      <div className="relative aspect-[4/3] bg-[var(--fi-soft)]">
        {unit.coverImageUrl ? (
          <Image
            src={unit.coverImageUrl}
            alt={unit.unitNumber}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[var(--fi-muted)]">
            <Building2 className="size-10" />
          </div>
        )}
        <Badge className={`absolute right-3 top-3 border ${statusClass[unit.status]}`}>
          {statusLabels[unit.status]}
        </Badge>
        <div className="absolute bottom-3 left-3">
          <HoldTimer heldUntil={unit.heldUntil} />
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-black text-[var(--fi-ink)]">{unit.projectNameAr}</h3>
            <p className="mt-1 flex items-center gap-1 text-xs text-[var(--fi-muted)]">
              <MapPin className="size-3.5" />
              <span className="truncate">{unit.location ?? unit.city}</span>
            </p>
          </div>
          {unit.developerLogoUrl ? (
            <Image
              src={unit.developerLogoUrl}
              alt={unit.developerNameAr}
              width={36}
              height={36}
              className="size-9 rounded-md border border-[var(--fi-line)] object-contain"
            />
          ) : (
            <div className="flex size-9 items-center justify-center rounded-md border border-[var(--fi-line)] bg-[var(--fi-soft)] text-xs font-black text-[var(--fi-muted)]">
              {unit.developerNameAr.slice(0, 2)}
            </div>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2 text-xs text-[var(--fi-muted)]">
          <span className="flex items-center gap-1"><Building2 className="size-3.5" />{unitTypeLabels[unit.unitType] ?? unit.unitType}</span>
          <span className="flex items-center gap-1"><Ruler className="size-3.5" />{unit.areaSqm} م²</span>
          <span className="flex items-center gap-1"><BedDouble className="size-3.5" />{unit.bedrooms ?? 0}</span>
          <span className="flex items-center gap-1"><Bath className="size-3.5" />{unit.bathrooms ?? 0}</span>
        </div>

        <div>
          <p className="text-lg font-black text-[var(--fi-ink)]">{formatEgp(unit.price)}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-[var(--fi-muted)]">
            <CalendarClock className="size-3.5" />
            {unit.monthlyInstallment ? `${formatEgp(unit.monthlyInstallment)} شهرياً` : 'خطة السداد غير محددة'}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button type="button" size="sm" onClick={handleHold} disabled={unit.status !== 'available'}>
            <Hand className="size-3.5" />
            احتجاز
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={handleShare}>
            <Share2 className="size-3.5" />
            مشاركة
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => onDetails(unit)}>
            <Eye className="size-3.5" />
            تفاصيل
          </Button>
        </div>
      </div>
    </article>
  )
}
