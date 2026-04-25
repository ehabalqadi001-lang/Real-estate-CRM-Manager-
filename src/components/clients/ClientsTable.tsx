'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Search, ChevronLeft } from 'lucide-react'

interface Client {
  id: string
  name: string | null
  full_name?: string | null
  phone: string | null
  phone_country_code?: string | null
  nationality?: string | null
  investment_types?: string[] | null
  investment_locations?: string[] | null
  status: string | null
  created_at: string | null
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  active:    { label: 'نشط',           cls: 'bg-emerald-50 text-emerald-700' },
  follow_up: { label: 'قيد المتابعة', cls: 'bg-amber-50 text-amber-700' },
  new:       { label: 'جديد',          cls: 'bg-blue-50 text-blue-700' },
  inactive:  { label: 'غير نشط',      cls: 'bg-slate-100 text-slate-500' },
  converted: { label: 'تم التحويل',   cls: 'bg-purple-50 text-purple-700' },
  lost:      { label: 'مفقود',         cls: 'bg-red-50 text-red-600' },
}

export default function ClientsTable({ initialData }: { initialData: Client[] }) {
  const [search, setSearch] = useState('')
  const safe = useMemo(() => Array.isArray(initialData) ? initialData : [], [initialData])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return safe
    return safe.filter((c) => {
      const name = (c.name || c.full_name || '').toLowerCase()
      const phone = (c.phone || '').toLowerCase()
      const nat = (c.nationality || '').toLowerCase()
      return name.includes(q) || phone.includes(q) || nat.includes(q)
    })
  }, [safe, search])

  if (safe.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-3 text-4xl">👤</div>
        <p className="text-sm font-bold text-[var(--fi-muted)]">لا توجد بيانات عملاء حالياً.</p>
        <p className="mt-1 text-xs text-[var(--fi-muted)]/70">أضف أول عميل باستخدام زر &quot;إضافة عميل&quot;</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Search bar */}
      <div className="border-b border-[var(--fi-line)] p-4">
        <div className="relative max-w-sm">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[var(--fi-muted)]" aria-hidden />
          <input
            type="text"
            placeholder="بحث بالاسم أو الهاتف أو الجنسية..."
            className="h-10 w-full rounded-lg border border-[var(--fi-line)] bg-[var(--fi-soft)] pr-10 pl-4 text-sm text-[var(--fi-ink)] outline-none focus:border-[var(--fi-emerald)] focus:ring-2 focus:ring-[var(--fi-emerald)]/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-right text-sm">
          <thead className="bg-[var(--fi-soft)]">
            <tr>
              {['#', 'اسم العميل', 'رقم الهاتف', 'الجنسية', 'الاستثمار', 'الحالة', 'تاريخ الإضافة', ''].map((h) => (
                <th key={h} className="px-5 py-3 text-right text-xs font-black uppercase tracking-wide text-[var(--fi-muted)]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--fi-line)]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-sm font-bold text-[var(--fi-muted)]">
                  لا توجد نتائج مطابقة.
                </td>
              </tr>
            ) : filtered.map((client, i) => {
              const status = client.status ?? 'active'
              const statusInfo = STATUS_MAP[status] ?? { label: status, cls: 'bg-slate-100 text-slate-500' }
              const displayPhone = client.phone_country_code
                ? `${client.phone_country_code} ${client.phone}`
                : client.phone

              return (
                <tr key={client.id} className="group transition-colors hover:bg-[var(--fi-soft)]">
                  <td className="px-5 py-4 text-xs font-black text-[var(--fi-muted)]">
                    #{client.id.substring(0, 6).toUpperCase()}
                  </td>
                  <td className="px-5 py-4 font-black text-[var(--fi-ink)]">
                    {client.name || client.full_name || 'غير محدد'}
                  </td>
                  <td className="px-5 py-4 font-semibold text-[var(--fi-muted)]" dir="ltr">
                    {displayPhone || 'غير محدد'}
                  </td>
                  <td className="px-5 py-4 text-[var(--fi-muted)]">
                    {client.nationality || '—'}
                  </td>
                  <td className="px-5 py-4">
                    {client.investment_types?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {client.investment_types.slice(0, 2).map((t) => (
                          <span key={t} className="rounded-md bg-[var(--fi-soft)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--fi-muted)]">{t}</span>
                        ))}
                        {(client.investment_types.length > 2) && (
                          <span className="text-[10px] font-bold text-[var(--fi-muted)]">+{client.investment_types.length - 2}</span>
                        )}
                      </div>
                    ) : <span className="text-[var(--fi-muted)]">—</span>}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${statusInfo.cls}`}>
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[var(--fi-muted)]">
                    {client.created_at ? new Date(client.created_at).toLocaleDateString('ar-EG') : '—'}
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/dashboard/clients/${client.id}`}
                      className="flex items-center gap-1 rounded-lg border border-[var(--fi-line)] px-3 py-1.5 text-xs font-black text-[var(--fi-ink)] opacity-0 transition group-hover:opacity-100 hover:bg-[var(--fi-soft)]"
                    >
                      عرض
                      <ChevronLeft className="size-3.5" />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="border-t border-[var(--fi-line)] px-5 py-3 text-xs font-bold text-[var(--fi-muted)]">
        {filtered.length} من {safe.length} عميل
      </div>
    </div>
  )
}
