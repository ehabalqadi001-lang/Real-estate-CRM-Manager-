'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { 
  LayoutDashboard, Users, Building, Briefcase, Calculator, 
  UserCheck, Settings, Banknote, LogOut, UsersRound, ShieldAlert, AlertTriangle, Loader2 
} from 'lucide-react'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 1. دالة تسجيل الخروج (المحرك الفعلي)
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      // مسح الكاش والتوجه لصفحة الدخول
      router.refresh()
      window.location.href = '/login'
    } catch (error) {
      console.error("Logout Error:", error)
    }
  }

  useEffect(() => {
    let isMounted = true
    const checkRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()

          if (isMounted) setUserRole(profile?.role || null)
        }
      } catch (error: any) {
        if (isMounted) setFetchError("خطأ في جلب الصلاحيات")
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    checkRole()
    return () => { isMounted = false }
  }, [])

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 flex-shrink-0 hidden lg:flex flex-col h-full border-l border-slate-800 shadow-2xl relative z-40" dir="rtl">
       
       <div className="h-24 flex items-center justify-center border-b border-slate-800/80 px-4 bg-slate-900/50">
         <div className="flex flex-col items-center">
            <span className="text-xl font-black text-white tracking-wider">FAST INVESTMENT</span>
            <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mt-1">Enterprise CRM</span>
         </div>
       </div>

       <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 custom-scrollbar">
          {/* بوابة الإدارة العليا */}
          {userRole === 'super_admin' && !isLoading && (
            <Link
              href="/admin/super-dashboard"
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 text-sm font-black bg-emerald-600 text-white shadow-lg shadow-emerald-900/50 mb-6 hover:scale-[1.02]"
            >
              <ShieldAlert size={20} />
              <span>لوحة تحكم المنصة العليا</span>
            </Link>
          )}

          {/* روابط الداشبورد العادية */}
          <Link href="/dashboard" className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium ${pathname === '/dashboard' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800'}`}>
            <LayoutDashboard size={20} />
            <span>لوحة التحكم الرئيسية</span>
          </Link>
          
          <Link href="/dashboard/clients" className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium ${pathname?.startsWith('/dashboard/clients') ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}>
            <Users size={20} />
            <span>العملاء</span>
          </Link>
       </nav>

       <div className="p-4 border-t border-slate-800/80 bg-slate-900/80">
          <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 text-sm font-medium transition-colors mb-2 text-slate-400">
            <Settings size={18} />
            <span>إعدادات النظام</span>
          </Link>
          {/* زر تسجيل الخروج مع الدالة الجديدة */}
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors text-sm font-bold"
          >
            <LogOut size={18} />
            <span>تسجيل الخروج</span>
          </button>
       </div>
    </aside>
  )
}