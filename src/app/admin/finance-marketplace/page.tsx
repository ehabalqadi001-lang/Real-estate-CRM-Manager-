import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ReactElement } from 'react'
import { Coins, Download, ReceiptText, TrendingUp, WalletCards } from 'lucide-react'

const transactions = [
  { user: 'ahmed@example.com', plan: 'باقة 4 إعلانات', amount: '500 ج.م', status: 'completed', date: '2026-04-17' },
  { user: 'sales@company.com', plan: 'باقة شركات موثقة', amount: '10,000 ج.م', status: 'pending', date: '2026-04-17' },
  { user: 'owner@example.com', plan: 'إعلان فردي', amount: '150 ج.م', status: 'completed', date: '2026-04-16' },
]

export default function MarketplaceFinancePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-black text-[#0F8F83]">Finance Team</p>
          <h1 className="mt-2 text-3xl font-black text-[#102033] dark:text-white">إيرادات الباقات ومحافظ النقاط</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">متابعة المدفوعات، أرصدة النقاط، وتسوية عمليات شراء الباقات.</p>
        </div>
        <Button variant="outline" className="border-[#DDE6E4]">
          <Download className="ms-1 size-4" />
          تصدير التقرير
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <FinanceCard icon={<TrendingUp />} label="إيراد الشهر" value="184,500 ج.م" />
        <FinanceCard icon={<Coins />} label="نقاط مباعة" value="1,240" />
        <FinanceCard icon={<WalletCards />} label="محافظ نشطة" value="312" />
      </div>

      <div className="rounded-lg border border-[#DDE6E4] bg-white p-4 shadow-sm dark:bg-slate-900">
        <p className="mb-4 flex items-center gap-2 font-black">
          <ReceiptText className="size-5 text-[#C9964A]" />
          آخر العمليات
        </p>
        <div className="space-y-2">
          {transactions.map((transaction) => (
            <div key={`${transaction.user}-${transaction.plan}`} className="grid gap-2 rounded-lg bg-[#FBFCFA] p-3 text-sm font-semibold dark:bg-slate-800 md:grid-cols-[1fr_180px_140px_120px] md:items-center">
              <span>{transaction.user}</span>
              <span>{transaction.plan}</span>
              <span className="font-black">{transaction.amount}</span>
              <Badge className={transaction.status === 'completed' ? 'bg-[#EEF6F5] text-[#0F8F83]' : 'bg-[#C9964A]/10 text-[#C9964A]'}>
                {transaction.status === 'completed' ? 'مكتملة' : 'معلقة'}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function FinanceCard({ icon, label, value }: { icon: ReactElement; label: string; value: string }) {
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
