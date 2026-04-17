import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createServerClient } from '@/lib/supabase/server'
import { CheckCircle2, Clock, FileWarning, XCircle } from 'lucide-react'
import { approveAdAction, rejectAdAction } from './actions'

type PendingAd = {
  id: string
  title: string
  price: number | string
  property_type: string | null
  location: string | null
  created_at: string
  user_id: string
}

export const dynamic = 'force-dynamic'

export default async function AdApprovalsPage() {
  const supabase = await createServerClient()
  const { data: pendingAds } = await supabase
    .from('ads')
    .select('id, title, price, property_type, location, created_at, user_id')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(50)

  const ads = (pendingAds ?? []) as PendingAd[]

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-black text-[#0F8F83]">Ad Approval Team</p>
        <h1 className="mt-2 text-3xl font-black text-[#102033] dark:text-white">مراجعة الإعلانات المعلقة</h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">
          كل إعلان جديد يبقى pending حتى تتم الموافقة اليدوية أو الرفض مع سبب واضح.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat icon={<Clock className="size-5" />} label="قيد المراجعة" value={String(ads.length)} />
        <Stat icon={<CheckCircle2 className="size-5" />} label="SLA المستهدف" value="24 ساعة" />
        <Stat icon={<FileWarning className="size-5" />} label="سياسة الخصوصية" value="إخفاء الهاتف" />
      </div>

      <div className="overflow-hidden rounded-lg border border-[#DDE6E4] bg-white shadow-sm dark:bg-slate-900">
        {ads.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-lg font-black text-[#102033] dark:text-white">لا توجد إعلانات معلقة الآن</p>
            <p className="mt-2 text-sm font-semibold text-slate-500">ستظهر هنا طلبات النشر الجديدة فور إرسالها من المستخدمين.</p>
          </div>
        ) : (
          ads.map((ad) => (
            <div key={ad.id} className="grid gap-3 border-b border-[#DDE6E4] p-4 last:border-b-0 lg:grid-cols-[1fr_150px_170px_260px] lg:items-center">
              <div>
                <p className="font-black text-[#102033] dark:text-white">{ad.title}</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {ad.property_type ?? 'عقار'} · {ad.location ?? 'بدون موقع'} · {Number(ad.price).toLocaleString('ar-EG')} ج.م
                </p>
              </div>
              <Badge className="w-fit bg-[#EEF6F5] text-[#0F8F83]">{formatAge(ad.created_at)}</Badge>
              <Badge variant="outline" className="w-fit border-[#DDE6E4]">بانتظار المراجعة</Badge>
              <div className="flex flex-wrap gap-2">
                <form action={approveAdAction}>
                  <input type="hidden" name="ad_id" value={ad.id} />
                  <Button className="bg-[#0F8F83] text-white hover:bg-[#0B6F66]">
                    <CheckCircle2 className="ms-1 size-4" />
                    موافقة
                  </Button>
                </form>
                <form action={rejectAdAction} className="flex gap-2">
                  <input type="hidden" name="ad_id" value={ad.id} />
                  <input type="hidden" name="reason" value="بيانات الإعلان غير مكتملة أو تحتاج مستندات إضافية" />
                  <Button variant="destructive">
                    <XCircle className="ms-1 size-4" />
                    رفض
                  </Button>
                </form>
              </div>
            </div>
          ))
        )}
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
      <p className="mt-3 text-3xl font-black text-[#102033] dark:text-white">{value}</p>
    </div>
  )
}

function formatAge(createdAt: string) {
  const diffMs = Date.now() - new Date(createdAt).getTime()
  const minutes = Math.max(1, Math.round(diffMs / 60_000))
  if (minutes < 60) return `منذ ${minutes.toLocaleString('ar-EG')} دقيقة`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `منذ ${hours.toLocaleString('ar-EG')} ساعة`
  const days = Math.round(hours / 24)
  return `منذ ${days.toLocaleString('ar-EG')} يوم`
}
