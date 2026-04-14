'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, Users, Building2, Briefcase, 
  Settings, LogOut, ChevronRight, BarChart3, 
  MapPin, Rocket, Bell, UserPlus // أضفنا UserPlus هنا
} from 'lucide-react'

export default function Sidebar() {
  const pathname = usePathname()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, role, company_name')
          .eq('id', user.id)
          .single()
        setProfile(data)
      }
      setLoading(false)
    }
    getProfile()
  }, [])

  if (loading) return <div className="w-72 bg-[#050B18] h-full animate-pulse" />

  // 1. تعريف الروابط حسب الرتبة (تطبيق الدستور التقني)
  const menuConfig: any = {
    super_admin: [
      { name: 'لوحة التحكم العليا', icon: LayoutDashboard, path: '/admin/super-dashboard' },
      { name: 'إدارة الشركات', icon: Building2, path: '/admin/companies' },
      { name: 'تحليلات النظام', icon: BarChart3, path: '/admin/stats' },
      { name: 'إعدادات المنصة', icon: Settings, path: '/admin/settings' },
    ],
    company_admin: [
      { name: 'لوحة تحكم الشركة', icon: LayoutDashboard, path: '/company/dashboard' },
      { name: 'إضافة وكيل جديد', icon: UserPlus, path: '/company/agents/add' }, // تم تعديل المسار والاسم
      { name: 'إدارة العملاء', icon: Briefcase, path: '/dashboard/leads' },
      { name: 'المخزون العقاري', icon: MapPin, path: '/dashboard/properties' },
      { name: 'إحصائيات المبيعات', icon: BarChart3, path: '/company/reports' },
    ],
    agent: [
      { name: 'مهامي اليومية', icon: Rocket, path: '/dashboard/leads' },
      { name: 'عملاء المتابعة', icon: Users, path: '/dashboard/clients' },
      { name: 'الإشعارات', icon: Bell, path: '/dashboard/notifications' },
    ]
  }

  const currentMenu = menuConfig[profile?.role] || menuConfig['agent']

  return (
    <div className="w-72 bg-[#050B18] text-white h-screen flex flex-col border-l border-white/5 shadow-2xl transition-all duration-300" dir="rtl">
      
      {/* هيدر القائمة */}
      <div className="p-8 border-b border-white/5 text-center">
        <h1 className="text-xl font-black tracking-tighter text-blue-500 uppercase italic">
          Fast Investment
        </h1>
        <p className="text-[10px] font-bold text-slate-500 mt-1 tracking-widest">ENTERPRISE CRM</p>
      </div>

      {/* معلومات المستخدم */}
      <div className="p-6">
        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-all cursor-default">
          <p className="text-[10px] font-black text-blue-400 mb-1 uppercase tracking-widest">
            {profile?.role === 'super_admin' ? 'الإدارة العليا' : profile?.role === 'company_admin' ? 'مدير شركة' : 'وكيل معتمد'}
          </p>
          <h3 className="text-sm font-bold truncate">{profile?.company_name || profile?.full_name}</h3>
        </div>
      </div>

      {/* الروابط الديناميكية */}
      <nav className="flex-1 px-4 space-y-2">
        {currentMenu.map((item: any) => {
          const isActive = pathname === item.path
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`flex items-center justify-between p-3.5 rounded-xl transition-all group ${
                isActive 
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' 
                : 'hover:bg-white/5 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} className={isActive ? 'text-blue-500' : 'group-hover:text-white'} />
                <span className="text-sm font-bold">{item.name}</span>
              </div>
              {isActive && <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />}
            </Link>
          )
        })}
      </nav>

      {/* زر الخروج */}
      <div className="p-6 border-t border-white/5">
        <button 
          onClick={() => supabase.auth.signOut()}
          className="w-full flex items-center gap-3 p-3.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-bold text-sm"
        >
          <LogOut size={20} />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  )
}