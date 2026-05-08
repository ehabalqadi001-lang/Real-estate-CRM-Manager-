'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Search, Filter } from 'lucide-react'
import { useI18n } from '@/hooks/use-i18n'

export default function LeadFilters() {
  const { t } = useI18n()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentSearch = searchParams.get('query') || ''
  const currentStatus = searchParams.get('status') || ''

  const [searchTerm, setSearchTerm] = useState(currentSearch)

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (searchTerm) {
        params.set('query', searchTerm)
      } else {
        params.delete('query')
      }
      router.push(`${pathname}?${params.toString()}`)
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm, pathname, router, searchParams])

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (status) {
      params.set('status', status)
    } else {
      params.delete('status')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center mb-6" dir="rtl">

      <div className="relative w-full md:w-2/3">
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder={t('ابحث عن عميل بالاسم، أو رقم الهاتف...', 'Search by name or phone number...')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 py-3 pr-11 pl-4 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
        />
      </div>

      <div className="relative w-full md:w-1/3 flex items-center gap-2">
        <Filter size={18} className="text-slate-400 shrink-0" />
        <select
          defaultValue={currentStatus}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="">{t('جميع العملاء (الكل)', 'All Clients')}</option>
          <option value="Fresh Leads">{t('عملاء جدد (Fresh)', 'Fresh Leads')}</option>
          <option value="Contacted">{t('تم التواصل (Contacted)', 'Contacted')}</option>
          <option value="Meeting Scheduled">{t('اجتماع مجدول', 'Meeting Scheduled')}</option>
          <option value="Negotiation">{t('قيد التفاوض', 'Negotiation')}</option>
          <option value="Won">{t('تم البيع (Won)', 'Won')}</option>
          <option value="Lost">{t('صفقة ضائعة (Lost)', 'Lost')}</option>
        </select>
      </div>

    </div>
  )
}
