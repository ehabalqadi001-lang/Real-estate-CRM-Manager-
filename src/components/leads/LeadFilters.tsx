'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Search, Filter } from 'lucide-react'

export default function LeadFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // التقاط القيم الحالية من الرابط
  const currentSearch = searchParams.get('query') || ''
  const currentStatus = searchParams.get('status') || ''

  const [searchTerm, setSearchTerm] = useState(currentSearch)

  // تقنية (Debounce): تأخير البحث نصف ثانية بعد توقف المستخدم عن الكتابة لتخفيف الضغط
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

  // فلترة فورية بمجرد تغيير الحالة
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
      
      {/* 1. مربع البحث الذكي */}
      <div className="relative w-full md:w-2/3">
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder="ابحث عن عميل بالاسم، أو رقم الهاتف..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 py-3 pr-11 pl-4 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
        />
      </div>

      {/* 2. فلتر الحالة */}
      <div className="relative w-full md:w-1/3 flex items-center gap-2">
        <Filter size={18} className="text-slate-400 shrink-0" />
        <select
          defaultValue={currentStatus}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="">جميع العملاء (الكل)</option>
          <option value="Fresh Leads">عملاء جدد (Fresh)</option>
          <option value="Contacted">تم التواصل (Contacted)</option>
          <option value="Meeting Scheduled">اجتماع مجدول</option>
          <option value="Negotiation">قيد التفاوض</option>
          <option value="Won">تم البيع (Won)</option>
          <option value="Lost">صفقة ضائعة (Lost)</option>
        </select>
      </div>

    </div>
  )
}