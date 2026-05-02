import { requirePermission } from '@/shared/rbac/require-permission'
import { createServerClient } from '@/lib/supabase/server'
import { Clock, CheckCircle2, FileWarning } from 'lucide-react'
import type { ReactNode } from 'react'
import { AdSwipeQueue } from './AdSwipeQueue'
import type { AdCard } from './AdSwipeQueue'

export const dynamic = 'force-dynamic'

export default async function AdApprovalsPage() {
  await requirePermission('ads.read')

  const supabase = await createServerClient()
  const { data: pendingAds } = await supabase
    .from('ads')
    .select('id, title, price, property_type, location, city, area_sqm, bedrooms, bathrooms, images, is_urgent, is_featured, created_at, compound_name')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(100)

  const ads = (pendingAds ?? []) as AdCard[]

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-black text-[#0F8F83]">Ad Approval Team</p>
        <h1 className="mt-1 text-xl sm:text-3xl font-black text-[#102033] dark:text-white">طابور مراجعة الإعلانات</h1>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          راجع كل إعلان بضغطة واحدة — موافقة أو رفض مع سبب. اختصارات لوحة المفاتيح: → موافقة · ← رفض.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat icon={<Clock className="size-5" />} label="قيد المراجعة" value={String(ads.length)} />
        <Stat icon={<CheckCircle2 className="size-5" />} label="SLA المستهدف" value="24 ساعة" />
        <Stat icon={<FileWarning className="size-5" />} label="سياسة الخصوصية" value="إخفاء الهاتف" />
      </div>

      <div className="mx-auto max-w-xl">
        <AdSwipeQueue initialAds={ads} />
      </div>
    </div>
  )
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#DDE6E4] bg-white p-4 shadow-sm dark:bg-slate-900">
      <div className="flex items-center gap-2 text-[#0F8F83]">
        {icon}
        <span className="text-sm font-black text-slate-500">{label}</span>
      </div>
      <p className="mt-3 text-xl sm:text-3xl font-black text-[#102033] dark:text-white">{value}</p>
    </div>
  )
}
