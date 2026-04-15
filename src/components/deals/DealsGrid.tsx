'use client'

import { useState } from 'react'
import { Calendar, DollarSign, User } from 'lucide-react'

interface Deal {
  id: string
  title: string
  value: number
  status: string
  created_at: string
  clients?: { name: string } // البيانات القادمة من الربط
}

export default function DealsGrid({ initialDeals }: { initialDeals: Deal[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const safeDeals = Array.isArray(initialDeals) ? initialDeals : []

  const filteredDeals = safeDeals.filter(deal => 
    (deal.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (deal.clients?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (safeDeals.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-500">
        لا توجد صفقات حالياً. ابدأ بإنشاء أول صفقة بيع!
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* شريط البحث */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <input
          type="text"
          placeholder="ابحث باسم الصفقة أو اسم العميل..."
          className="w-full max-w-md px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* شبكة البطاقات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDeals.map((deal) => (
          <div key={deal.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-slate-900 truncate pr-2">{deal.title || 'صفقة بدون عنوان'}</h3>
              <span className={`px-2 py-1 rounded-md text-[10px] font-bold whitespace-nowrap ${
                deal.status === 'won' ? 'bg-green-100 text-green-700' :
                deal.status === 'lost' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {deal.status === 'won' ? 'مكتملة' : deal.status === 'lost' ? 'ملغاة' : 'قيد التفاوض'}
              </span>
            </div>
            
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <User size={16} className="text-slate-400" />
                <span>{deal.clients?.name || 'عميل غير محدد'}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-green-600" />
                <span className="font-bold text-slate-800">
                  {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(deal.value || 0)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 pt-3 border-t border-slate-50">
                <Calendar size={14} />
                <span>{new Date(deal.created_at).toLocaleDateString('ar-EG')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}