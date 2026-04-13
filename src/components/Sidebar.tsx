'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Building, Briefcase, Calculator, UserCheck, Settings, Banknote, LogOut, UsersRound } from 'lucide-react'

const MENU_ITEMS = [
  { name: 'لوحة التحكم', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'العملاء', icon: Users, href: '/dashboard/clients' },
  { name: 'المخزون العقاري', icon: Building, href: '/dashboard/inventory' },
  { name: 'العملاء المحتملين (Leads)', icon: UsersRound, href: '/dashboard/leads' },
  { name: 'الصفقات', icon: Briefcase, href: '/dashboard/deals' },
  { name: 'العمولات', icon: Banknote, href: '/dashboard/commissions' },
  { name: 'فريق العمل', icon: UserCheck, href: '/dashboard/team' },
  { name: 'حاسبة التمويل', icon: Calculator, href: '/dashboard/calculator' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    // w-64 تحدد العرض، flex-shrink-0 تمنع الانضغاط، h-full تأخذ الطول بالكامل
    <aside className="w-64 bg-slate-950 text-slate-300 flex-shrink-0 hidden lg:flex flex-col h-full border-l border-slate-800 shadow-2xl relative z-40">
       
       {/* اللوجو */}
       <div className="h-24 flex items-center justify-center border-b border-slate-800/80 px-4">
         <Link href="/dashboard" className="flex flex-col items-center hover:scale-105 transition-transform">
            <span className="text-xl font-black text-white tracking-wider">FAST INVESTMENT</span>
            <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mt-1">Enterprise CRM</span>
         </Link>
       </div>

       {/* الروابط (مع سكرول داخلي مخفي لو زادت الروابط مستقبلاً) */}
       <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 custom-scrollbar">
          {MENU_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 text-sm font-medium relative overflow-hidden group ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/20'
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                {isActive && <div className="absolute right-0 top-0 w-1 h-full bg-white rounded-l-full"></div>}
                <item.icon size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'} />
                <span className="truncate">{item.name}</span>
              </Link>
            )
          })}
       </nav>

       {/* الإعدادات وتسجيل الخروج (ثابتة في الأسفل) */}
       <div className="p-4 border-t border-slate-800/80 bg-slate-900/50">
          <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 text-sm font-medium transition-colors mb-2 text-slate-400 hover:text-white">
            <Settings size={18} />
            <span>إعدادات النظام</span>
          </Link>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors text-sm font-bold">
            <LogOut size={18} />
            <span>تسجيل الخروج</span>
          </button>
       </div>
    </aside>
  )
}