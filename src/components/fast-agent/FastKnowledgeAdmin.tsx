'use client'

import { useState } from 'react'
import { Bot, BrainCircuit, CheckCircle2, Database, History, Loader2, MessageSquareText, RefreshCw, Search, Send } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { FastKnowledgeDocumentSummary, FastKnowledgeStatus } from '@/lib/fast-agent/knowledge'

type IngestResponse = FastKnowledgeStatus & {
  ok: boolean
  documentsScanned?: number
  documentsUpserted?: number
  chunksUpserted?: number
  error?: string
}

export function FastKnowledgeAdmin({ initialStatus }: { initialStatus: FastKnowledgeStatus }) {
  const [status, setStatus] = useState<FastKnowledgeStatus>(initialStatus)
  const [busy, setBusy] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testQuestion, setTestQuestion] = useState('قارن أفضل الوحدات المتاحة حسب السعر وخطة السداد')
  const [testReply, setTestReply] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function refreshStatus() {
    setBusy(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch('/api/fast-agent/ingest', { method: 'GET' })
      const payload = await response.json() as IngestResponse
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? 'تعذر قراءة حالة ذاكرة FAST.')
      setStatus(payload)
      setMessage('تم تحديث حالة ذاكرة FAST.')
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'تعذر تحديث الحالة.')
    } finally {
      setBusy(false)
    }
  }

  async function runIngest() {
    setBusy(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch('/api/fast-agent/ingest', { method: 'POST' })
      const payload = await response.json() as IngestResponse
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? 'تعذر تشغيل فهرسة FAST.')
      setStatus(payload)
      setMessage(`تمت الفهرسة: ${payload.documentsUpserted ?? 0} مستند و ${payload.chunksUpserted ?? 0} مقطع معرفة.`)
    } catch (ingestError) {
      setError(ingestError instanceof Error ? ingestError.message : 'تعذر تشغيل الفهرسة.')
    } finally {
      setBusy(false)
    }
  }

  async function runFastTest() {
    const question = testQuestion.trim()
    if (!question) return

    setTesting(true)
    setError(null)
    setTestReply(null)

    try {
      const response = await fetch('/api/fast-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: question }] }),
      })
      const payload = await response.json() as { reply?: string }
      if (!response.ok) throw new Error(payload.reply ?? 'تعذر اختبار FAST الآن.')
      setTestReply(payload.reply ?? 'لم يرجع FAST ردا واضحا.')
    } catch (testError) {
      setError(testError instanceof Error ? testError.message : 'تعذر اختبار FAST.')
    } finally {
      setTesting(false)
    }
  }

  const embeddingCoverage = status.chunks ? Math.round((status.embeddedChunks / status.chunks) * 100) : 0

  return (
    <div className="space-y-6" dir="rtl">
      <section className="overflow-hidden rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="p-5 sm:p-7">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-lg bg-[var(--fi-soft)] text-[var(--fi-emerald)]">
                <BrainCircuit className="size-6" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--fi-emerald)]">FAST AI MEMORY</p>
                <h1 className="mt-1 text-2xl font-black text-[var(--fi-ink)] sm:text-3xl">إدارة ذاكرة FAST</h1>
              </div>
            </div>

            <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-[var(--fi-muted)]">
              هذه الصفحة تفهرس بيانات المشاريع والوحدات والإعلانات المعتمدة داخل ذاكرة pgvector، ثم يستخدمها وكيل FAST في الردود حسب صلاحيات المستخدم وسياق الشركة.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={runIngest}
                disabled={busy}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[var(--fi-ink)] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[var(--fi-emerald)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Database className="size-4" aria-hidden="true" />}
                إعادة فهرسة بيانات FAST
              </button>
              <button
                type="button"
                onClick={refreshStatus}
                disabled={busy}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--fi-line)] bg-white px-5 py-2.5 text-sm font-black text-[var(--fi-ink)] transition hover:border-[var(--fi-emerald)] hover:text-[var(--fi-emerald)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={`size-4 ${busy ? 'animate-spin' : ''}`} aria-hidden="true" />
                تحديث الحالة
              </button>
            </div>

            {(message || error) && (
              <div className={`mt-5 rounded-lg border px-4 py-3 text-sm font-bold ${
                error
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}>
                {error ?? message}
              </div>
            )}
          </div>

          <div className="border-t border-[var(--fi-line)] bg-[var(--fi-soft)] p-5 sm:p-7 lg:border-r lg:border-t-0">
            <p className="text-sm font-black text-[var(--fi-ink)]">جاهزية البحث الذكي</p>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs font-black">
                <span className="text-[var(--fi-muted)]">تغطية Embeddings</span>
                <span className="text-[var(--fi-emerald)]">{embeddingCoverage}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-white">
                {/* eslint-disable-next-line no-inline-styles/no-inline-styles */}
                <div className="h-full rounded-full bg-[var(--fi-emerald)] transition-all" style={{ width: `${embeddingCoverage}%` }} />
              </div>
            </div>
            <div className="mt-5 rounded-lg border border-[var(--fi-line)] bg-white/80 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[var(--fi-emerald)]" aria-hidden="true" />
                <p className="text-xs font-bold leading-6 text-[var(--fi-muted)]">
                  إذا تعذر Gemini embedding بسبب quota، يتم حفظ المعرفة نصياً ويعمل FAST بالبحث النصي الاحتياطي بدون تعطيل النظام.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard icon={Database} label="المستندات" value={status.documents} />
        <MetricCard icon={Search} label="مقاطع المعرفة" value={status.chunks} />
        <MetricCard icon={Bot} label="Embeddings" value={status.embeddedChunks} />
        <MetricCard icon={History} label="المحادثات" value={status.conversations} />
        <MetricCard icon={MessageSquareText} label="الرسائل" value={status.messages} />
      </section>

      <section className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] p-5 shadow-sm">
        <p className="text-sm font-black text-[var(--fi-ink)]">آخر تحديث</p>
        <p className="mt-2 text-sm font-bold text-[var(--fi-muted)]">
          {status.lastUpdatedAt ? new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(status.lastUpdatedAt)) : 'لم يتم تسجيل تحديث بعد'}
        </p>
      </section>
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-[var(--fi-ink)]">اختبار FAST</p>
              <p className="mt-1 text-xs font-bold text-[var(--fi-muted)]">أرسل سؤالا سريعا للتأكد من أن الوكيل يقرأ السياق الحالي.</p>
            </div>
            <Bot className="size-5 text-[var(--fi-emerald)]" aria-hidden="true" />
          </div>

          <textarea
            value={testQuestion}
            onChange={(event) => setTestQuestion(event.target.value)}
            rows={4}
            className="mt-4 w-full resize-none rounded-lg border border-[var(--fi-line)] bg-white px-4 py-3 text-sm font-bold leading-7 text-[var(--fi-ink)] outline-none transition focus:border-[var(--fi-emerald)]"
            placeholder="اكتب سؤال اختبار لـ FAST"
          />

          <button
            type="button"
            onClick={runFastTest}
            disabled={testing || !testQuestion.trim()}
            className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[var(--fi-emerald)] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[var(--fi-ink)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {testing ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
            تشغيل الاختبار
          </button>

          {testReply && (
            <div className="mt-4 rounded-lg border border-[var(--fi-line)] bg-[var(--fi-soft)] p-4 text-sm font-bold leading-7 text-[var(--fi-ink)]">
              {testReply}
            </div>
          )}
        </div>

        <RecentDocuments documents={status.recentDocuments} />
      </section>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4 shadow-sm">
      <Icon className="size-5 text-[var(--fi-emerald)]" aria-hidden="true" />
      <p className="mt-4 text-2xl font-black text-[var(--fi-ink)]">{value.toLocaleString('ar-EG')}</p>
      <p className="mt-1 text-xs font-bold text-[var(--fi-muted)]">{label}</p>
    </div>
  )
}

function RecentDocuments({ documents }: { documents: FastKnowledgeDocumentSummary[] }) {
  return (
    <div className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-[var(--fi-ink)]">آخر المستندات المفهرسة</p>
          <p className="mt-1 text-xs font-bold text-[var(--fi-muted)]">مصادر المعرفة التي يعتمد عليها FAST في البحث.</p>
        </div>
        <Database className="size-5 text-[var(--fi-emerald)]" aria-hidden="true" />
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-[var(--fi-line)]">
        {documents.length === 0 ? (
          <div className="bg-white p-5 text-center text-sm font-bold text-[var(--fi-muted)]">
            لا توجد مستندات مفهرسة بعد.
          </div>
        ) : (
          <div className="divide-y divide-[var(--fi-line)]">
            {documents.map((document) => (
              <div key={document.id} className="grid gap-3 bg-white p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-[var(--fi-ink)]">{document.title}</p>
                  <p className="mt-1 text-xs font-bold text-[var(--fi-muted)]">
                    {labelSource(document.sourceType)} · {labelVisibility(document.visibility)}
                  </p>
                </div>
                <p className="text-xs font-bold text-[var(--fi-muted)]">
                  {new Intl.DateTimeFormat('ar-EG', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(document.updatedAt))}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function labelSource(source: string) {
  const labels: Record<string, string> = {
    project: 'مشروع',
    unit: 'وحدة',
    ad: 'إعلان',
    policy: 'سياسة',
    manual: 'يدوي',
    public: 'عام',
  }
  return labels[source] ?? source
}

function labelVisibility(visibility: string) {
  const labels: Record<string, string> = {
    public: 'عام',
    company: 'الشركة',
    management: 'الإدارة',
    hr: 'الموارد البشرية',
    finance: 'المالية',
    private: 'خاص',
  }
  return labels[visibility] ?? visibility
}
