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
import { useI18n } from '@/hooks/use-i18n'

interface UnitDetailSheetProps {
  unit: InventoryUnit | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onHeld: (unitId: string, heldUntil: string) => void
}

export function UnitDetailSheet({ unit, open, onOpenChange, onHeld }: UnitDetailSheetProps) {
  const { t, numLocale } = useI18n()
  const [emblaRef] = useEmblaCarousel({ direction: 'rtl', loop: true })
  const images = unit ? Array.from(new Set([unit.coverImageUrl, ...unit.galleryUrls].filter(Boolean))) as string[] : []

  const unitTypeLabels: Record<string, string> = {
    apartment: t('شقة', 'Apartment'),
    villa: t('فيلا', 'Villa'),
    duplex: t('دوبلكس', 'Duplex'),
    penthouse: t('بنتهاوس', 'Penthouse'),
    studio: t('استوديو', 'Studio'),
    office: t('مكتب', 'Office'),
    shop: t('محل', 'Shop'),
    chalet: t('شاليه', 'Chalet'),
    townhouse: t('تاون هاوس', 'Townhouse'),
  }

  const finishingLabels: Record<string, string> = {
    fully_finished: t('تشطيب كامل', 'Fully Finished'),
    semi_finished: t('نصف تشطيب', 'Semi-Finished'),
    core_shell: t('بدون تشطيب', 'Core & Shell'),
    furnished: t('مفروش', 'Furnished'),
  }

  function formatEgp(value: number) {
    return new Intl.NumberFormat(numLocale, {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0,
    }).format(value)
  }

  function frequencyLabel(value: string | null) {
    if (value === 'quarterly') return t('ربع سنوي', 'Quarterly')
    if (value === 'semi_annual') return t('نصف سنوي', 'Semi-Annual')
    if (value === 'annual') return t('سنوي', 'Annual')
    return t('شهري', 'Monthly')
  }

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
    toast.success(t('تم نسخ رابط الوحدة للعميل', 'Unit link copied for client'))
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
                  { icon: Building2, label: t('النوع', 'Type'), value: unitTypeLabels[unit.unitType] ?? unit.unitType },
                  { icon: Ruler, label: t('المساحة', 'Area'), value: `${unit.areaSqm} ${t('م²', 'm²')}` },
                  { icon: BedDouble, label: t('الغرف', 'Rooms'), value: unit.bedrooms ?? 0 },
                  { icon: Bath, label: t('الحمامات', 'Bathrooms'), value: unit.bathrooms ?? 0 },
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
                    <p className="text-xs text-[var(--fi-muted)]">{t('السعر الإجمالي', 'Total Price')}</p>
                    <p className="mt-1 text-2xl font-black text-[var(--fi-ink)]">{formatEgp(unit.price)}</p>
                  </div>
                  <Badge className="border border-[var(--fi-line)] bg-[var(--fi-soft)] text-[var(--fi-ink)]">
                    {finishingLabels[unit.finishing ?? ''] ?? t('التشطيب غير محدد', 'Finishing not set')}
                  </Badge>
                </div>
              </div>

              <Tabs defaultValue="plans" dir="rtl">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="plans">{t('خطط السداد', 'Payment Plans')}</TabsTrigger>
                  <TabsTrigger value="specs">{t('المواصفات', 'Specifications')}</TabsTrigger>
                  <TabsTrigger value="media">{t('المخطط والجولة', 'Floor Plan & Tour')}</TabsTrigger>
                </TabsList>

                <TabsContent value="plans" className="mt-4 space-y-3">
                  {unit.paymentPlans.length > 0 ? (
                    unit.paymentPlans.map((plan) => (
                      <div key={plan.id} className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-black text-[var(--fi-ink)]">{plan.name}</p>
                            <p className="mt-1 text-sm text-[var(--fi-muted)]">{plan.description ?? t('بدون وصف إضافي', 'No additional description')}</p>
                          </div>
                          <Badge className="border border-[var(--fi-line)] bg-[var(--fi-soft)] text-[var(--fi-ink)]">
                            {frequencyLabel(plan.installmentFrequency)}
                          </Badge>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                          <span>{t('مقدم', 'Down')} {plan.downPaymentPercentage ?? unit.downPayment ?? 0}%</span>
                          <span>{plan.installmentYears ?? unit.installmentYears ?? 0} {t('سنوات', 'years')}</span>
                          <span>{t('صيانة', 'Maint.')} {plan.maintenanceFeePercentage ?? 0}%</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-soft)] p-6 text-center text-sm text-[var(--fi-muted)]">
                      {t('لا توجد خطط سداد مسجلة لهذه الوحدة.', 'No payment plans registered for this unit.')}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="specs" className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <Spec label={t('الدور', 'Floor')} value={unit.floorNumber ?? t('غير محدد', 'N/A')} />
                  <Spec label={t('المبنى', 'Building')} value={unit.building ?? t('غير محدد', 'N/A')} />
                  <Spec label={t('الإطلالة', 'View')} value={unit.view ?? t('غير محدد', 'N/A')} />
                  <Spec label={t('المطور', 'Developer')} value={unit.developerNameAr} />
                  <Spec label={t('مقدم الحجز', 'Down Payment')} value={unit.downPayment ? formatEgp(unit.downPayment) : t('غير محدد', 'N/A')} />
                  <Spec label={t('القسط الشهري', 'Monthly Installment')} value={unit.monthlyInstallment ? formatEgp(unit.monthlyInstallment) : t('غير محدد', 'N/A')} />
                </TabsContent>

                <TabsContent value="media" className="mt-4 space-y-4">
                  {unit.floorPlanUrl ? (
                    <Link href={unit.floorPlanUrl} target="_blank" className="flex items-center gap-2 rounded-lg border border-[var(--fi-line)] p-4 font-bold text-[var(--fi-ink)]">
                      <SquareStack className="size-4" />
                      {t('فتح مخطط الوحدة', 'Open Floor Plan')}
                    </Link>
                  ) : (
                    <div className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-soft)] p-4 text-sm text-[var(--fi-muted)]">
                      {t('لا يوجد مخطط مرفق.', 'No floor plan attached.')}
                    </div>
                  )}

                  {unit.virtualTourUrl ? (
                    <iframe
                      src={unit.virtualTourUrl}
                      title={t('جولة افتراضية', 'Virtual Tour')}
                      className="aspect-video w-full rounded-lg border border-[var(--fi-line)]"
                      allowFullScreen
                    />
                  ) : (
                    <div className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-soft)] p-4 text-sm text-[var(--fi-muted)]">
                      {t('لا توجد جولة افتراضية.', 'No virtual tour available.')}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Link href={`/dashboard/pipeline/new?unit=${unit.id}`} className={buttonVariants({ className: 'h-8 gap-1.5 px-2.5' })}>
                  <Send className="size-4" />
                  {t('إضافة لصفقة', 'Add to Deal')}
                </Link>
                <Button type="button" variant="outline" onClick={handleShare}>
                  <Copy className="size-4" />
                  {t('إرسال للعميل', 'Send to Client')}
                </Button>
                <Button type="button" variant="outline" onClick={handleHold} disabled={unit.status !== 'available'}>
                  <Hand className="size-4" />
                  {t('احتجاز ٤٨ ساعة', 'Hold for 48 Hours')}
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
