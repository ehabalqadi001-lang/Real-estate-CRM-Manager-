'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, Users, Building, Briefcase, 
  Calculator, UserCheck, Settings, FileText, Banknote, LogOut, UsersRound
} from 'lucide-react'

// روابط النظام لسهولة التعديل
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
    <aside className="fixed top-0 right-0 z-[100] h-screen w-64 bg-slate-950 text-slate-300 border-l border-slate-800 hidden lg:flex flex-col shadow-2xl transition-all duration-300">
      
      {/* اللوجو */}
      <div className="h-24 flex items-center justify-center border-b border-slate-800/60 px-6">
        <Link href="/dashboard" className="flex flex-col items-center hover:scale-105 transition-transform">
          <span className="text-xl font-black text-white tracking-wider">FAST INVESTMENT</span>
          <span className="text-[10px] text-blue-500 font-bold mt-1 tracking-widest uppercase">Enterprise CRM</span>
        </Link>
      </div>

      {/* قائمة الروابط */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 custom-scrollbar">
        {MENU_ITEMS.map((item) => {
          // التأكد من أن الرابط نشط (Active) بطريقة صحيحة
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                isActive 
                  ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/20' 
                  : 'hover:bg-slate-800/50 hover:text-white font-medium'
              }`}
            >
              {/* شريط الإضاءة للرابط النشط */}
              {isActive && <div className="absolute right-0 top-0 w-1 h-full bg-white rounded-l-full"></div>}
              
              <item.icon size={20} className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400 transition-colors'}`} />
              <span className="truncate">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* الإعدادات والخروج (ثابتة بالأسفل) */}
      <div className="p-4 border-t border-slate-800/60 space-y-2 bg-slate-900/50">
        <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 hover:text-white transition-all text-sm font-medium">
          <Settings size={18} className="text-slate-400" />
          <span>إعدادات النظام</span>
        </Link>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-all text-sm font-bold">
          <LogOut size={18} />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  )
}