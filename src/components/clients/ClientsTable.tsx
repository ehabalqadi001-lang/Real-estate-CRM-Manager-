'use client'

import { useState } from 'react'

interface Client {
  id: string
  name: string | null
  phone: string | null
  status: string | null
  created_at: string
}

export default function ClientsTable({ initialData }: { initialData: Client[] }) {
  const [searchTerm, setSearchTerm] = useState('')

  // حماية الكود من الـ null (Fallback to empty string)
  const safeData = Array.isArray(initialData) ? initialData : []

  const filteredClients = safeData.filter(client => {
    const safeName = client?.name || ''
    const safePhone = client?.phone || ''
    return safeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
           safePhone.includes(searchTerm)
  })

  if (safeData.length === 0) {
    return (
      <div className="p-10 text-center text-slate-500 font-medium">
        لا توجد بيانات عملاء حالياً. أضف أول عميل الآن!
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="p-4 border-b border-slate-100">
        <input
          type="text"
          placeholder="بحث عن عميل بالاسم أو الهاتف..."
          className="w-full max-w-sm px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="px-6 py-3 font-medium">الاسم</th>
              <th className="px-6 py-3 font-medium">الهاتف</th>
              <th className="px-6 py-3 font-medium">الحالة</th>
              <th className="px-6 py-3 font-medium">تاريخ الإضافة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredClients.map((client) => (
              <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm font-semibold text-slate-900">{client.name || 'غير محدد'}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{client.phone || 'غير محدد'}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                    client.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {client.status === 'active' ? 'نشط' : 'قيد المتابعة'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {new Date(client.created_at).toLocaleDateString('ar-EG')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}