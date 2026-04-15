'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, UserPlus, Briefcase, 
  MapPin, BarChart3, LogOut, ShieldCheck, 
  UserCircle, Target, Wallet, Calendar, CheckSquare 
} from 'lucide-react'
import NotificationBell from '@/components/notifications/NotificationBell'
import { createBrowserClient } from '@supabase/ssr' // <-- هذا هو السطر الذي كان مفقوداً وأحدث الخلل!

// 1. القائمة الاستراتيجية للقيادة (المدير)
const adminMenu = [
  { name: 'لوحة تحكم الشركة', icon: LayoutDashboard, path: '/company/dashboard' },
  { name: 'إحصائيات المبيعات', icon: BarChart3, path: '/company/reports' },
  { name: 'الرقابة المالية', icon: Wallet, path: '/company/financials' },
  { name: 'إضافة وكيل جديد', icon: UserPlus, path: '/company/agents/add' },
  { name: 'إدارة العملاء', icon: Briefcase, path: '/dashboard/leads' },
  { name: 'مهامي اليومية', icon: Calendar, path: '/dashboard/activities' },
  { name: 'المخزون العقاري', icon: MapPin, path: '/dashboard/properties' },
]

// 2. القائمة التكتيكية (لوكيل المبيعات)
const agentMenu = [
  { name: 'مساحة العمل', icon: Target, path: '/dashboard/agent' },
  { name: 'مهامي اليومية', icon: Calendar, path: '/dashboard/activities' },
  { name: 'مسار المبيعات', icon: Briefcase, path: '/dashboard/leads' },
  { name: 'إدارة الصفقات', icon: CheckSquare, path: '/dashboard/deals' },
  { name: 'المخزون العقاري', icon: MapPin, path: '/dashboard/properties' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const fetchRole = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        setUserRole(data?.role || 'agent')
      }
    }
    fetchRole()
  }, [])

  const isLeader = userRole === 'company_admin' || userRole === 'admin'
  const activeMenu = isLeader ? adminMenu : agentMenu

  return (
    <aside className="w-72 bg-[#0A1128] text-white flex flex-col h-screen fixed right-0 top-0 border-l border-slate-800/50 shadow-2xl z-50" dir="rtl">
      
      {/* منطقة السيادة العلوية */}
      <div className="p-6 pb-6 flex flex-col border-b border-slate-800/50">
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-blue-500 italic leading-none">FAST</h1>
            <h1 className="text-xl font-black text-white italic leading-none">INVESTMENT</h1>
          </div>
          <div className="bg-slate-900/50 p-0.5 rounded-xl border border-slate-800/50 shadow-inner">
             <NotificationBell />
          </div>
        </div>
        <p className="text-[9px] font-black text-slate-500 tracking-[0.3em] uppercase opacity-60">Enterprise CRM System</p>
      </div>

      {/* بطاقة الهوية الديناميكية */}
      <div className="px-6 py-6">
        <div className={`bg-gradient-to-br ${isLeader ? 'from-[#101835] to-[#0A1128] border-blue-900/20' : 'from-slate-800 to-slate-900 border-slate-700/50'} rounded-2xl p-4 border flex flex-col items-center text-center shadow-lg relative overflow-hidden group`}>
          {isLeader && <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>}
          
          <span className={`${isLeader ? 'text-blue-400' : 'text-emerald-400'} text-[10px] font-black mb-1 uppercase tracking-wider`}>
            {isLeader ? 'Management Leader' : 'Sales Agent'}
          </span>
          <h2 className="text-sm font-bold text-slate-200 uppercase flex items-center gap-1.5">
            {isLeader ? <><ShieldCheck size={16} className="text-blue-500"/> القيادة الإدارية</> : <><UserCircle size={16} className="text-emerald-500"/> وكيل مبيعات</>}
          </h2>
        </div>
      </div>

      {/* القائمة الذكية (Navigation) - بشريط تمرير مخفي */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {activeMenu.map((item) => {
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

      {/* القاعدة السفلية */}
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