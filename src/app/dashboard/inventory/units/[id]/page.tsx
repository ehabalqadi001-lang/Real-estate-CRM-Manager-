import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import {
  Building2, ArrowRight, Layers, BedDouble, Maximize2,
  Bath, MapPin, Calendar, Percent, Tag, Home,
  Clock, CheckCircle, ImageOff,
} from 'lucide-react'
import { getUnit } from '@/domains/inventory/units'
import { createServerClient } from '@/lib/supabase/server'
import ReserveButton from './ReserveButton'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  available: { label: 'متاح للبيع', color: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700' },
  reserved:  { label: 'محجوز',      color: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700' },
  sold:      { label: 'مُباع',       color: 'text-slate-500 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700' },
}

const TYPE_LABELS: Record<string, string> = {
  apartment: 'شقة', villa: 'فيلا', townhouse: 'تاون هاوس',
  studio: 'استوديو', duplex: 'دوبلكس', penthouse: 'بنت هاوس',
  office: 'مكتب', retail: 'تجاري', chalet: 'شاليه',
}

const FINISHING_LABELS: Record<string, string> = {
  fully_finished:   'مشطّب بالكامل',
  semi_finished:    'نص تشطيب',
  core_and_shell:   'بدون تشطيب',
  ultra_luxury:     'تشطيب فندقي',
}

const fmt = (n: number) => new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(n)

async function getUnitMedia(unitId: string) {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('unit_media')
    .select('id, url, thumbnail_url, type, title, is_primary')
    .eq('unit_id', unitId)
    .order('sort_order')
    .limit(20)
  return data ?? []
}

async function getActiveReservation(unitId: string) {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('unit_reservations')
    .select('id, client_name, reserved_at, expires_at, status')
    .eq('unit_id', unitId)
    .eq('status', 'active')
    .maybeSingle()
  return data
}

export default async function UnitDetailPage({ params }: PageProps) {
  const { id } = await params

  const [unit, media, reservation] = await Promise.all([
    getUnit(id).catch(() => null),
    getUnitMedia(id),
    getActiveReservation(id),
  ])

  if (!unit) notFound()

  const cfg = STATUS_CFG[unit.status ?? 'available'] ?? STATUS_CFG.available
  const project = unit.projects
  const developer = project?.developers
  const primaryImage = media.find(m => m.is_primary && m.type === 'image') ?? media.find(m => m.type === 'image')
  const images = media.filter(m => m.type === 'image')
  const floorPlans = media.filter(m => m.type === 'floor_plan')

  const specs = [
    { icon: Maximize2, label: 'المساحة',     value: unit.area_sqm ? `${unit.area_sqm} م²` : null },
    { icon: BedDouble, label: 'غرف النوم',   value: unit.bedrooms != null ? `${unit.bedrooms} غرف` : null },
    { icon: Bath,      label: 'الحمامات',    value: unit.bathrooms != null ? `${unit.bathrooms}` : null },
    { icon: Layers,    label: 'الدور',       value: unit.floor != null ? `الدور ${unit.floor}` : null },
    { icon: Home,      label: 'نوع الوحدة',  value: TYPE_LABELS[unit.unit_type ?? ''] ?? unit.unit_type },
    { icon: Tag,       label: 'التشطيب',     value: FINISHING_LABELS[unit.finishing_type ?? ''] ?? unit.finishing },
    { icon: MapPin,    label: 'الاتجاه',     value: unit.orientation ?? null },
    { icon: Calendar,  label: 'تاريخ التسليم', value: unit.delivery_date ?? null },
  ].filter(s => s.value)

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-4xl" dir="rtl">
      {/* Back */}
      <Link
        href="/dashboard/inventory/units"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
      >
        <ArrowRight size={14} /> العودة للوحدات
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-5">

          {/* Image Gallery */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 overflow-hidden">
            {primaryImage ? (
              <div className="relative">
                <Image
                  src={primaryImage.url}
                  alt={primaryImage.title ?? unit.unit_number ?? 'صورة الوحدة'}
                  width={1200}
                  height={640}
                  className="w-full h-64 lg:h-80 object-cover"
                />
                <div className="absolute top-3 end-3">
                  <span className={`text-sm font-bold px-3 py-1 rounded-full border ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>
                {images.length > 1 && (
                  <div className="absolute bottom-3 end-3 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
                    {images.length} صور
                  </div>
                )}
              </div>
            ) : (
              <div className="relative h-48 bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center gap-2">
                <ImageOff className="w-10 h-10 text-gray-300" />
                <span className="text-xs text-gray-400">لا توجد صور مرفوعة</span>
                <div className="absolute top-3 end-3">
                  <span className={`text-sm font-bold px-3 py-1 rounded-full border ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>
              </div>
            )}

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {images.slice(0, 6).map(img => (
                  <div key={img.id} className="shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-400 transition-colors">
                    <Image src={img.thumbnail_url ?? img.url} alt="" width={64} height={64} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Title + Price */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                  {unit.unit_number ?? 'وحدة'}
                </h1>
                {project && (
                  <Link
                    href={`/dashboard/inventory/projects/${project.id}`}
                    className="text-sm text-blue-600 hover:underline mt-0.5 block"
                  >
                    {project.name}
                  </Link>
                )}
                {developer && (
                  <p className="text-xs text-slate-400 mt-0.5">{developer.name}</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-3xl font-black text-blue-700 dark:text-blue-400">
                {fmt(unit.price ?? 0)} ج.م
              </p>
              {unit.area_sqm && unit.price && (
                <p className="text-sm text-slate-400 mt-1">
                  {fmt(Math.round(unit.price / unit.area_sqm))} ج.م / م²
                </p>
              )}
            </div>

            {/* Payment Plan */}
            {project?.down_payment_pct && (
              <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 flex items-center gap-2">
                <Percent className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                  مقدّم {project.down_payment_pct}% + تقسيط {project.payment_years} سنوات
                </span>
              </div>
            )}
          </div>

          {/* Specs Grid */}
          {specs.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 p-5">
              <h2 className="font-black text-slate-800 dark:text-white mb-4">المواصفات</h2>
              <div className="grid grid-cols-2 gap-3">
                {specs.map(s => (
                  <div key={s.label} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shrink-0">
                      <s.icon size={15} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">{s.label}</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Floor Plans */}
          {floorPlans.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 p-5">
              <h2 className="font-black text-slate-800 dark:text-white mb-3">المخططات</h2>
              <div className="grid grid-cols-2 gap-3">
                {floorPlans.map(fp => (
                  <a key={fp.id} href={fp.url} target="_blank" rel="noreferrer"
                    className="block rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <Image src={fp.thumbnail_url ?? fp.url} alt={fp.title ?? 'مخطط'} width={400} height={128} className="w-full h-32 object-cover" />
                    <div className="p-2 text-xs text-gray-600 dark:text-gray-400">{fp.title ?? 'مخطط الطابق'}</div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {unit.description && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 p-5">
              <h2 className="font-black text-slate-800 dark:text-white mb-2">وصف الوحدة</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{unit.description}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Reservation Timer */}
          {reservation && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="font-semibold text-sm text-amber-800 dark:text-amber-300">محجوزة</span>
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                محجوزة لـ: <strong>{reservation.client_name}</strong>
              </p>
              <p className="text-xs text-amber-600 mt-1">
                تنتهي: {new Date(reservation.expires_at).toLocaleString('ar-EG')}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 p-4 space-y-3">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">الإجراءات</h3>

            {unit.status === 'available' && (
              <>
                <Link
                  href={`/dashboard/deals/new?unit_id=${id}`}
                  className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
                >
                  <CheckCircle size={15} />
                  إنشاء صفقة
                </Link>
                <ReserveButton unitId={id} />
              </>
            )}
            {unit.status === 'reserved' && (
              <ReserveButton
                unitId={id}
                isReserved
                reservedFor={reservation?.client_name}
                expiresAt={reservation?.expires_at}
              />
            )}

            <Link
              href={`/dashboard/compare?units=${id}`}
              className="flex items-center justify-center gap-2 w-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium py-2.5 rounded-xl text-sm transition-colors"
            >
              <Building2 size={15} />
              مقارنة مع وحدات أخرى
            </Link>
          </div>

          {/* Commission Info */}
          {project?.commission_pct && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Percent className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-sm text-green-800 dark:text-green-300">عمولة الوسيط</span>
              </div>
              <p className="text-2xl font-black text-green-700 dark:text-green-400">{project.commission_pct}%</p>
              {unit.price && (
                <p className="text-xs text-green-600 mt-1">
                  ≈ {fmt(Math.round(unit.price * (project.commission_pct / 100)))} ج.م
                </p>
              )}
            </div>
          )}

          {/* Quick Details */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 p-4">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm mb-3">معلومات سريعة</h3>
            <dl className="space-y-2 text-sm">
              {[
                { label: 'المشروع',   value: project?.name ?? '—' },
                { label: 'المطوّر',   value: developer?.name ?? project?.developer_name ?? '—' },
                { label: 'المنطقة',   value: project?.location ?? '—' },
                { label: 'الحالة',    value: cfg.label },
                { label: 'رقم الوحدة', value: unit.unit_number ?? id.slice(0, 8) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center gap-2">
                  <span className="text-gray-400 shrink-0">{label}</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300 text-end truncate">{value}</span>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
