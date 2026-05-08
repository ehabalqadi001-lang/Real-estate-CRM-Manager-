'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createReportAction, sendReportAction, deleteReportAction } from './actions'
import { Plus, Send, Trash2, CheckCircle2, AlertCircle, Loader2, FileText } from 'lucide-react'

const REPORT_TYPES = [
  { key: 'weekly_insight',      label: 'تحليل أسبوعي' },
  { key: 'investment_forecast', label: 'توقعات استثمارية' },
  { key: 'market_update',       label: 'تحديث السوق' },
  { key: 'custom',              label: 'مخصص' },
]

interface Client { id: string; full_name: string | null; email: string | null }

export function CreateReportForm({ clients }: { clients: Client[] }) {
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [pending, start] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    start(async () => {
      const res = await createReportAction(fd)
      if (res?.error) setResult({ ok: false, msg: res.error })
      else { setResult({ ok: true, msg: 'تم توليد التقرير بنجاح' }); setOpen(false) }
    })
  }

  if (!open) return (
    <Button onClick={() => setOpen(true)} className="fi-primary-button font-semibold">
      <Plus className="size-4" />إنشاء تقرير جديد
    </Button>
  )

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-5 shadow-sm space-y-4">
      <p className="font-black text-[var(--fi-ink)]">إنشاء تقرير جديد</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-black text-[var(--fi-muted)]">نوع التقرير</label>
          <select name="report_type" className="w-full rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] px-3 py-2 text-sm font-semibold">
            {REPORT_TYPES.map((t) => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-black text-[var(--fi-muted)]">قناة الإرسال</label>
          <select name="delivery_channel" className="w-full rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] px-3 py-2 text-sm font-semibold">
            <option value="email">بريد إلكتروني</option>
            <option value="whatsapp">واتساب</option>
            <option value="both">الاثنان</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-black text-slate-500">عنوان التقرير *</label>
        <Input name="title" placeholder="مثال: تقرير سوق التجمع الخامس — مايو 2026" required />
      </div>

      {clients.length > 0 && (
        <div>
          <label className="mb-1 block text-xs font-black text-[var(--fi-muted)]">إرسال إلى عميل (اختياري)</label>
          <select name="client_id" className="w-full rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] px-3 py-2 text-sm font-semibold">
            <option value="">— بدون عميل محدد —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.full_name ?? c.email ?? c.id.slice(0, 8)}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-black text-slate-500">سياق / بيانات إضافية</label>
        <Textarea name="context" placeholder="أدخل بيانات السوق أو الملاحظات التي تريد تضمينها في التقرير…" rows={3} />
      </div>

      <div>
        <label className="mb-1 block text-xs font-black text-slate-500">جدولة الإرسال (اختياري)</label>
        <Input name="scheduled_for" type="datetime-local" />
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
          {pending ? <><Loader2 className="size-4 animate-spin" />جاري التوليد…</> : 'توليد التقرير'}
        </Button>
      </div>
    </form>
  )
}

export function SendReportButton({ reportId }: { reportId: string }) {
  const [pending, start] = useTransition()
  const [done, setDone] = useState(false)
  const handle = () => {
    start(async () => {
      const res = await sendReportAction(reportId)
      if (!res?.error) setDone(true)
    })
  }
  if (done) return <span className="flex items-center gap-1 text-xs font-semibold text-[var(--fi-emerald)]"><CheckCircle2 className="size-3.5" />أُرسل</span>
  return (
    <Button size="sm" disabled={pending} onClick={handle} className="fi-primary-button">
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
      إرسال
    </Button>
  )
}

export function DeleteReportButton({ reportId }: { reportId: string }) {
  const [pending, start] = useTransition()
  const handle = () => {
    if (!confirm('حذف هذا التقرير نهائياً؟')) return
    start(async () => { await deleteReportAction(reportId) })
  }
  return (
    <button disabled={pending} onClick={handle} className="text-red-400 hover:text-red-600" aria-label="Delete report">
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
    </button>
  )
}

export function ReportPreview({ content }: { content: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-1 text-xs font-semibold text-[var(--fi-emerald)] hover:underline">
        <FileText className="size-3.5" />معاينة
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl bg-[var(--fi-paper)] p-6 shadow-2xl">
            <button onClick={() => setOpen(false)} className="absolute right-4 top-4 text-[var(--fi-muted)] hover:text-[var(--fi-ink)] font-black text-lg">✕</button>
            <div
              className="prose prose-sm max-w-none text-[var(--fi-ink)] leading-7"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        </div>
      )}
    </>
  )
}
