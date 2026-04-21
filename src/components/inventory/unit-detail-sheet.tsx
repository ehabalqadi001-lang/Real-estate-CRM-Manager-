'use client'

import Image from 'next/image'
import Link from 'next/link'
import useEmblaCarousel from 'embla-carousel-react'
import { Bath, BedDouble, Building2, Copy, Hand, MapPin, Ruler, Send, SquareStack } from 'lucide-react'
import { toast } from 'sonner'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { holdInventoryUnit } from '@/app/dashboard/inventory/actions'
import { AiPriceAnalyzerButton } from '@/components/ai/ai-price-analyzer-button'
import { HoldTimer } from './hold-timer'
import type { InventoryUnit } from './inventory-types'

interface UnitDetailSheetProps {
  unit: InventoryUnit | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onHeld: (unitId: string, heldUntil: string) => void
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

const finishingLabels: Record<string, string> = {
  fully_finished: 'تشطيب كامل',
  semi_finished: 'نصف تشطيب',
  core_shell: 'بدون تشطيب',
  furnished: 'مفروش',
}

function formatEgp(value: number) {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(value)
}

function frequencyLabel(value: string | null) {
  if (value === 'quarterly') return 'ربع سنوي'
  if (value === 'semi_annual') return 'نصف سنوي'
  if (value === 'annual') return 'سنوي'
  return 'شهري'
}

export function UnitDetailSheet({ unit, open, onOpenChange, onHeld }: UnitDetailSheetProps) {
  const [emblaRef] = useEmblaCarousel({ direction: 'rtl', loop: true })
  const images = unit ? Array.from(new Set([unit.coverImageUrl, ...unit.galleryUrls].filter(Boolean))) as string[] : []

  async function handleHold() {
    if (!unit) return
    const result = await holdInventoryUnit(unit.id)
    if (!result.ok) {
      toast.error(result.message)
      return
    }

    toast.success(result.message)
    if (result.heldUntil) onHeld(unit.id, result.heldUntil)
  }

  async function handleShare() {
    if (!unit) return
    const url = `${window.location.origin}/inventory?unit=${unit.id}`
    await navigator.clipboard.writeText(url)
    toast.success('تم نسخ رابط الوحدة للعميل')
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full overflow-y-auto p-0 sm:max-w-2xl" dir="rtl">
        {unit ? (
          <>
            <SheetHeader className="border-b border-[var(--fi-line)] p-5">
              <div className="flex items-start justify-between gap-4 pl-10">
                <div>
                  <SheetTitle className="text-xl font-black text-[var(--fi-ink)]">
                    {unit.projectNameAr} - {unit.unitNumber}
                  </SheetTitle>
                  <SheetDescription className="mt-1 flex items-center gap-1 text-[var(--fi-muted)]">
                    <MapPin className="size-4" />
                    {unit.location ?? unit.city}
                  </SheetDescription>
                </div>
                <HoldTimer heldUntil={unit.heldUntil} />
              </div>
            </SheetHeader>

            <div className="space-y-5 p-5">
              <div className="overflow-hidden rounded-lg border border-[var(--fi-line)] bg-[var(--fi-soft)]" ref={emblaRef}>
                <div className="flex">
                  {(images.length ? images : ['']).map((image, index) => (
                    <div key={`${image}-${index}`} className="relative min-w-0 flex-[0_0_100%]">
                      <div className="relative aspect-[16/10]">
                        {image ? (
                          <Image src={image} alt={unit.unitNumber} fill sizes="100vw" className="object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[var(--fi-muted)]">
                            <Building2 className="size-12" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { icon: Building2, label: 'النوع', value: unitTypeLabels[unit.unitType] ?? unit.unitType },
                  { icon: Ruler, label: 'المساحة', value: `${unit.areaSqm} م²` },
                  { icon: BedDouble, label: 'الغرف', value: unit.bedrooms ?? 0 },
                  { icon: Bath, label: 'الحمامات', value: unit.bathrooms ?? 0 },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] p-3">
                    <item.icon className="mb-2 size-4 text-[var(--fi-muted)]" />
                    <p className="text-xs text-[var(--fi-muted)]">{item.label}</p>
                    <p className="mt-1 font-black text-[var(--fi-ink)]">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-[var(--fi-muted)]">السعر الإجمالي</p>
                    <p className="mt-1 text-2xl font-black text-[var(--fi-ink)]">{formatEgp(unit.price)}</p>
                  </div>
                  <Badge className="border border-[var(--fi-line)] bg-[var(--fi-soft)] text-[var(--fi-ink)]">
                    {finishingLabels[unit.finishing ?? ''] ?? 'التشطيب غير محدد'}
                  </Badge>
                </div>
              </div>

              <Tabs defaultValue="plans" dir="rtl">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="plans">خطط السداد</TabsTrigger>
                  <TabsTrigger value="specs">المواصفات</TabsTrigger>
                  <TabsTrigger value="media">المخطط والجولة</TabsTrigger>
                </TabsList>

                <TabsContent value="plans" className="mt-4 space-y-3">
                  {unit.paymentPlans.length > 0 ? (
                    unit.paymentPlans.map((plan) => (
                      <div key={plan.id} className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-black text-[var(--fi-ink)]">{plan.name}</p>
                            <p className="mt-1 text-sm text-[var(--fi-muted)]">{plan.description ?? 'بدون وصف إضافي'}</p>
                          </div>
                          <Badge className="border border-[var(--fi-line)] bg-[var(--fi-soft)] text-[var(--fi-ink)]">
                            {frequencyLabel(plan.installmentFrequency)}
                          </Badge>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                          <span>مقدم {plan.downPaymentPercentage ?? unit.downPayment ?? 0}%</span>
                          <span>{plan.installmentYears ?? unit.installmentYears ?? 0} سنوات</span>
                          <span>صيانة {plan.maintenanceFeePercentage ?? 0}%</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-soft)] p-6 text-center text-sm text-[var(--fi-muted)]">
                      لا توجد خطط سداد مسجلة لهذه الوحدة.
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="specs" className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <Spec label="الدور" value={unit.floorNumber ?? 'غير محدد'} />
                  <Spec label="المبنى" value={unit.building ?? 'غير محدد'} />
                  <Spec label="الإطلالة" value={unit.view ?? 'غير محدد'} />
                  <Spec label="المطور" value={unit.developerNameAr} />
                  <Spec label="مقدم الحجز" value={unit.downPayment ? formatEgp(unit.downPayment) : 'غير محدد'} />
                  <Spec label="القسط الشهري" value={unit.monthlyInstallment ? formatEgp(unit.monthlyInstallment) : 'غير محدد'} />
                </TabsContent>

                <TabsContent value="media" className="mt-4 space-y-4">
                  {unit.floorPlanUrl ? (
                    <Link href={unit.floorPlanUrl} target="_blank" className="flex items-center gap-2 rounded-lg border border-[var(--fi-line)] p-4 font-bold text-[var(--fi-ink)]">
                      <SquareStack className="size-4" />
                      فتح مخطط الوحدة
                    </Link>
                  ) : (
                    <div className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-soft)] p-4 text-sm text-[var(--fi-muted)]">
                      لا يوجد مخطط مرفق.
                    </div>
                  )}

                  {unit.virtualTourUrl ? (
                    <iframe
                      src={unit.virtualTourUrl}
                      title="جولة افتراضية"
                      className="aspect-video w-full rounded-lg border border-[var(--fi-line)]"
                      allowFullScreen
                    />
                  ) : (
                    <div className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-soft)] p-4 text-sm text-[var(--fi-muted)]">
                      لا توجد جولة افتراضية.
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Link href={`/dashboard/pipeline/new?unit=${unit.id}`} className={buttonVariants({ className: 'h-8 gap-1.5 px-2.5' })}>
                  <Send className="size-4" />
                  إضافة لصفقة
                </Link>
                <Button type="button" variant="outline" onClick={handleShare}>
                  <Copy className="size-4" />
                  إرسال للعميل
                </Button>
                <Button type="button" variant="outline" onClick={handleHold} disabled={unit.status !== 'available'}>
                  <Hand className="size-4" />
                  احتجاز ٤٨ ساعة
                </Button>
                <AiPriceAnalyzerButton
                  input={{
                    unitId: unit.id,
                    projectId: unit.projectId,
                    unitType: unit.unitType,
                    areaSqm: unit.areaSqm,
                    price: unit.price,
                    city: unit.city,
                    finishing: unit.finishing,
                  }}
                />
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function Spec({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] p-3">
      <p className="text-xs text-[var(--fi-muted)]">{label}</p>
      <p className="mt-1 font-bold text-[var(--fi-ink)]">{value}</p>
    </div>
  )
}
