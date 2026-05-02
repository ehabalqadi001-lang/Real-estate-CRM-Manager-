'use client'

import { useState } from 'react'
import { GitCompare, X, CheckCircle, XCircle } from 'lucide-react'
import { useI18n } from '@/hooks/use-i18n'

interface Unit {
  id: string
  unit_name: string
  project_name: string
  unit_type: string
  price: number
  area?: number
  floor?: number
  finishing?: string
  status: string
  developer?: string
}

export default function CompareClient({ units }: { units: Unit[] }) {
  const { t, numLocale } = useI18n()
  const [selected, setSelected] = useState<Unit[]>([])
  const [search, setSearch] = useState('')

  const ROWS: { label: string; key: keyof Unit; format?: (v: unknown) => string }[] = [
    { label: t('المشروع', 'Project'), key: 'project_name' },
    { label: t('نوع الوحدة', 'Unit Type'), key: 'unit_type' },
    { label: t('المطور', 'Developer'), key: 'developer' },
    { label: t('السعر', 'Price'), key: 'price', format: (v) => `${Number(v).toLocaleString(numLocale)} ${t('ج.م', 'EGP')}` },
    { label: t('المساحة', 'Area'), key: 'area', format: (v) => v ? `${v} ${t('م²', 'sqm')}` : '—' },
    { label: t('الدور', 'Floor'), key: 'floor', format: (v) => v ? String(v) : '—' },
    { label: t('التشطيب', 'Finishing'), key: 'finishing', format: (v) => String(v ?? '—') },
    { label: t('الحالة', 'Status'), key: 'status' },
  ]

  const filtered = units.filter(u =>
    u.unit_name.toLowerCase().includes(search.toLowerCase()) ||
    u.project_name.toLowerCase().includes(search.toLowerCase())
  )

  const toggle = (unit: Unit) => {
    if (selected.find(s => s.id === unit.id)) {
      setSelected(selected.filter(s => s.id !== unit.id))
    } else if (selected.length < 3) {
      setSelected([...selected, unit])
    }
  }

  const isSelected = (id: string) => !!selected.find(s => s.id === id)

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <GitCompare className="text-violet-600" size={24} />
          {t('مقارنة الوحدات العقارية', 'Property Unit Comparison')}
        </h1>
        <p className="text-sm text-slate-500 mt-1">{t('اختر حتى 3 وحدات لمقارنتها جنباً إلى جنب', 'Select up to 3 units to compare side by side')}</p>
      </div>

      {/* Search + Selection indicator */}
      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder={t('ابحث عن وحدة أو مشروع...', 'Search unit or project...')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-300 bg-white"
        />
        <span className="text-sm text-slate-500 font-medium whitespace-nowrap">
          {selected.length}/3 {t('وحدات مختارة', 'units selected')}
        </span>
        {selected.length > 0 && (
          <button
            onClick={() => setSelected([])}
            className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"
          >
            <X size={14} /> {t('مسح الاختيار', 'Clear selection')}
          </button>
        )}
      </div>

      {/* Unit picker */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map(unit => (
          <button
            key={unit.id}
            onClick={() => toggle(unit)}
            disabled={!isSelected(unit.id) && selected.length >= 3}
            className={`p-4 rounded-xl border-2 text-right transition-all ${
              isSelected(unit.id)
                ? 'border-violet-500 bg-violet-50'
                : 'border-slate-200 bg-white hover:border-violet-300'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <div className="font-bold text-slate-800 text-sm truncate">{unit.unit_name}</div>
            <div className="text-xs text-slate-500 mt-0.5 truncate">{unit.project_name}</div>
            <div className="text-sm font-black text-violet-700 mt-2">
              {unit.price.toLocaleString(numLocale)} {t('ج.م', 'EGP')}
            </div>
            {isSelected(unit.id) && (
              <div className="mt-2 text-xs text-violet-600 font-bold flex items-center gap-1">
                <CheckCircle size={12} /> {t('مختار', 'Selected')}
              </div>
            )}
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400">{t('لا توجد وحدات متاحة', 'No units available')}</div>
        )}
      </div>

      {/* Comparison table */}
      {selected.length >= 2 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
          <div className="p-5 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">{t('جدول المقارنة', 'Comparison Table')}</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-right p-4 font-semibold text-slate-600 w-32">{t('الخاصية', 'Property')}</th>
                {selected.map(u => (
                  <th key={u.id} className="text-right p-4 font-semibold text-slate-800">
                    <div>{u.unit_name}</div>
                    <div className="text-xs text-violet-600 font-normal">{u.project_name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(row => {
                const values = selected.map(u => row.format ? row.format(u[row.key]) : String(u[row.key] ?? '—'))
                const isPrice = row.key === 'price'
                const minPrice = isPrice ? Math.min(...selected.map(u => u.price)) : null

                return (
                  <tr key={row.key} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-4 text-slate-500 font-medium">{row.label}</td>
                    {selected.map((u, i) => {
                      const isBest = isPrice && u.price === minPrice
                      return (
                        <td key={u.id} className={`p-4 font-semibold ${isBest ? 'text-emerald-700' : 'text-slate-800'}`}>
                          <div className="flex items-center gap-1">
                            {isBest && <CheckCircle size={13} className="text-emerald-500" />}
                            {values[i]}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
              {/* Price per sqm */}
              <tr className="border-t-2 border-violet-100 bg-violet-50">
                <td className="p-4 text-violet-700 font-bold">{t('سعر المتر', 'Price/sqm')}</td>
                {selected.map(u => {
                  const ppm = u.area && u.area > 0 ? Math.round(u.price / u.area) : null
                  const allPPM = selected.map(s => s.area && s.area > 0 ? s.price / s.area : Infinity)
                  const minPPM = Math.min(...allPPM)
                  const isBest = ppm !== null && u.price / (u.area ?? 1) === minPPM
                  return (
                    <td key={u.id} className={`p-4 font-bold ${isBest ? 'text-emerald-700' : 'text-violet-800'}`}>
                      <div className="flex items-center gap-1">
                        {isBest && <CheckCircle size={13} className="text-emerald-500" />}
                        {ppm ? `${ppm.toLocaleString(numLocale)} ${t('ج.م/م²', 'EGP/sqm')}` : '—'}
                      </div>
                    </td>
                  )
                })}
              </tr>
              {/* Winner row */}
              <tr className="border-t border-slate-100 bg-slate-50">
                <td className="p-4 text-slate-600 font-bold">{t('التوصية', 'Recommendation')}</td>
                {selected.map((u) => {
                  const prices = selected.map(s => s.price)
                  const isWinner = u.price === Math.min(...prices)
                  return (
                    <td key={u.id} className="p-4">
                      {isWinner ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-bold">
                          <CheckCircle size={12} /> {t('الأفضل سعراً', 'Best Price')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400 text-xs">
                          <XCircle size={12} /> —
                        </span>
                      )}
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
