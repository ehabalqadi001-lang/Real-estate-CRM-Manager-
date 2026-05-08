'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Search, ChevronLeft } from 'lucide-react'
import { useI18n } from '@/hooks/use-i18n'

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

export default function ClientsTable({ initialData }: { initialData: Client[] }) {
  const { t, numLocale } = useI18n()
  const [search, setSearch] = useState('')

  const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    active:    { label: t('نشط', 'Active'),             cls: 'bg-emerald-50 text-emerald-700' },
    follow_up: { label: t('قيد المتابعة', 'Follow-up'), cls: 'bg-amber-50 text-amber-700' },
    new:       { label: t('جديد', 'New'),               cls: 'bg-blue-50 text-blue-700' },
    inactive:  { label: t('غير نشط', 'Inactive'),       cls: 'bg-slate-100 text-slate-500' },
    converted: { label: t('تم التحويل', 'Converted'),   cls: 'bg-purple-50 text-purple-700' },
    lost:      { label: t('مفقود', 'Lost'),             cls: 'bg-red-50 text-red-600' },
  }

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
        <p className="text-sm font-bold text-[var(--fi-muted)]">{t('لا توجد بيانات عملاء حالياً.', 'No client data yet.')}</p>
        <p className="mt-1 text-xs text-[var(--fi-muted)]/70">{t('أضف أول عميل باستخدام زر "إضافة عميل"', 'Add the first client using the "Add Client" button')}</p>
      </div>
    )
  }

  const headers = ['#', t('اسم العميل', 'Client Name'), t('رقم الهاتف', 'Phone'), t('الجنسية', 'Nationality'), t('الاستثمار', 'Investment'), t('الحالة', 'Status'), t('تاريخ الإضافة', 'Date Added'), '']

  return (
    <div className="w-full">
      <div className="border-b border-[var(--fi-line)] p-4">
        <div className="relative max-w-sm">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[var(--fi-muted)]" aria-hidden />
          <input
            type="text"
            placeholder={t('بحث بالاسم أو الهاتف أو الجنسية...', 'Search by name, phone, or nationality...')}
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
              {headers.map((h) => (
                <th key={h} className="px-5 py-3 text-right text-xs font-black uppercase tracking-wide text-[var(--fi-muted)]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--fi-line)]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-sm font-bold text-[var(--fi-muted)]">
                  {t('لا توجد نتائج مطابقة.', 'No matching results.')}
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
                    {client.name || client.full_name || t('غير محدد', 'Unspecified')}
                  </td>
                  <td className="px-5 py-4 font-semibold text-[var(--fi-muted)]" dir="ltr">
                    {displayPhone || t('غير محدد', 'Unspecified')}
                  </td>
                  <td className="px-5 py-4 text-[var(--fi-muted)]">
                    {client.nationality || '—'}
                  </td>
                  <td className="px-5 py-4">
                    {client.investment_types?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {client.investment_types.slice(0, 2).map((tag) => (
                          <span key={tag} className="rounded-md bg-[var(--fi-soft)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--fi-muted)]">{tag}</span>
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
                    {client.created_at ? new Date(client.created_at).toLocaleDateString(numLocale) : '—'}
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/dashboard/clients/${client.id}`}
                      className="flex items-center gap-1 rounded-lg border border-[var(--fi-line)] px-3 py-1.5 text-xs font-black text-[var(--fi-ink)] opacity-0 transition group-hover:opacity-100 hover:bg-[var(--fi-soft)]"
                    >
                      {t('عرض', 'View')}
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
        {filtered.length} {t('من', 'of')} {safe.length} {t('عميل', 'clients')}
      </div>
    </div>
  )
}
