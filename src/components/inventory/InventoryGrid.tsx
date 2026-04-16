'use client'

import { useState } from 'react'
import { Building, MapPin, Tag, Search, LayoutGrid, LayoutList } from 'lucide-react'

interface Unit {
  id: string
  unit_name: string
  project_name: string
  unit_type: string
  price: number
  status: string
  area?: number
  floor?: number
  developer?: string
}

const STATUS_TABS = [
  { key: 'all',       label: 'الكل',     color: 'bg-slate-100 text-slate-700' },
  { key: 'available', label: 'متاحة',    color: 'bg-emerald-100 text-emerald-700' },
  { key: 'reserved',  label: 'محجوزة',   color: 'bg-amber-100 text-amber-700' },
  { key: 'sold',      label: 'مباعة',    color: 'bg-red-100 text-red-700' },
]

const STATUS_STYLE: Record<string, { label: string; dot: string; badge: string }> = {
  available: { label: 'متاحة',  dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  reserved:  { label: 'محجوزة', dot: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  sold:      { label: 'مباعة',  dot: 'bg-red-500',     badge: 'bg-red-50 text-red-700 border-red-200' },
}

export default function InventoryGrid({ initialData }: { initialData: Unit[] }) {
  const [search, setSearch]       = useState('')
  const [statusTab, setStatusTab] = useState('all')
  const [view, setView]           = useState<'grid' | 'map'>('grid')

  const safeData = Array.isArray(initialData) ? initialData : []

  const filtered = safeData.filter(u => {
    const matchSearch = (u.unit_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
                        (u.project_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
                        (u.developer ?? '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusTab === 'all' || u.status === statusTab
    return matchSearch && matchStatus
  })

  // إحصائيات سريعة
  const counts = {
    available: safeData.filter(u => u.status === 'available').length,
    reserved:  safeData.filter(u => u.status === 'reserved').length,
    sold:      safeData.filter(u => u.status === 'sold').length,
  }
  const totalValue = safeData.filter(u => u.status !== 'sold').reduce((s, u) => s + Number(u.price ?? 0), 0)

  // تجميع حسب المشروع للعرض الخرائطي
  const projectGroups = Array.from(
    filtered.reduce((map, u) => {
      const key = u.project_name || 'غير محدد'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(u)
      return map
    }, new Map<string, Unit[]>())
  )

  if (safeData.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-slate-400">
        <Building size={40} className="mx-auto mb-3 opacity-30" />
        <p className="font-semibold">لا توجد وحدات عقارية حالياً</p>
        <p className="text-sm mt-1">قم بإضافة أول وحدة للمخزون</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'متاحة للبيع', value: counts.available, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'محجوزة', value: counts.reserved, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
          { label: 'مباعة', value: counts.sold, color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
          { label: 'القيمة المتاحة', value: `${(totalValue / 1_000_000).toFixed(1)}M ج.م`, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border rounded-xl p-4`}>
            <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="بحث بالمشروع أو الوحدة أو المطور..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pr-8 pl-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-1">
          {STATUS_TABS.map(t => (
            <button key={t.key} onClick={() => setStatusTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                statusTab === t.key ? t.color + ' ring-2 ring-offset-1 ring-current' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
              }`}>
              {t.label}
              {t.key !== 'all' && (
                <span className="mr-1 opacity-60">
                  ({counts[t.key as keyof typeof counts] ?? 0})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex gap-1 border border-slate-200 rounded-lg p-0.5">
          <button onClick={() => setView('grid')}
            className={`p-1.5 rounded-md transition-colors ${view === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-700'}`}>
            <LayoutGrid size={15} />
          </button>
          <button onClick={() => setView('map')}
            className={`p-1.5 rounded-md transition-colors ${view === 'map' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-700'}`}>
            <LayoutList size={15} />
          </button>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-xl p-10 text-center text-slate-400 border border-slate-200">
          لا توجد وحدات تطابق معايير البحث
        </div>
      )}

      {/* Grid View */}
      {view === 'grid' && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(unit => {
            const style = STATUS_STYLE[unit.status] ?? STATUS_STYLE.available
            return (
              <div key={unit.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-slate-900 text-sm leading-tight">{unit.unit_name || 'وحدة غير مسماة'}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 ${style.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                    {style.label}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-slate-400 flex-shrink-0" />
                    <span className="truncate">{unit.project_name || 'مشروع غير محدد'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Building size={12} className="text-slate-400 flex-shrink-0" />
                    <span>{unit.unit_type || 'غير محدد'}</span>
                    {unit.area && <span className="text-slate-400">• {unit.area} م²</span>}
                    {unit.floor && <span className="text-slate-400">• دور {unit.floor}</span>}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-emerald-700 font-black text-sm">
                  <Tag size={13} />
                  {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(unit.price ?? 0)}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Map/Heatmap View — grouped by project */}
      {view === 'map' && filtered.length > 0 && (
        <div className="space-y-6">
          {projectGroups.map(([project, units]) => (
            <div key={project} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-sm">{project}</h3>
                <div className="flex gap-3 text-xs">
                  <span className="text-emerald-600 font-bold">{units.filter(u => u.status === 'available').length} متاحة</span>
                  <span className="text-amber-600 font-bold">{units.filter(u => u.status === 'reserved').length} محجوزة</span>
                  <span className="text-red-600 font-bold">{units.filter(u => u.status === 'sold').length} مباعة</span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-2">
                  {units.map(unit => {
                    const style = STATUS_STYLE[unit.status] ?? STATUS_STYLE.available
                    return (
                      <div key={unit.id} title={`${unit.unit_name} — ${new Intl.NumberFormat('ar-EG').format(unit.price ?? 0)} ج.م`}
                        className={`relative group cursor-default rounded-lg border-2 px-3 py-2 text-xs font-bold transition-all hover:scale-105 ${style.badge}`}>
                        <div className="flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${style.dot} flex-shrink-0`} />
                          {unit.unit_name}
                        </div>
                        {/* Tooltip */}
                        <div className="absolute bottom-full right-0 mb-1.5 hidden group-hover:block bg-slate-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-10 shadow-xl">
                          {unit.unit_type} {unit.area ? `• ${unit.area}م²` : ''}<br />
                          {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(unit.price ?? 0)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
