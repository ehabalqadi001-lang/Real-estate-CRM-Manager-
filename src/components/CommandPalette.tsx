'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { BarChart3, Building2, Calendar, MapPin, Search, Target, Users } from 'lucide-react'

const commands = [
  { name: 'اللوحة التنفيذية', path: '/dashboard', icon: BarChart3 },
  { name: 'اعتماد الإعلانات', path: '/admin/ad-approvals', icon: Building2 },
  { name: 'مسار المبيعات', path: '/dashboard/deals/kanban', icon: Target },
  { name: 'العملاء المحتملون', path: '/dashboard/leads', icon: Users },
  { name: 'المخزون العقاري', path: '/dashboard/inventory/units', icon: MapPin },
  { name: 'مهام اليوم', path: '/dashboard/activities', icon: Calendar },
]

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setIsOpen((open) => !open)
      }
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const filteredCommands = commands.filter((cmd) => cmd.name.toLowerCase().includes(searchQuery.toLowerCase()))

  function handleSelect(path: string) {
    setIsOpen(false)
    setSearchQuery('')
    router.push(path)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-900/28 px-4 pt-[12vh] backdrop-blur-sm"
          dir="rtl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button className="absolute inset-0" aria-label="إغلاق" onClick={() => setIsOpen(false)} />
          <motion.div
            className="relative w-full max-w-2xl overflow-hidden rounded-lg border border-[var(--fi-line)] bg-white shadow-2xl"
            initial={{ y: 18, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 12, scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center border-b border-[var(--fi-line)] px-4 py-4">
              <Search className="ml-3 size-6 text-[var(--fi-emerald)]" />
              <input
                type="text"
                className="flex-1 bg-transparent text-base font-bold text-[var(--fi-ink)] placeholder:text-[var(--fi-muted)] focus:outline-none sm:text-lg"
                placeholder="ابحث عن مسار، عميل، وحدة، أو أمر..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                autoFocus
              />
              <span className="rounded-md border border-[var(--fi-line)] bg-[var(--fi-soft)] px-2 py-1 text-xs font-bold text-[var(--fi-muted)]">ESC</span>
            </div>

            <div className="max-h-96 overflow-y-auto p-2">
              {filteredCommands.length > 0 ? (
                <div className="space-y-1">
                  <p className="px-4 py-2 text-xs font-black text-[var(--fi-muted)]">اقتراحات سريعة</p>
                  {filteredCommands.map((cmd) => {
                    const Icon = cmd.icon
                    return (
                      <button
                        key={cmd.path}
                        onClick={() => handleSelect(cmd.path)}
                        className="flex min-h-11 w-full items-center gap-3 rounded-lg px-4 py-3 text-right text-sm font-bold text-[var(--fi-muted)] transition hover:bg-[var(--fi-soft)] hover:text-[var(--fi-ink)]"
                      >
                        <Icon className="size-4 text-[var(--fi-emerald)]" />
                        <span>{cmd.name}</span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="px-4 py-10 text-center text-sm font-bold text-[var(--fi-muted)]">
                  لا توجد نتائج مطابقة.
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
