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
  draft:     { label: 'مسودة',  color: '#94a3b8' },
  active:    { label: 'نشطة',   color: '#10b981' },
  paused:    { label: 'متوقفة', color: '#f59e0b' },
  completed: { label: 'مكتملة', color: '#6366f1' },
}

export function CampaignsClient({ campaigns, companyId: _companyId, userId: _userId }: { campaigns: Campaign[]; companyId: string; userId: string }) {
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [pending, start] = useTransition()

  const handleCreate = (formData: FormData) => {
    setError('')
    start(async () => {
      const res = await createCampaignAction(formData)
      if (res?.error) setError(res.error)
      else setShowForm(false)
    })
  }

  const handleStatusChange = (id: string, status: string) => {
    start(async () => {
      await updateCampaignStatusAction(id, status)
    })
  }

  return (
    <div className="space-y-6 p-4 sm:p-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black text-[#0F8F83]">مركز التسويق</p>
          <h1 className="mt-1 text-xl font-black text-[#102033] sm:text-2xl dark:text-white">الحملات التسويقية</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">{campaigns.length} حملة</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-[#0F8F83] font-semibold text-white hover:bg-[#0B6F66]"
        >
          <Plus className="size-4" />
          حملة جديدة
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="relative rounded-2xl border border-[#0F8F83]/30 bg-[#EEF6F5] p-5 dark:bg-slate-800">
          <button
            onClick={() => setShowForm(false)}
            className="absolute left-4 top-4 text-slate-400 hover:text-slate-600"
          >
            <X className="size-4" />
          </button>
          <p className="mb-4 font-black text-[#102033] dark:text-white">إنشاء حملة جديدة</p>
          <form action={handleCreate} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-black text-slate-500">اسم الحملة *</label>
              <Input name="name" placeholder="حملة إطلاق مشروع القاهرة الجديدة" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-black text-slate-500">القسم *</label>
              <select
                name="department"
                required
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{DEPT_LABELS[d] ?? d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-black text-slate-500">الميزانية (جنيه)</label>
              <Input name="budget_egp" type="number" min="0" placeholder="50000" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-black text-slate-500">تاريخ البداية</label>
              <Input name="start_date" type="date" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-black text-slate-500">تاريخ النهاية</label>
              <Input name="end_date" type="date" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-black text-slate-500">الأهداف</label>
              <Textarea name="goals" placeholder="100 عميل محتمل، 20 حجز، تكلفة عميل أقل من 500 جنيه…" rows={2} />
            </div>
            {error && (
              <p className="sm:col-span-2 flex items-center gap-1.5 text-xs font-semibold text-red-600">
                <AlertCircle className="size-3.5" />{error}
              </p>
            )}
            <div className="sm:col-span-2 flex gap-2">
              <Button type="submit" disabled={pending} className="bg-[#0F8F83] text-white">
                {pending ? 'جاري الحفظ…' : 'حفظ الحملة'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
            </div>
          </form>
        </div>
      )}

      {/* Campaigns List */}
      {campaigns.length === 0 && !showForm ? (
        <div className="rounded-2xl border border-[#DDE6E4] bg-white p-10 text-center dark:bg-slate-900">
          <Megaphone className="mx-auto mb-3 size-10 text-slate-200" />
          <p className="font-semibold text-slate-500">لا توجد حملات بعد</p>
          <p className="mt-1 text-sm text-slate-400">أنشئ أول حملة تسويقية الآن</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => {
            const status = STATUS_CONFIG[campaign.status] ?? STATUS_CONFIG.draft
            return (
              <div key={campaign.id} className="flex flex-col gap-3 rounded-2xl border border-[#DDE6E4] bg-white p-5 shadow-sm sm:flex-row sm:items-start dark:bg-slate-900">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF6F5]">
                  <Megaphone className="size-5 text-[#0F8F83]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black text-[#102033] dark:text-white">{campaign.name}</p>
                    <span className="rounded-lg px-2 py-0.5 text-xs font-bold" style={{ backgroundColor: `${status.color}15`, color: status.color }}>
                      {status.label}
                    </span>
                    <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                      {DEPT_LABELS[campaign.department] ?? campaign.department}
                    </span>
                  </div>
                  {campaign.goals && (
                    <p className="mt-1 text-sm font-semibold text-slate-500 line-clamp-1">{campaign.goals}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-4 text-xs font-semibold text-slate-400">
                    {campaign.budget_egp != null && (
                      <span>💰 {campaign.budget_egp.toLocaleString('ar-EG')} جنيه</span>
                    )}
                    {(campaign.start_date || campaign.end_date) && (
                      <span className="flex items-center gap-1">
                        <CalendarDays className="size-3" />
                        {campaign.start_date ?? '—'} → {campaign.end_date ?? '—'}
                      </span>
                    )}
                  </div>
                </div>
                {/* Status Changer */}
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
