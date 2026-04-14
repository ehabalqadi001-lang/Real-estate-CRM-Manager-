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
    <aside className="w-72 bg-[#0A1128] text-white flex flex-col h-screen fixed right-0 top-0 border-l border-slate-800/50 shadow-2xl" dir="rtl">
      
      {/* 1. منطقة السيادة العلوية (الشعار + الرادار) */}
      <div className="p-6 pb-6 flex flex-col border-b border-slate-800/50">
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-blue-500 italic leading-none">FAST</h1>
            <h1 className="text-xl font-black text-white italic leading-none">INVESTMENT</h1>
          </div>
          
          {/* تم نقل الجرس إلى هنا (الرادار العلوي) */}
          <div className="bg-slate-900/50 p-0.5 rounded-xl border border-slate-800/50 shadow-inner">
             <NotificationBell />
          </div>
        </div>
        <p className="text-[9px] font-black text-slate-500 tracking-[0.3em] uppercase opacity-60">Enterprise CRM System</p>
      </div>

      {/* 2. بطاقة هوية الإدارة (EHAB & ESLAM TEAM) */}
      <div className="px-6 py-6">
        <div className="bg-gradient-to-br from-[#101835] to-[#0A1128] rounded-2xl p-4 border border-blue-900/20 flex flex-col items-center text-center shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>
          <span className="text-blue-400 text-[10px] font-black mb-1 uppercase tracking-wider">Management Leader</span>
          <h2 className="text-sm font-bold text-slate-200 uppercase">القيادة الإدارية</h2>
        </div>
      </div>

      {/* 3. أزرار التحكم والعمليات (Navigation) */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(item.path + '/')
          const Icon = item.icon

          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-300 group ${
                isActive 
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[inset_0_0_20px_rgba(37,99,235,0.05)]' 
                  : 'text-slate-500 hover:bg-slate-800/40 hover:text-slate-200'
              }`}
            >
              <Icon size={18} className={`${isActive ? 'text-blue-500' : 'text-slate-600 group-hover:text-blue-400'} transition-colors`} />
              <span className="text-sm">{item.name}</span>
              {isActive && (
                <div className="mr-auto">
                  <div className="w-1 h-4 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.8)]"></div>
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* 4. القاعدة السفلية (الخروج فقط) */}
      <div className="p-6 border-t border-slate-800/50 bg-[#080d1f]">
        <form action="/auth/logout" method="post">
          <button type="submit" className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-slate-500 hover:bg-red-500/10 hover:text-red-500 font-bold transition-all border border-transparent hover:border-red-500/20 group">
            <span className="text-sm">إغلاق الجلسة الأمنية</span>
            <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>
    </aside>
  )
}