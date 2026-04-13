'use client'

import { useState } from 'react'
import { Building, MapPin, Tag } from 'lucide-react'

interface Unit {
  id: string
  unit_name: string
  project_name: string
  unit_type: string
  price: number
  status: string
}

export default function InventoryGrid({ initialData }: { initialData: Unit[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const safeData = Array.isArray(initialData) ? initialData : []

  const filteredUnits = safeData.filter(unit => 
    (unit.unit_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (unit.project_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (safeData.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-500">
        لا توجد وحدات عقارية حالياً. قم بإضافة أول وحدة للمخزون!
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <input
          type="text"
          placeholder="ابحث باسم المشروع أو الوحدة..."
          className="w-full max-w-md px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUnits.map((unit) => (
          <div key={unit.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-slate-900">{unit.unit_name || 'وحدة غير مسماة'}</h3>
              <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                unit.status === 'available' ? 'bg-green-100 text-green-700' :
                unit.status === 'sold' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {unit.status === 'available' ? 'متاحة' : unit.status === 'sold' ? 'مباعة' : 'محجوزة'}
              </span>
            </div>
            
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-slate-400" />
                <span>{unit.project_name || 'مشروع غير محدد'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building size={16} className="text-slate-400" />
                <span>{unit.unit_type || 'نوع غير محدد'}</span>
              </div>
              <div className="flex items-center gap-2 text-green-700 font-bold pt-2">
                <Tag size={16} />
                <span>{new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(unit.price || 0)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}