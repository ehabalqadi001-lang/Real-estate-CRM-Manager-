import Link from 'next/link'
import {
  BarChart3,
  Building2,
  ChevronDown,
  CircleDollarSign,
  Code2,
  Coins,
  Headphones,
  LayoutDashboard,
  Megaphone,
  ReceiptText,
  ShieldCheck,
  Store,
  Users,
  UserCog,
  Briefcase,
} from 'lucide-react'
import { requirePermission } from '@/shared/rbac/require-permission'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePermission('admin.view')

  return (
    <div className="min-h-screen bg-[var(--fi-soft)]" dir="rtl">
      <aside className="fixed inset-y-0 right-0 z-40 hidden w-72 border-l border-white/10 bg-[#050816] text-white lg:flex lg:flex-col">
        <div className="border-b border-white/10 p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--fi-emerald)]">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-black text-[var(--fi-emerald)]">FAST INVESTMENT</p>
              <h1 className="truncate font-black">لوحة مالك المنصة</h1>
            </div>
          </div>
          <p className="mt-4 truncate text-xs text-white/55" dir="ltr">{session.profile.email}</p>
        </div>

        <nav className="flex-1 space-y-3 overflow-y-auto p-3">
          {adminGroups.map((group, index) => (
            <details key={group.title} className="group" open={index < 2}>
              <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-2 text-xs font-black text-white/45 transition hover:bg-white/5 hover:text-white">
                <span>{group.title}</span>
                <ChevronDown className="size-3.5 transition group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div className="mt-1 space-y-1">
                {group.items.map((item) => (
                  <Link key={item.href} href={item.href} className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-white/75 transition hover:bg-white/10 hover:text-white">
                    <item.icon className="size-4 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  </Link>
                ))}
              </div>
            </details>
          ))}
        </nav>
      </aside>

      <div className="lg:pr-72">
        <header className="sticky top-0 z-30 border-b border-[var(--fi-line)] bg-[var(--fi-paper)]/90 px-4 py-3 backdrop-blur lg:px-6">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-black text-[var(--fi-muted)]">Super Admin OS</p>
              <p className="truncate font-black text-[var(--fi-ink)]">تحكم مركزي في الشركات، الوكلاء، الإيرادات والدعم</p>
            </div>
            <Link href="/dashboard" className="shrink-0 rounded-lg border border-[var(--fi-line)] px-3 py-2 text-sm font-bold text-[var(--fi-ink)]">
              لوحة CRM
            </Link>
          </div>
        </header>
        <main className="min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}

const adminGroups = [
  {
    title: 'نظام عام',
    items: [
      { href: '/admin', label: 'نظرة عامة', icon: LayoutDashboard },
      { href: '/admin/companies', label: 'الشركات', icon: Building2 },
      { href: '/admin/users', label: 'المستخدمون', icon: Users },
    ],
  },
  {
    title: 'التشغيل والمحتوى',
    items: [
      { href: '/admin/developers', label: 'المطورون', icon: Code2 },
      { href: '/admin/content', label: 'المحتوى والإعلانات', icon: Megaphone },
      { href: '/admin/support', label: 'الدعم الفني', icon: Headphones },
    ],
  },
  {
    title: 'المالية والمنصة',
    items: [
      { href: '/admin/financials', label: 'الماليات', icon: CircleDollarSign },
      { href: '/admin/super-dashboard', label: 'SaaS Tenants', icon: BarChart3 },
    ],
  },
  {
    title: 'Account Managers & HR',
    items: [
      { href: '/dashboard/account-manager', label: 'لوحة Account Managers', icon: Briefcase },
      { href: '/dashboard/hr/assign-managers', label: 'تعيين AMs (HR)', icon: UserCog },
      { href: '/dashboard/partners', label: 'إدارة الشركاء', icon: Users },
    ],
  },
  {
    title: 'السوق العقاري',
    items: [
      { href: '/admin/ad-approvals', label: 'مراجعة الإعلانات', icon: Store },
      { href: '/admin/points', label: 'النقاط والمحافظ', icon: Coins },
      { href: '/admin/finance-marketplace', label: 'إيرادات المنصة', icon: ReceiptText },
    ],
  },
]
