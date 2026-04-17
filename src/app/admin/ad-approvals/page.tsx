import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ReactNode } from 'react'
import { CheckCircle2, Clock, FileWarning, XCircle } from 'lucide-react'

const pendingAds = [
  { title: 'شقة للبيع في التجمع الخامس', owner: 'عميل فردي', price: '3,850,000 ج.م', age: 'منذ 42 دقيقة', risk: 'منخفض' },
  { title: 'فيلا مستقلة في الشروق', owner: 'شركة تسويق', price: '9,800,000 ج.م', age: 'منذ ساعتين', risk: 'متوسط' },
  { title: 'محل تجاري في الشيخ زايد', owner: 'مالك فردي', price: '4,100,000 ج.م', age: 'منذ 5 ساعات', risk: 'يحتاج مستند' },
]

export default function AdApprovalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-black text-[#0F8F83]">Ad Approval Team</p>
        <h1 className="mt-2 text-3xl font-black text-[#102033] dark:text-white">مراجعة الإعلانات المعلقة</h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">كل إعلان جديد يبقى pending حتى تتم الموافقة اليدوية أو الرفض مع سبب واضح.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat icon={<Clock className="size-5" />} label="قيد المراجعة" value="18" />
        <Stat icon={<CheckCircle2 className="size-5" />} label="تمت الموافقة اليوم" value="42" />
        <Stat icon={<FileWarning className="size-5" />} label="تحتاج مستندات" value="7" />
      </div>

      <div className="overflow-hidden rounded-lg border border-[#DDE6E4] bg-white shadow-sm dark:bg-slate-900">
        {pendingAds.map((ad) => (
          <div key={ad.title} className="grid gap-3 border-b border-[#DDE6E4] p-4 last:border-b-0 lg:grid-cols-[1fr_150px_140px_220px] lg:items-center">
            <div>
              <p className="font-black text-[#102033] dark:text-white">{ad.title}</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">{ad.owner} · {ad.price}</p>
            </div>
            <Badge className="w-fit bg-[#EEF6F5] text-[#0F8F83]">{ad.age}</Badge>
            <Badge variant="outline" className="w-fit border-[#DDE6E4]">{ad.risk}</Badge>
            <div className="flex gap-2">
              <Button className="bg-[#0F8F83] text-white hover:bg-[#0B6F66]">
                <CheckCircle2 className="ms-1 size-4" />
                موافقة
              </Button>
              <Button variant="destructive">
                <XCircle className="ms-1 size-4" />
                رفض
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#DDE6E4] bg-white p-4 shadow-sm dark:bg-slate-900">
      <div className="flex items-center gap-2 text-[#0F8F83]">{icon}<span className="text-sm font-black text-slate-500">{label}</span></div>
      <p className="mt-3 text-3xl font-black text-[#102033] dark:text-white">{value}</p>
    </div>
  )
}
