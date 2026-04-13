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
    // استخدام flex-shrink-0 يمنع ضغط الـ Sidebar، و w-64 يثبت عرضه
    <aside className="w-64 bg-slate-900 text-slate-300 flex-shrink-0 hidden md:flex flex-col h-full border-l border-slate-800 shadow-2xl z-50">
       
       {/* اللوجو */}
       <div className="h-24 flex items-center justify-center border-b border-slate-800/80 px-4">
         <Link href="/dashboard" className="text-center hover:scale-105 transition-transform">
            <h2 className="text-xl font-black text-white tracking-wider">FAST INVESTMENT</h2>
            <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mt-1">Enterprise CRM</p>
         </Link>
       </div>

       {/* الروابط (مع سكرول داخلي مخفي لو زادت الروابط) */}
       <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 custom-scrollbar">
          {MENU_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 text-sm font-medium ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon size={20} className={isActive ? 'text-white' : 'text-slate-400'} />
                <span className="truncate">{item.name}</span>
              </Link>
            )
          })}
       </nav>

       {/* الإعدادات وتسجيل الخروج */}
       <div className="p-4 border-t border-slate-800/80 bg-slate-900/50">
          <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 text-sm font-medium transition-colors mb-2">
            <Settings size={18} className="text-slate-400" />
            <span>إعدادات النظام</span>
          </Link>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-400 transition-colors text-sm font-bold">
            <LogOut size={18} />
            <span>تسجيل الخروج</span>
          </button>
       </div>
    </aside>
  )
}