import Link from 'next/link'
import { BarChart3, Building2, CircleDollarSign, Code2, Headphones, LayoutDashboard, Megaphone, ShieldCheck, Users } from 'lucide-react'
import { requirePermission } from '@/shared/rbac/require-permission'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePermission('admin.view')

  return (
    <div className="min-h-screen bg-[var(--fi-soft)]" dir="rtl">
      <aside className="fixed inset-y-0 right-0 z-40 hidden w-72 border-l border-white/10 bg-[#050816] text-white lg:flex lg:flex-col">
        <div className="border-b border-white/10 p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--fi-emerald)]">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="text-xs font-black text-[var(--fi-emerald)]">FAST INVESTMENT</p>
              <h1 className="font-black">لوحة مالك المنصة</h1>
            </div>
          </div>
          <p className="mt-4 text-xs text-white/55">{session.profile.email}</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {adminLinks.map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-white/75 transition hover:bg-white/10 hover:text-white">
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="lg:pr-72">
        <header className="sticky top-0 z-30 border-b border-[var(--fi-line)] bg-[var(--fi-paper)]/90 px-4 py-3 backdrop-blur lg:px-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black text-[var(--fi-muted)]">Super Admin OS</p>
              <p className="font-black text-[var(--fi-ink)]">تحكم مركزي في الشركات، الوكلاء، الإيرادات والدعم</p>
            </div>
            <Link href="/dashboard" className="rounded-lg border border-[var(--fi-line)] px-3 py-2 text-sm font-bold text-[var(--fi-ink)]">
              لوحة CRM
            </Link>
          </div>
        </header>
        {children}
      </div>
    </div>
  )
}

const adminLinks = [
  { href: '/admin', label: 'نظرة عامة', icon: LayoutDashboard },
  { href: '/admin/companies', label: 'الشركات', icon: Building2 },
  { href: '/admin/users', label: 'المستخدمون', icon: Users },
  { href: '/admin/developers', label: 'المطورون', icon: Code2 },
  { href: '/admin/financials', label: 'الماليات', icon: CircleDollarSign },
  { href: '/admin/content', label: 'المحتوى والإعلانات', icon: Megaphone },
  { href: '/admin/support', label: 'الدعم الفني', icon: Headphones },
  { href: '/admin/super-dashboard', label: 'SaaS Tenants', icon: BarChart3 },
]
