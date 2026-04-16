'use client'

import { useState } from 'react'
import { Plus, X, Building, MapPin, Tag, Edit2, Check } from 'lucide-react'

interface Unit {
  id: string
  unit_name: string
  project_name: string
  unit_type: string
  price: number
  status: string
  area?: number
  floor?: number
}

const STATUS_OPTS = [
  { value: 'available', label: 'متاحة',  color: 'bg-emerald-100 text-emerald-700' },
  { value: 'reserved',  label: 'محجوزة', color: 'bg-amber-100 text-amber-700' },
  { value: 'sold',      label: 'مباعة',  color: 'bg-red-100 text-red-700' },
]

export default function DeveloperInventoryManager({
  units,
  developerId,
}: {
  units: Unit[]
  developerId: string
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editStatus, setEditStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [localUnits, setLocalUnits] = useState<Unit[]>(units)

  const handleAdd = async (e: { preventDefault(): void; currentTarget: HTMLFormElement }) => {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const payload = {
      unit_name:    fd.get('unit_name') as string,
      project_name: fd.get('project_name') as string,
      unit_type:    fd.get('unit_type') as string,
      price:        parseFloat(fd.get('price') as string) || 0,
      area:         parseFloat(fd.get('area') as string) || null,
      floor:        parseInt(fd.get('floor') as string)  || null,
      status:       'available',
      developer_id: developerId,
    }
    const res = await fetch('/api/developer/units', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json() as { unit?: Unit }
    if (data.unit) setLocalUnits(prev => [data.unit!, ...prev])
    setShowAdd(false)
    setLoading(false)
  }

  const handleStatusUpdate = async (unitId: string, newStatus: string) => {
    setLoading(true)
    await fetch('/api/developer/units', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: unitId, status: newStatus }),
    })
    setLocalUnits(prev => prev.map(u => u.id === unitId ? { ...u, status: newStatus } : u))
    setEditingId(null)
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-black text-slate-800 text-sm flex items-center gap-2"><Building size={16} /> وحداتك العقارية ({localUnits.length})</h2>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors">
          <Plus size={15} /> إضافة وحدة
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {localUnits.map(unit => {
          const statusCfg = STATUS_OPTS.find(s => s.value === unit.status) ?? STATUS_OPTS[0]
          return (
            <div key={unit.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-slate-900 text-sm">{unit.unit_name}</h3>
                {editingId === unit.id ? (
                  <div className="flex gap-1">
                    <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
                      className="text-xs border rounded px-1 py-0.5 bg-white">
                      {STATUS_OPTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <button onClick={() => handleStatusUpdate(unit.id, editStatus)} disabled={loading}
                      className="text-emerald-600 hover:text-emerald-800 p-0.5"><Check size={13} /></button>
                    <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600 p-0.5"><X size={13} /></button>
                  </div>
                ) : (
                  <button onClick={() => { setEditingId(unit.id); setEditStatus(unit.status) }}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${statusCfg.color}`}>
                    {statusCfg.label} <Edit2 size={9} />
                  </button>
                )}
              </div>
              <div className="space-y-1 text-xs text-slate-500">
                <div className="flex items-center gap-1.5"><MapPin size={10} /> {unit.project_name}</div>
                <div className="flex items-center gap-1.5"><Building size={10} /> {unit.unit_type}{unit.area ? ` • ${unit.area}م²` : ''}{unit.floor ? ` • دور ${unit.floor}` : ''}</div>
                <div className="flex items-center gap-1.5 text-emerald-700 font-black text-sm mt-2">
                  <Tag size={11} />
                  {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(unit.price)}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add unit modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2"><Plus size={16} /> إضافة وحدة عقارية جديدة</h3>
              <button onClick={() => setShowAdd(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-3">
              {[
                { name: 'unit_name',    label: 'اسم الوحدة',    type: 'text',   required: true },
                { name: 'project_name', label: 'المشروع',       type: 'text',   required: true },
                { name: 'unit_type',    label: 'نوع الوحدة',    type: 'text',   required: true, placeholder: 'شقة / فيلا / توين هاوس' },
                { name: 'price',        label: 'السعر (ج.م)',   type: 'number', required: true },
                { name: 'area',         label: 'المساحة (م²)',  type: 'number', required: false },
                { name: 'floor',        label: 'الدور',         type: 'number', required: false },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{f.label}</label>
                  <input type={f.type} name={f.name} required={f.required}
                    placeholder={(f as { placeholder?: string }).placeholder ?? ''}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-slate-400" />
                </div>
              ))}
              <button type="submit" disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-50">
                {loading ? 'جاري الحفظ...' : 'حفظ الوحدة'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
