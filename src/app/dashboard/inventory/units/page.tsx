import Link from 'next/link'
import { Building2, ArrowUpRight } from 'lucide-react'
import { getProjects } from '@/domains/inventory/projects'
import { getUnits } from '@/domains/inventory/units'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ project?: string; status?: string; type?: string }>
}

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  available: { label: 'متاح',    color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  reserved:  { label: 'محجوز',   color: 'text-amber-700 bg-amber-50 border-amber-200' },
  sold:      { label: 'مُباع',    color: 'text-slate-500 bg-slate-100 border-slate-200' },
}

const TYPE_LABELS: Record<string, string> = {
  apartment: 'شقة', villa: 'فيلا', townhouse: 'تاون هاوس',
  studio: 'استوديو', duplex: 'دوبلكس', penthouse: 'بنت هاوس',
  office: 'مكتب', retail: 'تجاري',
}

const fmt = (n: number) =>
  new Intl.NumberFormat('ar-EG', { notation: 'compact', maximumFractionDigits: 1 }).format(n)

export default async function UnitsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const [{ units, total }, projects] = await Promise.all([
    getUnits({ projectId: params.project, status: params.status, unitType: params.type }),
    getProjects(),
  ])

  const tabs = [
    { key: undefined,    label: 'الكل' },
    { key: 'available',  label: 'متاح' },
    { key: 'reserved',   label: 'محجوز' },
    { key: 'sold',       label: 'مُباع' },
  ]

  return (
    <div className="p-6 space-y-5" dir="rtl">
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Building2 size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900">الوحدات</h1>
            <p className="text-xs text-slate-400">{total} وحدة</p>
          </div>
        </div>
        <form className="flex items-center gap-2">
          <select
            name="project"
            defaultValue={params.project ?? ''}
            className="text-sm border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none"
          >
            <option value="">كل المشاريع</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button type="submit" className="text-sm font-bold border border-slate-200 rounded-xl px-3 py-2 text-slate-600 hover:bg-slate-50">
            ØªØµÙÙŠØ©
          </button>
        </form>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2">
        {tabs.map(tab => {
          const active = (params.status ?? undefined) === tab.key
          const href = tab.key
            ? `/dashboard/inventory/units?status=${tab.key}${params.project ? `&project=${params.project}` : ''}`
            : `/dashboard/inventory/units${params.project ? `?project=${params.project}` : ''}`
          return (
            <Link key={tab.label} href={href}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${active ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {tab.label}
            </Link>
          )
        })}
      </div>

      {/* Units grid */}
      {units.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-100">
          <Building2 size={40} className="mx-auto text-slate-200 mb-3" />
          <p className="font-bold text-slate-600">لا توجد وحدات</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {units.map((unit) => {
            const cfg = STATUS_CFG[unit.status ?? 'available'] ?? STATUS_CFG.available
            return (
              <Link key={unit.id} href={`/dashboard/inventory/units/${unit.id}`}
                className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md hover:border-slate-200 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-black text-slate-900 text-sm">{unit.unit_number ?? 'وحدة'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{unit.projects?.name ?? '—'}</p>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-3">
                  {unit.unit_type && (
                    <span className="bg-slate-50 rounded-lg px-2 py-1 font-medium">
                      {TYPE_LABELS[unit.unit_type ?? ''] ?? unit.unit_type}
                    </span>
                  )}
                  {unit.bedrooms && (
                    <span className="bg-slate-50 rounded-lg px-2 py-1 font-medium">
                      {unit.bedrooms} غرف
                    </span>
                  )}
                  {unit.area_sqm && (
                    <span className="bg-slate-50 rounded-lg px-2 py-1 font-medium">
                      {unit.area_sqm} م²
                    </span>
                  )}
                  {unit.floor && (
                    <span className="bg-slate-50 rounded-lg px-2 py-1 font-medium">
                      دور {unit.floor}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <p className="font-black text-blue-700 text-base">{fmt(unit.price ?? 0)} ج.م</p>
                  <ArrowUpRight size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
