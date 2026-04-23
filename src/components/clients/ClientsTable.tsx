'use client'

import { useMemo, useState } from 'react'

interface Client {
  id: string
  name: string | null
  full_name?: string | null
  phone: string | null
  status: string | null
  created_at: string | null
}

const statusLabels: Record<string, string> = {
  active: 'نشط',
  follow_up: 'قيد المتابعة',
  new: 'جديد',
  inactive: 'غير نشط',
  converted: 'تم التحويل',
  lost: 'مفقود',
}

export default function ClientsTable({ initialData }: { initialData: Client[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const safeData = useMemo(() => Array.isArray(initialData) ? initialData : [], [initialData])

  const filteredClients = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return safeData

    return safeData.filter((client) => {
      const safeName = client.name || client.full_name || ''
      const safePhone = client.phone || ''
      return safeName.toLowerCase().includes(query) || safePhone.includes(query)
    })
  }, [safeData, searchTerm])

  if (safeData.length === 0) {
    return (
      <div className="p-10 text-center text-sm font-bold text-[var(--fi-muted)]">
        لا توجد بيانات عملاء حالياً. أضف أول عميل الآن.
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="border-b border-[var(--fi-line)] p-4">
        <input
          type="text"
          placeholder="بحث عن عميل بالاسم أو الهاتف..."
          className="h-11 w-full max-w-sm rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] px-4 text-sm text-[var(--fi-ink)] outline-none focus:ring-2 focus:ring-[var(--fi-emerald)]/30"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-right">
          <thead className="bg-[var(--fi-soft)] text-xs text-[var(--fi-muted)]">
            <tr>
              <th className="px-6 py-3 font-black">الاسم</th>
              <th className="px-6 py-3 font-black">الهاتف</th>
              <th className="px-6 py-3 font-black">الحالة</th>
              <th className="px-6 py-3 font-black">تاريخ الإضافة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--fi-line)]">
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-sm font-bold text-[var(--fi-muted)]">
                  لا توجد نتائج مطابقة للبحث.
                </td>
              </tr>
            ) : filteredClients.map((client) => {
              const status = client.status ?? 'active'
              return (
                <tr key={client.id} className="transition-colors hover:bg-[var(--fi-soft)]">
                  <td className="px-6 py-4 text-sm font-black text-[var(--fi-ink)]">{client.name || client.full_name || 'غير محدد'}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-[var(--fi-muted)]" dir="ltr">{client.phone || 'غير محدد'}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                      status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {statusLabels[status] ?? status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-[var(--fi-muted)]">
                    {client.created_at ? new Date(client.created_at).toLocaleDateString('ar-EG') : 'غير محدد'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
