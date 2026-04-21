import { requirePermission } from '@/shared/rbac/require-permission'
import { createServerClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Users,
  Building2,
  Star,
  Wallet,
  TrendingUp,
  Search,
  MoreVertical,
  Phone,
  Mail,
  Eye,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

type Profile = {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
  status: string | null
  account_type: string | null
}

export default async function AccountManagerWorkspacePage() {
  await requirePermission('users.read')

  const supabase = await createServerClient()

  const [{ data: userProfiles, count: totalUsers }, { data: legacyProfiles }, { count: activeAds }] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('id, full_name, role, status, account_type', { count: 'exact' })
      .not('role', 'in', '(super_admin,company_admin)')
      .order('full_name')
      .limit(20),
    supabase
      .from('profiles')
      .select('id, full_name, email, role, status, account_type')
      .not('role', 'in', '(super_admin,platform_admin,admin,company_admin,company_owner)')
      .order('full_name')
      .limit(200),
    supabase.from('ads').select('id', { count: 'exact', head: true }).eq('status', 'active'),
  ])

  const emailById = new Map((legacyProfiles ?? []).map((profile) => [profile.id, profile.email ?? null]))
  const users = (userProfiles && userProfiles.length > 0
    ? userProfiles.map((profile) => ({ ...profile, email: emailById.get(profile.id) ?? null }))
    : legacyProfiles ?? []) as Profile[]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-black text-[#0F8F83]">Account Management</p>
          <h1 className="mt-1 text-3xl font-black text-[#102033] dark:text-white">مساحة عمل مدير الحسابات</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            عرض 360° لملفات العملاء، أرصدة النقاط، والإعلانات النشطة.
          </p>
        </div>
        <Button className="bg-[#0F8F83] font-semibold text-white hover:bg-[#0B6F66]">
          <Search className="size-4" />
          بحث متقدم
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric icon={<Users />} label="إجمالي الحسابات" value={String(totalUsers ?? 0)} />
        <Metric icon={<TrendingUp />} label="إعلانات نشطة" value={String(activeAds ?? 0)} />
        <Metric icon={<Star />} label="متوسط نقاط الولاء" value="420" />
        <Metric icon={<Wallet />} label="مستحقات معلقة" value="EGP 0" />
      </div>

      {/* Client Table */}
      <div className="overflow-hidden rounded-xl border border-[#DDE6E4] bg-white shadow-sm dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-[#DDE6E4] px-5 py-4">
          <p className="font-black text-[#102033] dark:text-white">قائمة الحسابات</p>
          <Badge className="bg-[#EEF6F5] text-[#0F8F83]">{users.length} حساب</Badge>
        </div>

        {users.length === 0 ? (
          <div className="p-10 text-center">
            <Users className="mx-auto mb-3 size-10 text-slate-300" />
            <p className="font-black text-[#102033] dark:text-white">لا توجد حسابات بعد</p>
          </div>
        ) : (
          <div className="divide-y divide-[#DDE6E4]">
            {users.map((user) => (
              <AccountRow key={user.id} user={user} />
            ))}
          </div>
        )}
      </div>

      {/* Partner Tiers */}
      <div className="rounded-xl border border-[#DDE6E4] bg-white p-5 shadow-sm dark:bg-slate-900">
        <p className="mb-4 flex items-center gap-2 font-black text-[#102033] dark:text-white">
          <Building2 className="size-5 text-[#C9964A]" />
          مستويات الشركاء
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <TierCard tier="Bronze" color="text-amber-700 bg-amber-50 border-amber-200" clients={0} />
          <TierCard tier="Silver" color="text-slate-600 bg-slate-50 border-slate-300" clients={0} />
          <TierCard tier="Gold" color="text-[#C9964A] bg-[#C9964A]/10 border-[#C9964A]/30" clients={0} />
        </div>
      </div>
    </div>
  )
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#DDE6E4] bg-white p-4 shadow-sm dark:bg-slate-900">
      <div className="flex items-center gap-2 text-[#0F8F83]">{icon}</div>
      <p className="mt-2 text-3xl font-black text-[#102033] dark:text-white">{value}</p>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
    </div>
  )
}

function AccountRow({ user }: { user: Profile }) {
  const statusColors: Record<string, string> = {
    active: 'bg-[#EEF6F5] text-[#0F8F83]',
    pending: 'bg-[#C9964A]/10 text-[#C9964A]',
    suspended: 'bg-red-100 text-red-600',
  }
  const status = user.status ?? 'active'

  return (
    <div className="grid items-center gap-3 px-5 py-4 md:grid-cols-[1fr_140px_120px_160px_auto]">
      <div>
        <p className="font-black text-[#102033] dark:text-white">{user.full_name ?? 'بدون اسم'}</p>
        <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-slate-500">
          <Mail className="size-3" />
          {user.email ?? '—'}
        </p>
      </div>
      <Badge className={statusColors[status] ?? 'bg-slate-100 text-slate-500'}>
        {status}
      </Badge>
      <span className="text-xs font-semibold capitalize text-slate-500">{user.account_type ?? user.role ?? '—'}</span>
      <div className="flex items-center gap-1 text-xs font-semibold text-slate-500">
        <Star className="size-3 text-[#C9964A]" />
        0 نقطة
      </div>
      <div className="flex gap-1.5">
        <Button size="sm" variant="outline" className="h-7 border-[#DDE6E4] px-2">
          <Eye className="size-3.5" />
        </Button>
        <Button size="sm" variant="outline" className="h-7 border-[#DDE6E4] px-2">
          <Phone className="size-3.5" />
        </Button>
        <Button size="sm" variant="outline" className="h-7 border-[#DDE6E4] px-2">
          <MoreVertical className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

function TierCard({ tier, color, clients }: { tier: string; color: string; clients: number }) {
  return (
    <div className={`rounded-lg border p-4 ${color}`}>
      <p className="font-black">{tier}</p>
      <p className="mt-1 text-2xl font-black">{clients}</p>
      <p className="text-xs font-semibold opacity-70">عميل / شريك</p>
    </div>
  )
}
