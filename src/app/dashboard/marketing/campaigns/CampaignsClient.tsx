'use client'

import { useState, useTransition } from 'react'
import { AlertCircle, CalendarDays, Megaphone, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createCampaignAction, updateCampaignStatusAction } from './actions'

type Campaign = {
  id: string
  name: string
  department: string
  status: string
  budget_egp: number | null
  start_date: string | null
  end_date: string | null
  goals: string | null
  created_at: string
}

const DEPARTMENTS = [
  'Copywriting', 'Paid Ads', 'SEO', 'Email Marketing',
  'Social Media', 'Video', 'Analytics', 'CRM',
  'Content Strategy', 'Growth', 'Personal Brand',
]

const DEPT_LABELS: Record<string, string> = {
  'Copywriting': 'الكتابة الإعلانية', 'Paid Ads': 'الإعلانات المدفوعة',
  'SEO': 'SEO', 'Email Marketing': 'البريد الإلكتروني',
  'Social Media': 'السوشيال ميديا', 'Video': 'الفيديو',
  'Analytics': 'التحليلات', 'CRM': 'CRM',
  'Content Strategy': 'استراتيجية المحتوى', 'Growth': 'النمو',
  'Personal Brand': 'العلامة الشخصية',
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft:     { label: 'مسودة',   color: '#94a3b8' },
  active:    { label: 'نشطة',    color: '#10b981' },
  paused:    { label: 'متوقفة',  color: '#f59e0b' },
  completed: { label: 'مكتملة',  color: '#6366f1' },
}

export function CampaignsClient({ campaigns, companyId: _c, userId: _u }: { campaigns: Campaign[]; companyId: string; userId: string }) {
  const [showForm, setShowForm] = useState(false)
  const [error, setError]       = useState('')
  const [pending, start]        = useTransition()

  const handleCreate = (formData: FormData) => {
    setError('')
    start(async () => {
      const res = await createCampaignAction(formData)
      if (res?.error) setError(res.error)
      else setShowForm(false)
    })
  }

  const handleStatusChange = (id: string, status: string) => {
    start(async () => { await updateCampaignStatusAction(id, status) })
  }

  return (
    <div className="space-y-5 p-4 sm:p-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--fi-emerald)] shadow-lg shadow-[var(--fi-emerald)]/20">
            <Megaphone size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-[var(--fi-ink)]">الحملات التسويقية</h1>
            <p className="text-xs text-[var(--fi-muted)]">{campaigns.length} حملة</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)} className="fi-primary-button font-semibold text-white">
          <Plus className="size-4" />حملة جديدة
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="relative rounded-xl border border-[var(--fi-line)] bg-[var(--fi-soft)] p-5">
          <button onClick={() => setShowForm(false)} className="absolute left-4 top-4 text-[var(--fi-muted)] hover:text-[var(--fi-ink)]">
            <X className="size-4" />
          </button>
          <p className="mb-4 font-black text-[var(--fi-ink)]">إنشاء حملة جديدة</p>
          <form action={handleCreate} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-black text-[var(--fi-muted)]">اسم الحملة *</label>
              <Input name="name" placeholder="حملة إطلاق مشروع القاهرة الجديدة" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-black text-[var(--fi-muted)]">القسم *</label>
              <select name="department" required className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{DEPT_LABELS[d] ?? d}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-black text-[var(--fi-muted)]">الميزانية (جنيه)</label>
              <Input name="budget_egp" type="number" min="0" placeholder="50000" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-black text-[var(--fi-muted)]">تاريخ البداية</label>
              <Input name="start_date" type="date" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-black text-[var(--fi-muted)]">تاريخ النهاية</label>
              <Input name="end_date" type="date" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-black text-[var(--fi-muted)]">الأهداف</label>
              <Textarea name="goals" placeholder="100 عميل محتمل، 20 حجز، تكلفة عميل أقل من 500 جنيه…" rows={2} />
            </div>
            {error && (
              <p className="sm:col-span-2 flex items-center gap-1.5 text-xs font-semibold text-red-600">
                <AlertCircle className="size-3.5" />{error}
              </p>
            )}
            <div className="sm:col-span-2 flex gap-2">
              <Button type="submit" disabled={pending} className="fi-primary-button text-white">
                {pending ? 'جاري الحفظ…' : 'حفظ الحملة'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {campaigns.length === 0 && !showForm ? (
        <div className="rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-10 text-center shadow-sm">
          <Megaphone className="mx-auto mb-3 size-10 text-[var(--fi-muted)]" />
          <p className="font-semibold text-[var(--fi-muted)]">لا توجد حملات بعد — أنشئ أول حملة تسويقية</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => {
            const status = STATUS_CONFIG[campaign.status] ?? STATUS_CONFIG.draft
            return (
              <div key={campaign.id} className="flex flex-col gap-3 rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4 shadow-sm sm:flex-row sm:items-start">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--fi-soft)]">
                  <Megaphone className="size-5 text-[var(--fi-emerald)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black text-[var(--fi-ink)]">{campaign.name}</p>
                    <span className="rounded-lg px-2 py-0.5 text-xs font-bold" style={{ backgroundColor: `${status.color}15`, color: status.color }}>
                      {status.label}
                    </span>
                    <span className="rounded-lg bg-[var(--fi-soft)] px-2 py-0.5 text-xs font-bold text-[var(--fi-muted)]">
                      {DEPT_LABELS[campaign.department] ?? campaign.department}
                    </span>
                  </div>
                  {campaign.goals && <p className="mt-1 text-sm text-[var(--fi-muted)] line-clamp-1">{campaign.goals}</p>}
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-[var(--fi-muted)]">
                    {campaign.budget_egp != null && <span>💰 {campaign.budget_egp.toLocaleString('ar-EG')} جنيه</span>}
                    {(campaign.start_date || campaign.end_date) && (
                      <span className="flex items-center gap-1">
                        <CalendarDays className="size-3" />
                        {campaign.start_date ?? '—'} → {campaign.end_date ?? '—'}
                      </span>
                    )}
                  </div>
                </div>
                <select
                  value={campaign.status}
                  disabled={pending}
                  onChange={(e) => handleStatusChange(campaign.id, e.target.value)}
                  className="h-8 rounded-lg border border-input bg-background px-2 text-xs font-bold outline-none focus-visible:border-ring"
                  style={{ color: status.color }}
                >
                  {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                    <option key={val} value={val}>{cfg.label}</option>
                  ))}
                </select>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
