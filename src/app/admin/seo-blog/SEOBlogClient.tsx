'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { generateBlogPostAction, publishBlogPostAction, deleteBlogPostAction } from './actions'
import { Plus, Loader2, CheckCircle2, AlertCircle, Globe, Trash2, Eye, FileText } from 'lucide-react'

const BLOG_TYPES = [
  { key: 'market_update',     label: 'تحديث السوق العقاري' },
  { key: 'investment_guide',  label: 'دليل الاستثمار العقاري' },
  { key: 'neighborhood',      label: 'تقرير حي سكني' },
  { key: 'buying_guide',      label: 'دليل المشتري' },
  { key: 'project_spotlight', label: 'تسليط الضوء على مشروع' },
  { key: 'seo_landing',       label: 'صفحة هبوط SEO' },
]

interface BlogAsset {
  id: string
  title: string | null
  output_text: string | null
  status: string | null
  created_at: string
  metadata: { blog_type?: string; keywords?: string; city?: string } | null
}

interface Props { assets: BlogAsset[] }

export function SEOBlogClient({ assets }: Props) {
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [pending, start] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    start(async () => {
      const res = await generateBlogPostAction(fd)
      if (res?.error) setResult({ ok: false, msg: res.error })
      else { setResult({ ok: true, msg: 'تم توليد المقال بنجاح!' }); setOpen(false); if (res.content) setPreview(res.content) }
    })
  }

  const handlePublish = (id: string) => start(async () => { await publishBlogPostAction(id) })
  const handleDelete  = (id: string) => { if (confirm('حذف هذا المقال؟')) start(async () => { await deleteBlogPostAction(id) }) }

  return (
    <div className="space-y-5">
      {/* Generate button */}
      {!open && (
        <Button onClick={() => setOpen(true)} className="bg-[#0F8F83] font-semibold text-white hover:bg-[#0B6F66]">
          <Plus className="size-4" />توليد مقال جديد
        </Button>
      )}

      {/* Form */}
      {open && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-[#DDE6E4] bg-white p-5 shadow-sm dark:bg-slate-900 space-y-4">
          <p className="font-black text-[#102033] dark:text-white">توليد مقال SEO جديد</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-black text-slate-500">نوع المقال</label>
              <select name="blog_type" className="w-full rounded-xl border border-[#DDE6E4] bg-white px-3 py-2 text-sm font-semibold dark:bg-slate-800">
                {BLOG_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-black text-slate-500">المدينة / المنطقة</label>
              <Input name="city" placeholder="مثال: القاهرة الجديدة، التجمع الخامس" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-black text-slate-500">موضوع المقال *</label>
            <Input name="topic" placeholder="مثال: أفضل المناطق للاستثمار في القاهرة 2026" required />
          </div>

          <div>
            <label className="mb-1 block text-xs font-black text-slate-500">الكلمات المفتاحية SEO</label>
            <Input name="keywords" placeholder="شقق للبيع القاهرة، عقارات مصر، استثمار عقاري" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-black text-slate-500">الجمهور المستهدف</label>
              <Input name="audience" placeholder="مستثمرون عقاريون في مصر" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-black text-slate-500">عدد الكلمات</label>
              <select name="word_count" className="w-full rounded-xl border border-[#DDE6E4] bg-white px-3 py-2 text-sm font-semibold dark:bg-slate-800">
                <option value="400">400 كلمة (قصير)</option>
                <option value="600" selected>600 كلمة (متوسط)</option>
                <option value="1000">1000 كلمة (طويل)</option>
                <option value="1500">1500 كلمة (شامل)</option>
              </select>
            </div>
          </div>

          {result && (
            <p className={`flex items-center gap-1.5 text-xs font-semibold ${result.ok ? 'text-[#0F8F83]' : 'text-red-600'}`}>
              {result.ok ? <CheckCircle2 className="size-3.5" /> : <AlertCircle className="size-3.5" />}
              {result.msg}
            </p>
          )}

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">إلغاء</Button>
            <Button type="submit" disabled={pending} className="flex-1 bg-[#0F8F83] text-white">
              {pending ? <><Loader2 className="size-4 animate-spin" />جاري التوليد…</> : 'توليد المقال بالـ AI'}
            </Button>
          </div>
        </form>
      )}

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <button onClick={() => setPreview(null)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 font-black text-lg">✕</button>
            <div className="prose prose-sm max-w-none text-[#102033] dark:text-slate-200 leading-7" dangerouslySetInnerHTML={{ __html: preview }} />
          </div>
        </div>
      )}

      {/* Assets list */}
      <div className="space-y-3">
        {assets.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#DDE6E4] py-14 text-center">
            <FileText className="size-10 text-slate-300" />
            <p className="font-bold text-slate-400">لا توجد مقالات بعد</p>
            <p className="text-xs text-slate-400">اضغط &quot;توليد مقال جديد&quot; لإنشاء أول مقال SEO</p>
          </div>
        )}
        {assets.map((a) => (
          <div key={a.id} className="flex items-start gap-3 rounded-2xl border border-[#DDE6E4] bg-white p-4 shadow-sm dark:bg-slate-900">
            <div className="mt-0.5 rounded-lg bg-[#0F8F83]/10 p-2 text-[#0F8F83]">
              <FileText className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-black text-[#102033] dark:text-white">{a.title}</p>
                <span className={`rounded-lg px-2 py-0.5 text-xs font-bold ${a.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {a.status === 'published' ? 'منشور' : 'مسودة'}
                </span>
                {a.metadata?.city && <span className="text-xs text-slate-400">{a.metadata.city}</span>}
              </div>
              {a.metadata?.keywords && <p className="mt-1 text-xs text-slate-400 truncate">🔑 {a.metadata.keywords}</p>}
              <p className="mt-1 text-xs text-slate-400">{new Date(a.created_at).toLocaleDateString('ar-EG')}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {a.output_text && (
                <button onClick={() => setPreview(a.output_text)} className="flex items-center gap-1 text-xs font-semibold text-[#0F8F83] hover:underline">
                  <Eye className="size-3.5" />معاينة
                </button>
              )}
              {a.status !== 'published' && (
                <Button size="sm" disabled={pending} onClick={() => handlePublish(a.id)} className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs">
                  <Globe className="size-3" />نشر
                </Button>
              )}
              <button disabled={pending} onClick={() => handleDelete(a.id)} className="text-red-400 hover:text-red-600">
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
