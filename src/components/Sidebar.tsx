'use client'
import ThemeToggle from '@/components/ThemeToggle'
import LanguageToggle from '@/components/LanguageToggle'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, UserPlus, Briefcase,
  MapPin, BarChart3, LogOut, ShieldCheck,
  UserCircle, Target, Wallet, Calendar, CheckSquare, ShieldAlert, ClipboardList, TrendingUp, Users, GitCompare, Kanban,
  CalendarClock, BarChart2, Flag
} from 'lucide-react'
import NotificationBell from '@/components/notifications/NotificationBell'
import { createBrowserClient } from '@supabase/ssr'

// 1. القائمة الاستراتيجية للقيادة (المدير / القيادة العليا)
const adminMenu = [
  { name: 'القيادة العليا', icon: ShieldAlert, path: '/admin/super-dashboard' },
  { name: 'لوحة تحكم الشركة', icon: LayoutDashboard, path: '/company/dashboard' },
  { name: 'إحصائيات المبيعات', icon: BarChart3, path: '/company/reports' },
  { name: 'الرقابة المالية', icon: Wallet, path: '/company/financials' },
  { name: 'إضافة وكيل جديد', icon: UserPlus, path: '/company/agents/add' },
  { name: 'إدارة العملاء', icon: Briefcase, path: '/dashboard/leads' },
  { name: 'مهامي اليومية', icon: Calendar, path: '/dashboard/activities' },
  { name: 'المخزون العقاري', icon: MapPin, path: '/dashboard/properties' },
  { name: 'التنبؤ بالمبيعات', icon: TrendingUp, path: '/dashboard/forecasting' },
  { name: 'Kanban الصفقات', icon: Kanban, path: '/dashboard/deals/kanban' },
  { name: 'أداء الفريق', icon: Users, path: '/dashboard/performance' },
  { name: 'مقارنة الوحدات', icon: GitCompare, path: '/dashboard/compare' },
  { name: 'سجل العمليات', icon: ClipboardList, path: '/dashboard/audit' },
  { name: 'الأهداف والإنجازات', icon: Flag, path: '/dashboard/targets' },
  { name: 'جدول الأقساط', icon: CalendarClock, path: '/dashboard/schedule' },
  { name: 'التحليلات المتقدمة', icon: BarChart2, path: '/dashboard/analytics' },
]

// 2. القائمة التكتيكية (لوكيل المبيعات)
const agentMenu = [
  { name: 'مساحة العمل', icon: Target, path: '/dashboard/agent' },
  { name: 'مهامي اليومية', icon: Calendar, path: '/dashboard/activities' },
  { name: 'مسار المبيعات', icon: Briefcase, path: '/dashboard/leads' },
  { name: 'إدارة الصفقات', icon: CheckSquare, path: '/dashboard/deals' },
  { name: 'Kanban الصفقات', icon: Kanban, path: '/dashboard/deals/kanban' },
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
        // جلب الرتبة من قاعدة البيانات
        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        setUserRole(data?.role || 'agent')
      }
    }
    fetchRole()
  }, [])

  // التعرف على رتبة القيادة (شاملة القيادة العليا والمدراء)
  const isLeader = ['company_admin', 'admin', 'super_admin'].includes(userRole || '')
  const activeMenu = isLeader ? adminMenu : agentMenu

  return (
    <aside className="w-72 bg-navy-dark text-white flex flex-col h-screen fixed right-0 top-0 border-l border-white/5 shadow-2xl z-50" dir="rtl">
      
      {/* منطقة السيادة العلوية (الشعار) */}
      <div className="p-6 pb-6 flex flex-col border-b border-white/5">
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-gold italic leading-none">FAST</h1>
            <h1 className="text-xl font-black text-white italic leading-none">INVESTMENT</h1>
          </div>
          <div className="bg-navy p-0.5 rounded-xl border border-white/10 shadow-inner">
             <NotificationBell />
          </div>
        </div>
        <p className="text-[9px] font-black text-slate-400 tracking-[0.3em] uppercase opacity-60">Enterprise CRM System</p>
      </div>

      {/* بطاقة الهوية الديناميكية (Dynamic ID Badge) */}
      <div className="px-6 py-6">
        <div className={`bg-gradient-to-br ${isLeader ? 'from-navy to-navy-dark border-gold/30' : 'from-slate-800 to-slate-900 border-teal/30'} rounded-2xl p-4 border flex flex-col items-center text-center shadow-lg relative overflow-hidden group`}>
          {isLeader && <div className="absolute top-0 left-0 w-full h-1 bg-gold shadow-[0_0_10px_rgba(212,165,116,0.5)]"></div>}
          {!isLeader && <div className="absolute top-0 left-0 w-full h-1 bg-teal shadow-[0_0_10px_rgba(13,148,136,0.5)]"></div>}
          
          <span className={`${isLeader ? 'text-gold' : 'text-teal'} text-[10px] font-black mb-1 uppercase tracking-wider`}>
            {isLeader ? 'Management Leader' : 'Sales Agent'}
          </span>
          <h2 className="text-sm font-bold text-slate-200 uppercase flex items-center gap-1.5">
            {isLeader ? <><ShieldCheck size={16} className="text-gold"/> القيادة الإدارية</> : <><UserCircle size={16} className="text-teal"/> وكيل مبيعات</>}
          </h2>
        </div>
      </div>

      {/* القائمة الذكية (Navigation) - باستخدام كلاس no-scrollbar المعتمد */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto no-scrollbar">
        {activeMenu.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(item.path + '/')
          const Icon = item.icon

          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-300 group ${
                isActive 
                  ? isLeader 
                    ? 'bg-gold/10 text-gold border border-gold/20 shadow-[inset_0_0_20px_rgba(212,165,116,0.05)]' 
                    : 'bg-teal/10 text-teal border border-teal/20 shadow-[inset_0_0_20px_rgba(13,148,136,0.05)]'
                  : 'text-slate-400 hover:bg-navy hover:text-white'
              }`}
            >
              <Icon size={18} className={`${isActive ? (isLeader ? 'text-gold' : 'text-teal') : 'text-slate-500 group-hover:text-white'} transition-colors`} />
              <span className="text-sm">{item.name}</span>
              {isActive && (
                <div className="mr-auto">
                  <div className={`w-1 h-4 rounded-full ${isLeader ? 'bg-gold shadow-[0_0_10px_rgba(212,165,116,0.8)]' : 'bg-teal shadow-[0_0_10px_rgba(13,148,136,0.8)]'}`}></div>
                </div>
              )}
            </Link>
          )
        })}
      </nav>

{/* القاعدة السفلية (Theme + Logout) */}
      <div className="p-4 border-t border-white/5 bg-navy-dark space-y-4">
        {/* مفاتيح التبديل */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageToggle />
        </div>

        {/* زر إغلاق الجلسة */}
        <form action="/auth/logout" method="post">
          <button type="submit" className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-500 font-bold transition-all border border-transparent hover:border-red-500/20 group">
            <span className="text-sm">إغلاق الجلسة الأمنية</span>
            <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>  
        </aside>
  )
}