import Link from 'next/link'
import { ShieldCheck, Users, Building, Settings, LayoutDashboard, FileCheck } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // روابط لوحة تحكم المنصة العليا حسب التقرير الهندسي
  const ADMIN_MENU = [
    { name: 'نظرة شاملة', icon: LayoutDashboard, href: '/admin/super-dashboard' },
    { name: 'طلبات الموافقة', icon: FileCheck, href: '/admin/users/pending' },
    { name: 'إدارة الشركات', icon: Building, href: '/admin/companies' },
    { name: 'إدارة المستخدمين', icon: Users, href: '/admin/users' },
    { name: 'إعدادات المنصة', icon: Settings, href: '/admin/settings' },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 text-slate-900 font-sans" dir="rtl">
      
      {/* القائمة الجانبية الخاصة بالـ Super Admin */}
      <aside className="w-64 bg-slate-950 text-slate-300 flex-shrink-0 hidden lg:flex flex-col h-full border-l border-slate-800 shadow-2xl z-40">
        <div className="h-24 flex items-center justify-center border-b border-slate-800/80 px-4 bg-slate-900">
          <div className="flex flex-col items-center">
            <span className="text-xl font-black text-white tracking-wider flex items-center gap-2">
              <ShieldCheck className="text-emerald-500" /> ADMIN PANEL
            </span>
            <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-1">Super Admin Control</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {ADMIN_MENU.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-bold hover:bg-emerald-600 hover:text-white group"
            >
              <item.icon size={20} className="text-slate-400 group-hover:text-white transition-colors" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* المحتوى الرئيسي للإدارة العليا */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
        <div className="p-6 md:p-10 max-w-7xl mx-auto pb-24">
          {children}
        </div>
      </main>
    </div>
  )
}