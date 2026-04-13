'use client'

import { PlusIcon } from 'lucide-react'

export default function AddUnitButton() {
  return (
    <button
      onClick={() => alert('نافذة إضافة الوحدة قيد التجهيز...')}
      className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg transition-all shadow-md"
    >
      <PlusIcon size={18} />
      <span className="text-sm font-medium">إضافة وحدة عقارية</span>
    </button>
  )
}