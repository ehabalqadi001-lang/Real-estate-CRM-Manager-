'use client'

import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { addMarketDataAction, generateInsightAction } from './actions'
import { Plus, Brain, AlertCircle, CheckCircle2, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface Props {
  companyId: string
}

export function AddMarketDataForm({ companyId: _ }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    start(async () => {
      const res = await addMarketDataAction(fd)
      if (res?.error) setResult({ ok: false, msg: res.error })
      else { setResult({ ok: true, msg: 'تم إضافة البيانات' }); setOpen(false) }
    })
  }

  if (!open) return (
    <Button onClick={() => setOpen(true)} className="fi-primary-button font-semibold">
      <Plus className="size-4" />إضافة بيانات سوق
    </Button>
  )

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-5 shadow-sm space-y-3">
      <p className="font-black text-[var(--fi-ink)]">إضافة بيانات سوق جديدة</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-black text-[var(--fi-muted)]">المنطقة *</label>
          <Input name="region" placeholder="مثال: التجمع الخامس" required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-black text-[var(--fi-muted)]">الزون / الكمبوند</label>
          <Input name="zone" placeholder="مثال: R7، المنطقة المركزية" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-black text-[var(--fi-muted)]">متوسط السعر (ج.م/م²)</label>
          <Input name="avg_price_sqm" type="number" placeholder="85000" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-black text-[var(--fi-muted)]">تغير السعر %</label>
          <Input name="price_change_pct" type="number" step="0.1" placeholder="5.2" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-black text-[var(--fi-muted)]">مستوى الطلب</label>
          <select name="demand_level" className="w-full rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] px-3 py-2 text-sm font-semibold">
            <option value="high">مرتفع</option>
            <option value="medium" selected>متوسط</option>
            <option value="low">منخفض</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-black text-[var(--fi-muted)]">وحدات معروضة</label>
          <Input name="supply_units" type="number" placeholder="250" />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-black text-[var(--fi-muted)]">ملاحظات</label>
        <Textarea name="notes" placeholder="تفاصيل إضافية عن السوق…" rows={2} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-black text-[var(--fi-muted)]">رابط المصدر</label>
        <Input name="source_url" type="url" placeholder="https://..." dir="ltr" />
      </div>
      {result && (
        <p className={`flex items-center gap-1.5 text-xs font-semibold ${result.ok ? 'text-[var(--fi-emerald)]' : 'text-red-600'}`}>
          {result.ok ? <CheckCircle2 className="size-3.5" /> : <AlertCircle className="size-3.5" />}
          {result.msg}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">إلغاء</Button>
        <Button type="submit" disabled={pending} className="flex-1 fi-primary-button">
          {pending ? <Loader2 className="size-4 animate-spin" /> : 'حفظ'}
        </Button>
      </div>
    </form>
  )
}

interface InsightProps { region: string; priceData: string }

export function AIInsightButton({ region, priceData }: InsightProps) {
  const [insight, setInsight] = useState('')
  const [pending, start] = useTransition()

  const generate = () => {
    setInsight('')
    const fd = new FormData()
    fd.set('region', region)
    fd.set('price_data', priceData)
    start(async () => {
      const res = await generateInsightAction(fd)
      if (res?.insight) setInsight(res.insight)
    })
  }

  return (
    <div className="mt-3">
      <Button size="sm" onClick={generate} disabled={pending} className="bg-[#C9964A] text-white hover:bg-[#A87A3A]">
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Brain className="size-3.5" />}
        {pending ? 'جاري التحليل…' : 'تحليل AI'}
      </Button>
      {insight && (
        <div className="mt-3 rounded-xl border border-[#C9964A]/30 bg-[#C9964A]/5 p-3">
          <p className="text-xs font-semibold leading-6 text-[var(--fi-ink)] whitespace-pre-wrap">{insight}</p>
        </div>
      )}
    </div>
  )
}

export function DemandBadge({ level }: { level: string }) {
  const map: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
    high:   { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',  icon: <TrendingUp className="size-3.5" />,  label: 'طلب مرتفع' },
    medium: { cls: 'bg-amber-50 text-amber-700 border-amber-200',        icon: <Minus className="size-3.5" />,        label: 'طلب متوسط' },
    low:    { cls: 'bg-red-50 text-red-700 border-red-200',              icon: <TrendingDown className="size-3.5" />, label: 'طلب منخفض' },
  }
  const d = map[level] ?? map.medium
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-black ${d.cls}`}>
      {d.icon}{d.label}
    </span>
  )
}
