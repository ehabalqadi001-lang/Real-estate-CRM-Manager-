'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShieldCheck, Users, Building, Settings, LayoutDashboard, FileCheck, LogOut, ArrowRight } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // الروابط الإدارية المحدثة بالمسار الصحيح /admin/
  const ADMIN_MENU = [
    { name: 'نظرة شاملة', icon: LayoutDashboard, href: '/admin/super-dashboard' },
    { name: 'طلبات الموافقة', icon: FileCheck, href: '/admin/users/pending' },
    { name: 'إدارة الشركات', icon: Building, href: '/admin/companies' },
    { name: 'إدارة المستخدمين', icon: Users, href: '/admin/users' },
    { name: 'إعدادات المنصة', icon: Settings, href: '/admin/settings' },
  ]

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-900 font-sans" dir="rtl">
      
      {/* القائمة الجانبية الخاصة بالـ Super Admin */}
      <aside className="w-64 bg-slate-950 text-slate-300 flex-shrink-0 hidden lg:flex flex-col h-full border-l border-slate-800 shadow-2xl z-40">
        
        <div className="h-24 flex items-center justify-center border-b border-slate-800/80 px-4 bg-slate-900/50">
          <div className="flex flex-col items-center hover:scale-105 transition-transform cursor-pointer">
            <span className="text-xl font-black text-white tracking-wider flex items-center gap-2">
              <ShieldCheck className="text-emerald-500" /> ADMIN PANEL
            </span>
            <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-1">Super Admin Control</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-scrollbar">
          {ADMIN_MENU.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 text-sm font-bold relative overflow-hidden group ${
                  isActive 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                {isActive && <div className="absolute right-0 top-0 w-1 h-full bg-white rounded-l-full"></div>}
                <item.icon size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400 transition-colors'} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* قسم العودة للداشبورد العادية (User Dashboard) */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/80 space-y-2">
          <Link 
            href="/dashboard" 
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-600/10 text-blue-400 hover:text-blue-300 transition-colors text-sm font-bold border border-blue-900/30"
          >
            <ArrowRight size={18} />
            <span>العودة للـ CRM</span>
          </Link>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors text-sm font-bold">
            <LogOut size={18} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* المحتوى الرئيسي للإدارة العليا */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 transition-all duration-300 relative">
        <div className="p-6 md:p-10 max-w-7xl mx-auto pb-24">
          {children}
        </div>
      </main>
    </div>
  )
}