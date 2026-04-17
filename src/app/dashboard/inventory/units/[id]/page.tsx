import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Building2, ArrowRight, Layers, BedDouble, Maximize2 } from 'lucide-react'
import { getUnit } from '@/domains/inventory/units'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  available: { label: 'متاح',  color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  reserved:  { label: 'محجوز', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  sold:      { label: 'مُباع',  color: 'text-slate-500 bg-slate-100 border-slate-200' },
}

const TYPE_LABELS: Record<string, string> = {
  apartment: 'شقة', villa: 'فيلا', townhouse: 'تاون هاوس',
  studio: 'استوديو', duplex: 'دوبلكس', penthouse: 'بنت هاوس',
  office: 'مكتب', retail: 'تجاري',
}

const fmtFull = (n: number) => new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(n)

export default async function UnitDetailPage({ params }: PageProps) {
  const { id } = await params
  const unit = await getUnit(id).catch(() => null)
  if (!unit) notFound()

  const cfg = STATUS_CFG[unit.status ?? 'available'] ?? STATUS_CFG.available
  const project = unit.projects
  const developer = project?.developers

  const specs = [
    { icon: BedDouble,  label: 'غرف النوم',   value: unit.bedrooms ? `${unit.bedrooms} غرف` : null },
    { icon: Maximize2,  label: 'المساحة',      value: unit.area_sqm ? `${unit.area_sqm} م²` : null },
    { icon: Layers,     label: 'الدور',        value: unit.floor ? `الدور ${unit.floor}` : null },
    { icon: Building2,  label: 'النوع',        value: TYPE_LABELS[unit.unit_type ?? ''] ?? unit.unit_type },
  ].filter(s => s.value)

  return (
    <div className="p-6 space-y-5 max-w-3xl" dir="rtl">
      {/* Back */}
      <Link href="/dashboard/inventory/units" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowRight size={14} /> العودة للوحدات
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">{unit.unit_number ?? 'وحدة'}</h1>
            {project && (
              <Link href={`/dashboard/inventory/projects/${project.id}`} className="text-sm text-blue-600 hover:underline mt-0.5 block">
                {project.name}
              </Link>
            )}
            {developer && (
              <p className="text-xs text-slate-400 mt-0.5">{developer.name}</p>
            )}
          </div>
          <span className={`text-sm font-bold px-3 py-1 rounded-full border ${cfg.color}`}>
            {cfg.label}
          </span>
        </div>

        <p className="text-3xl font-black text-blue-700">{fmtFull(unit.price ?? 0)} ج.م</p>
        {unit.price_per_sqm && (
          <p className="text-xs text-slate-400 mt-1">{fmtFull(unit.price_per_sqm)} ج.م / م²</p>
        )}
      </div>

      {/* Specs */}
      {specs.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {specs.map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                <s.icon size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-400">{s.label}</p>
                <p className="font-bold text-slate-800 text-sm">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
        <h2 className="font-black text-slate-800">تفاصيل الوحدة</h2>
        <dl className="divide-y divide-slate-50">
          {[
            { label: 'التشطيب',         value: unit.finishing },
            { label: 'الاتجاه',          value: unit.orientation },
            { label: 'نسبة العمولة',     value: project?.commission_pct ? `${project.commission_pct}%` : null },
            { label: 'تاريخ التسليم',    value: unit.delivery_date },
            { label: 'معرّف الوحدة',     value: unit.id },
          ].filter(d => d.value).map(d => (
            <div key={d.label} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-slate-500">{d.label}</span>
              <span className="font-bold text-slate-800">{d.value}</span>
            </div>
          ))}
        </dl>
      </div>

      {/* Description */}
      {unit.description && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="font-black text-slate-800 mb-2">الوصف</h2>
          <p className="text-sm text-slate-600 leading-relaxed">{unit.description}</p>
        </div>
      )}

      {/* Actions */}
      {unit.status === 'available' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="font-black text-slate-800 mb-3">الإجراءات</h2>
          <div className="flex gap-3">
            <Link href={`/dashboard/deals/new?unit_id=${id}`}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-center text-sm transition-colors">
              إنشاء صفقة
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
