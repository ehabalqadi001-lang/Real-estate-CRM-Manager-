import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, MapPin, Home, TrendingUp } from 'lucide-react'
import { getProject } from '@/domains/inventory/projects'

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

const fmt = (n: number) =>
  new Intl.NumberFormat('ar-EG', { notation: 'compact', maximumFractionDigits: 1 }).format(n)

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params
  const { project, units } = await getProject(id)
  if (!project) notFound()

  const available = units.filter((u) => u.status === 'available').length
  const reserved  = units.filter((u) => u.status === 'reserved').length
  const sold      = units.filter((u) => u.status === 'sold').length
  const totalValue = units.filter((u) => u.status === 'available').reduce((s, u) => s + Number(u.price ?? 0), 0)

  return (
    <div className="p-6 space-y-5 max-w-4xl" dir="rtl">
      <Link href="/dashboard/inventory" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowRight size={14} /> العودة للمخزون
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900">{project.name}</h1>
            {project.developers && (
              <p className="text-sm text-blue-600 mt-1">{project.developers.name}</p>
            )}
            {project.location && (
              <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-400">
                <MapPin size={12} />
                {project.location}
              </div>
            )}
          </div>
          {project.commission_pct && (
            <div className="bg-blue-50 text-blue-700 rounded-xl px-4 py-2 text-center">
              <p className="text-xs font-bold">عمولة</p>
              <p className="text-xl font-black">{project.commission_pct}%</p>
            </div>
          )}
        </div>

        {project.description && (
          <p className="text-sm text-slate-600 mt-4 leading-relaxed">{project.description}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'إجمالي',   value: units.length, color: 'text-slate-800',   bg: 'bg-slate-50' },
          { label: 'متاح',     value: available,    color: 'text-emerald-700', bg: 'bg-emerald-50' },
          { label: 'محجوز',    value: reserved,     color: 'text-amber-700',   bg: 'bg-amber-50' },
          { label: 'مُباع',     value: sold,         color: 'text-slate-500',   bg: 'bg-slate-100' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {totalValue > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
            <TrendingUp size={16} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-slate-400">إجمالي قيمة المتاح</p>
            <p className="font-black text-emerald-700">{fmt(totalValue)} ج.م</p>
          </div>
        </div>
      )}

      {/* Units grid */}
      <div>
        <h2 className="font-black text-slate-800 mb-3">الوحدات ({units.length})</h2>
        {units.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <Home size={36} className="mx-auto text-slate-200 mb-3" />
            <p className="font-bold text-slate-600">لا توجد وحدات مضافة بعد</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {units.map((unit) => {
              const cfg = STATUS_CFG[unit.status ?? 'available'] ?? STATUS_CFG.available
              return (
                <Link key={unit.id} href={`/dashboard/inventory/units/${unit.id}`}
                  className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md hover:border-slate-200 transition-all group">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{unit.unit_number ?? 'وحدة'}</p>
                      <p className="text-xs text-slate-400">{TYPE_LABELS[unit.unit_type ?? ''] ?? unit.unit_type ?? 'غير محدد'}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    {unit.bedrooms && <span>{unit.bedrooms} غرف</span>}
                    {unit.area_sqm && <span>· {unit.area_sqm} م²</span>}
                    {unit.floor && <span>· دور {unit.floor}</span>}
                  </div>
                  <p className="font-black text-blue-700">{fmt(unit.price ?? 0)} ج.م</p>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
