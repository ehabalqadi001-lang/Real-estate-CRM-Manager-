'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Users, Building2, Target, Calendar, MapPin } from 'lucide-react'

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  // الاستماع للأوامر من لوحة المفاتيح (Ctrl+K أو Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen((open) => !open)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!isOpen) return null

  // قائمة المهام السريعة
  const commands = [
    { name: 'القيادة العليا', path: '/admin/super-dashboard', icon: Building2 },
    { name: 'مساحة العمل (الوكيل)', path: '/dashboard/agent', icon: Target },
    { name: 'مسار المبيعات والعملاء', path: '/dashboard/leads', icon: Users },
    { name: 'المخزون العقاري', path: '/dashboard/properties', icon: MapPin },
    { name: 'مهامي اليومية', path: '/dashboard/activities', icon: Calendar },
  ]

  // فلترة النتائج بناءً على البحث
  const filteredCommands = commands.filter(cmd => 
    cmd.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelect = (path: string) => {
    setIsOpen(false)
    setSearchQuery('')
    router.push(path)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-navy-dark/60 backdrop-blur-sm" dir="rtl">
      <div 
        className="fixed inset-0" 
        onClick={() => setIsOpen(false)}
      ></div>
      
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
        
        {/* شريط البحث المركزي */}
        <div className="flex items-center px-4 py-4 border-b border-slate-100">
          <Search size={24} className="text-slate-400 ml-3" />
          <input
            type="text"
            className="flex-1 bg-transparent text-lg text-navy-dark placeholder-slate-400 focus:outline-none font-bold"
            placeholder="ابحث عن مسار، عميل، أو أمر (Ctrl + K)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">ESC للإغلاق</span>
        </div>

        {/* قائمة النتائج السريعة */}
        <div className="max-h-96 overflow-y-auto p-2 no-scrollbar">
          {filteredCommands.length > 0 ? (
            <div className="space-y-1">
              <p className="px-4 py-2 text-xs font-bold text-slate-400 uppercase">اقتراحات سريعة</p>
              {filteredCommands.map((cmd) => {
                const Icon = cmd.icon
                return (
                  <button
                    key={cmd.path}
                    onClick={() => handleSelect(cmd.path)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-navy-dark transition-colors group text-right"
                  >
                    <Icon size={18} className="text-slate-400 group-hover:text-gold transition-colors" />
                    <span className="font-bold">{cmd.name}</span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="px-4 py-10 text-center text-slate-500 font-bold">
              لم يتم العثور على نتائج متطابقة.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}