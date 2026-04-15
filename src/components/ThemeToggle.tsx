'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  // منع مشاكل التوافق بين السيرفر والعميل (Hydration Mismatch)
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors w-full justify-between">
      <button
        onClick={() => setTheme('light')}
        className={`p-2 rounded-lg flex-1 flex justify-center transition-all ${
          theme === 'light' ? 'bg-white text-gold shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
        title="الوضع المضيء"
      >
        <Sun size={16} />
      </button>
      
      <button
        onClick={() => setTheme('system')}
        className={`p-2 rounded-lg flex-1 flex justify-center transition-all ${
          theme === 'system' ? 'bg-white dark:bg-navy text-teal shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
        title="وضع النظام التلقائي"
      >
        <Monitor size={16} />
      </button>

      <button
        onClick={() => setTheme('dark')}
        className={`p-2 rounded-lg flex-1 flex justify-center transition-all ${
          theme === 'dark' ? 'bg-navy-dark text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
        title="الوضع المظلم"
      >
        <Moon size={16} />
      </button>
    </div>
  )
}