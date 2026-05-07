import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, MapPin, Home, TrendingUp } from 'lucide-react'
import { getProject } from '@/domains/inventory/projects'
import AddUnitButton from './AddUnitButton'
import { getI18n } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params
  const [{ project, units }, { t, numLocale }] = await Promise.all([
    getProject(id),
    getI18n(),
  ])
  if (!project) notFound()

  const STATUS_CFG: Record<string, { label: string; color: string }> = {
    available: { label: t('متاح', 'Available'),  color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    reserved:  { label: t('محجوز', 'Reserved'), color: 'text-amber-700 bg-amber-50 border-amber-200' },
    sold:      { label: t('مُباع', 'Sold'),  color: 'text-slate-500 bg-slate-100 border-slate-200' },
  }

  const TYPE_LABELS: Record<string, string> = {
    apartment:  t('شقة', 'Apartment'),
    villa:      t('فيلا', 'Villa'),
    townhouse:  t('تاون هاوس', 'Townhouse'),
    studio:     t('استوديو', 'Studio'),
    duplex:     t('دوبلكس', 'Duplex'),
    penthouse:  t('بنت هاوس', 'Penthouse'),
    office:     t('مكتب', 'Office'),
    retail:     t('تجاري', 'Retail'),
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat(numLocale, { notation: 'compact', maximumFractionDigits: 1 }).format(n)

  const available = units.filter((u) => u.status === 'available').length
  const reserved  = units.filter((u) => u.status === 'reserved').length
  const sold      = units.filter((u) => u.status === 'sold').length
  const totalValue = units.filter((u) => u.status === 'available').reduce((s, u) => s + Number(u.price ?? 0), 0)

  return (
    <div className="p-6 space-y-5 max-w-4xl" dir="rtl">
      <Link href="/dashboard/inventory" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowRight size={14} /> {t('العودة للمخزون', 'Back to Inventory')}
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-6 shadow-sm">
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
              <p className="text-xs font-bold">{t('عمولة', 'Commission')}</p>
              <p className="text-xl font-black">{project.commission_pct}%</p>
            </div>
          )}
        </div>

        {project.description && (
          <p className="text-sm text-slate-600 mt-4 leading-relaxed">{project.description}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: t('إجمالي', 'Total'),   value: units.length, color: 'text-slate-800',   bg: 'bg-slate-50' },
          { label: t('متاح', 'Available'), value: available,    color: 'text-emerald-700', bg: 'bg-emerald-50' },
          { label: t('محجوز', 'Reserved'), value: reserved,     color: 'text-amber-700',   bg: 'bg-amber-50' },
          { label: t('مُباع', 'Sold'),      value: sold,         color: 'text-slate-500',   bg: 'bg-slate-100' },
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
            <p className="text-xs text-slate-400">{t('إجمالي قيمة المتاح', 'Total Available Value')}</p>
            <p className="font-black text-emerald-700">{fmt(totalValue)} {t('ج.م', 'EGP')}</p>
          </div>
        </div>
      )}

      {/* Units grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-slate-800">{t('الوحدات', 'Units')} ({units.length})</h2>
          <AddUnitButton projectId={project.id} />
        </div>
        {units.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <Home size={36} className="mx-auto text-slate-200 mb-3" />
            <p className="font-bold text-slate-600">{t('لا توجد وحدات مضافة بعد', 'No units added yet')}</p>
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
                      <p className="font-bold text-slate-900 text-sm">{unit.unit_number ?? t('وحدة', 'Unit')}</p>
                      <p className="text-xs text-slate-400">{TYPE_LABELS[unit.unit_type ?? ''] ?? unit.unit_type ?? t('غير محدد', 'Unknown')}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    {unit.bedrooms && <span>{unit.bedrooms} {t('غرف', 'br')}</span>}
                    {unit.area_sqm && <span>· {unit.area_sqm} m²</span>}
                    {unit.floor && <span>· {t('دور', 'Fl.')} {unit.floor}</span>}
                  </div>
                  <p className="font-black text-blue-700">{fmt(unit.price ?? 0)} {t('ج.م', 'EGP')}</p>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
