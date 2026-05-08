'use client'

import { useState } from 'react'
import { Map, Info } from 'lucide-react'
import { useI18n } from '@/hooks/use-i18n'

interface Unit {
  id: string
  unit_name: string
  project_name: string
  unit_type: string
  price: number
  status: string
  floor?: number
}

interface Props { units: Unit[] }

const STATUS_STYLE: Record<string, { bg: string; border: string; text: string }> = {
  available: { bg: 'bg-emerald-400', border: 'border-emerald-500', text: 'text-white' },
  reserved:  { bg: 'bg-amber-400',   border: 'border-amber-500',   text: 'text-white' },
  sold:      { bg: 'bg-red-500',     border: 'border-red-600',     text: 'text-white' },
  default:   { bg: 'bg-slate-200',   border: 'border-slate-300',   text: 'text-slate-600' },
}

export default function InventoryHeatMap({ units }: Props) {
  const { t, numLocale } = useI18n()
  const [hovered, setHovered] = useState<Unit | null>(null)
  const [activeProject, setActiveProject] = useState<string>('all')

  const STATUS_LABEL: Record<string, string> = {
    available: t('متاحة', 'Available'),
    reserved:  t('محجوزة', 'Reserved'),
    sold:      t('مباعة', 'Sold'),
    default:   t('غير محدد', 'Unknown'),
  }

  const projects = ['all', ...Array.from(new Set(units.map(u => u.project_name).filter(Boolean)))]
  const filtered  = activeProject === 'all' ? units : units.filter(u => u.project_name === activeProject)

  const grouped: Record<string, Record<number, Unit[]>> = {}
  for (const u of filtered) {
    const proj  = u.project_name || t('غير محدد', 'Unknown')
    const floor = u.floor ?? 0
    if (!grouped[proj]) grouped[proj] = {}
    if (!grouped[proj][floor]) grouped[proj][floor] = []
    grouped[proj][floor].push(u)
  }

  const stats = {
    available: filtered.filter(u => u.status === 'available').length,
    reserved:  filtered.filter(u => u.status === 'reserved').length,
    sold:      filtered.filter(u => u.status === 'sold').length,
    total:     filtered.length,
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Map size={18} className="text-slate-500" />
          <h2 className="font-black text-slate-800 text-lg">{t('خريطة الوحدات', 'Units Map')}</h2>
          <span className="text-xs text-slate-400">({stats.total} {t('وحدة', 'unit')})</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {Object.entries(STATUS_STYLE).filter(([k]) => k !== 'default').map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded ${cfg.bg}`} />
              <span className="text-xs text-slate-500 font-bold">
                {STATUS_LABEL[key]} ({stats[key as keyof typeof stats] ?? 0})
              </span>
            </div>
          ))}
        </div>
      </div>

      {projects.length > 2 && (
        <div className="flex gap-2 flex-wrap">
          {projects.map(p => (
            <button key={p}
              onClick={() => setActiveProject(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeProject === p ? 'bg-[#00C27C] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p === 'all' ? t('كل المشاريع', 'All Projects') : p}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-1">
        <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
          {stats.available > 0 && <div className="bg-emerald-400 transition-all" style={{ flex: stats.available }} title={STATUS_LABEL.available} />}
          {stats.reserved > 0  && <div className="bg-amber-400 transition-all"   style={{ flex: stats.reserved }}  title={STATUS_LABEL.reserved} />}
          {stats.sold > 0      && <div className="bg-red-500 transition-all"      style={{ flex: stats.sold }}      title={STATUS_LABEL.sold} />}
        </div>
        <div className="flex justify-between text-[10px] text-slate-400">
          <span>{stats.total > 0 ? ((stats.available / stats.total) * 100).toFixed(0) : 0}% {STATUS_LABEL.available}</span>
          <span>{stats.total > 0 ? ((stats.sold / stats.total) * 100).toFixed(0) : 0}% {STATUS_LABEL.sold}</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10 text-slate-300 font-bold text-sm">{t('لا توجد وحدات', 'No units found')}</div>
      ) : (
        <div className="space-y-6 relative">
          {Object.entries(grouped).map(([proj, floors]) => (
            <div key={proj}>
              {activeProject === 'all' && (
                <p className="text-xs font-black text-slate-600 mb-2 pb-1 border-b border-slate-100">{proj}</p>
              )}
              <div className="space-y-2">
                {Object.entries(floors)
                  .sort(([a], [b]) => Number(b) - Number(a))
                  .map(([floor, floorUnits]) => (
                    <div key={floor} className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 w-12 shrink-0 text-left font-bold">
                        {Number(floor) === 0 ? t('أرضي', 'Ground') : `${t('ط', 'Fl')} ${floor}`}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {floorUnits.map(unit => {
                          const cfg = STATUS_STYLE[unit.status] ?? STATUS_STYLE.default
                          return (
                            <button
                              key={unit.id}
                              onMouseEnter={() => setHovered(unit)}
                              onMouseLeave={() => setHovered(null)}
                              className={`relative w-10 h-10 rounded-lg border-2 ${cfg.bg} ${cfg.border} ${cfg.text}
                                flex items-center justify-center text-[9px] font-black transition-transform hover:scale-110 hover:z-10 hover:shadow-lg`}
                              title={unit.unit_name}
                            >
                              {unit.unit_name.slice(-3)}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}

          {hovered && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white rounded-xl px-4 py-3 shadow-2xl text-sm pointer-events-none min-w-[200px]" dir="rtl">
              <div className="flex items-center gap-2 mb-1">
                <Info size={13} className="text-blue-400" />
                <span className="font-black">{hovered.unit_name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                  hovered.status === 'available' ? 'bg-emerald-500' :
                  hovered.status === 'reserved'  ? 'bg-amber-500' : 'bg-red-500'
                }`}>
                  {STATUS_LABEL[hovered.status] ?? hovered.status}
                </span>
              </div>
              <p className="text-xs text-slate-300">{hovered.unit_type} · {hovered.project_name}</p>
              <p className="text-xs text-emerald-400 font-bold mt-1">{Number(hovered.price).toLocaleString(numLocale)} {t('ج.م', 'EGP')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
