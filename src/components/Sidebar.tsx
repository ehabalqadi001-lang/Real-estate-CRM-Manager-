'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { 
  LayoutDashboard, Users, Building, Briefcase, Calculator, 
  UserCheck, Settings, Banknote, LogOut, UsersRound, ShieldAlert, AlertTriangle, Loader2
} from 'lucide-react'

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
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true) // حالة التحميل لمنع الأخطاء الوهمية
  const [fetchError, setFetchError] = useState<string | null>(null) // صائد الأخطاء

  useEffect(() => {
    let isMounted = true

    const checkRole = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // استخدام getSession أسرع وأكثر أماناً في الـ Client Side
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) throw sessionError
        
        if (session?.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()

          if (profileError && profileError.code !== 'PGRST116') {
            throw profileError
          }
          
          if (isMounted) setUserRole(profile?.role || null)
        }
      } catch (error: any) {
        if (isMounted) {
          setFetchError("تعذر الاتصال بخادم الصلاحيات")
          console.error("Sidebar Auth Error:", error.message)
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    checkRole()

    return () => { isMounted = false }
  }, [])

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 flex-shrink-0 hidden lg:flex flex-col h-full border-l border-slate-800 shadow-2xl relative z-40">
       
       {/* اللوجو والبراندينج */}
       <div className="h-24 flex items-center justify-center border-b border-slate-800/80 px-4 bg-slate-900/50">
         <Link href="/dashboard" className="flex flex-col items-center hover:scale-105 transition-transform">
            <span className="text-xl font-black text-white tracking-wider">FAST INVESTMENT</span>
            <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mt-1">Enterprise CRM</span>
         </Link>
       </div>

       <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 custom-scrollbar">
          
          {/* صائد الأخطاء ومؤشر التحميل */}
          {isLoading && (
            <div className="mb-4 flex items-center gap-2 justify-center text-xs text-slate-500">
              <Loader2 size={14} className="animate-spin" /> جاري التحقق من الرتبة...
            </div>
          )}
          
          {fetchError && !isLoading && (
            <div className="mb-4 flex items-center gap-2 text-[10px] font-bold text-red-400 bg-red-400/10 p-2.5 rounded-xl border border-red-400/20">
              <AlertTriangle size={14} className="flex-shrink-0" /> 
              <span>{fetchError}</span>
            </div>
          )}

          {/* البوابة الإدارية العليا (تظهر فقط للـ Super Admin) */}
          {userRole === 'super_admin' && !isLoading && (
            <Link
              href="/admin/super-dashboard"
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 text-sm font-black bg-emerald-600 text-white shadow-lg shadow-emerald-900/50 mb-6 hover:scale-[1.02]"
            >
              <ShieldAlert size={20} className="text-white" />
              <span>لوحة تحكم المنصة العليا</span>
            </Link>
          )}

          {/* الروابط الأساسية للمشروع */}
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

       {/* تذييل القائمة الجانبية */}
       <div className="p-4 border-t border-slate-800/80 bg-slate-900/80">
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