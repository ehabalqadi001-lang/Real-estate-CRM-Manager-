'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, UserPlus, Briefcase, 
  MapPin, BarChart3, LogOut 
} from 'lucide-react'
import NotificationBell from '@/components/notifications/NotificationBell'

// القائمة الاستراتيجية للمدير
const menuItems = [
  { name: 'لوحة تحكم الشركة', icon: LayoutDashboard, path: '/company/dashboard' },
  { name: 'إضافة وكيل جديد', icon: UserPlus, path: '/company/agents/add' },
  { name: 'إدارة العملاء', icon: Briefcase, path: '/dashboard/leads' },
  { name: 'المخزون العقاري', icon: MapPin, path: '/dashboard/properties' },
  { name: 'إحصائيات المبيعات', icon: BarChart3, path: '/company/reports' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-72 bg-[#0A1128] text-white flex flex-col h-screen fixed right-0 top-0 border-l border-slate-800/50" dir="rtl">
      
      {/* 1. الشعار (Branding) */}
      <div className="p-8 pb-6 flex flex-col items-center border-b border-slate-800/50">
        <h1 className="text-2xl font-black text-blue-500 italic tracking-wider">FAST INVESTMENT</h1>
        <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em] mt-1">ENTERPRISE CRM</p>
      </div>

      {/* 2. بطاقة هوية القيادة */}
      <div className="p-6">
        <div className="bg-[#101835] rounded-xl p-4 border border-slate-800 flex flex-col items-center text-center shadow-inner">
          <span className="text-blue-400 text-[10px] font-black mb-1">مدير شركة</span>
          <h2 className="text-md font-bold text-white">إدارة المبيعات المركزية</h2>
        </div>
      </div>

      {/* 3. أزرار التحكم (Navigation) */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(item.path + '/')
          const Icon = item.icon

          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all ${
                isActive 
                  ? 'bg-blue-600/10 text-blue-500 border border-blue-500/20 shadow-[inset_0_0_15px_rgba(37,99,235,0.1)]' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-blue-500' : 'text-slate-500'} />
              <span className="text-sm">{item.name}</span>
              {isActive && <span className="mr-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.8)]"></span>}
            </Link>
          )
        })}
      </nav>

      {/* 4. غرفة العمليات السفلية (الرادار + الخروج) */}
      <div className="p-6 border-t border-slate-800/50 flex items-center justify-between bg-[#080d1f]">
        
        {/* جهاز اللاسلكي (جرس الإشعارات) */}
        <NotificationBell />

        {/* زر تسجيل الخروج الأمني */}
        <form action="/auth/logout" method="post">
          <button type="submit" className="flex items-center gap-2 text-slate-400 hover:text-red-400 font-bold transition-colors group">
            <span className="text-sm">تسجيل الخروج</span>
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          </button>
        </form>
        
      </div>
    </aside>
  )
}