'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Calculator, 
  TrendingUp, 
  Settings, 
  UserCheck, 
  Building2, 
  MessageSquare, 
  FileText, 
  Users2,
  PieChart,
  LogOut
} from 'lucide-react'

const navigation = [
  { name: 'لوحة التحكم', href: '/dashboard', icon: LayoutDashboard },
  { name: 'العملاء', href: '/dashboard/clients', icon: Users },
  { name: 'الصفقات', href: '/dashboard/deals', icon: Briefcase },
  { name: 'المخزون العقاري', href: '/dashboard/inventory', icon: Building2 },
  { name: 'العملاء المحتملين (Leads)', href: '/dashboard/leads', icon: UserCheck },
  { name: 'العمولات', href: '/dashboard/commissions', icon: TrendingUp },
  { name: 'فريق العمل', href: '/dashboard/team', icon: Users2 },
  { name: 'المطورين', href: '/dashboard/developers', icon: Building2 },
  { name: 'التقارير', href: '/dashboard/reports', icon: PieChart },
  { name: 'حاسبة التمويل', href: '/dashboard/calculator', icon: Calculator },
  { name: 'واتساب مانيجر', href: '/dashboard/whatsapp', icon: MessageSquare },
  { name: 'الإعدادات', href: '/dashboard/settings', icon: Settings },
]

const adminNavigation = [
  { name: 'إدارة الوكلاء', href: '/admin/agents', icon: UserCheck },
  { name: 'الفروع', href: '/admin/branches', icon: Building2 },
  { name: 'إعدادات النظام', href: '/admin/settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <div className="flex flex-col h-screen w-64 bg-slate-900 text-white fixed right-0 top-0 border-l border-slate-800">
      {/* Logo Section */}
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold bg-gradient-to-l from-blue-400 to-white bg-clip-text text-transparent">
          FAST INVESTMENT
        </h1>
        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">Enterprise CRM</p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
        <div className="pb-4">
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase mb-2">القائمة الرئيسية</p>
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
                isActive(item.href) 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} className={isActive(item.href) ? 'text-white' : 'group-hover:text-blue-400'} />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          ))}
        </div>

        {/* Admin Section */}
        <div className="pt-4 border-t border-slate-800">
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase mb-2">إدارة المؤسسة</p>
          {adminNavigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
                isActive(item.href) 
                ? 'bg-slate-700 text-white' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={18} />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-slate-800">
        <button className="flex items-center gap-3 w-full px-3 py-2 text-slate-400 hover:bg-red-900/20 hover:text-red-400 rounded-lg transition-colors">
          <LogOut size={20} />
          <span className="text-sm font-medium">تسجيل الخروج</span>
        </button>
      </div>
    </div>
  )
}