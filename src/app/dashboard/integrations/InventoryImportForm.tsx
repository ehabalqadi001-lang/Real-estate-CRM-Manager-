'use client'

import { useState } from 'react'
import { FileSpreadsheet, Loader2, UploadCloud } from 'lucide-react'

type DeveloperOption = { id: string; name_ar: string | null; name: string | null }

type ImportResult = {
  batchId: string
  totalRows: number
  processedRows: number
  failedRows: number
}

export function InventoryImportForm({ developers }: { developers: DeveloperOption[] }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)

  async function submitImport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData(event.currentTarget)
      const response = await fetch('/api/inventory/import', {
        method: 'POST',
        body: formData,
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error ?? 'تعذر رفع الملف.')
      }

      setResult(payload)
      event.currentTarget.reset()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'تعذر استيراد الملف.')
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="ds-card p-5" dir="rtl">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-lg bg-[var(--fi-soft)] text-[var(--fi-emerald)]">
          <FileSpreadsheet className="size-5" />
        </span>
        <div>
          <h2 className="text-xl font-black text-[var(--fi-ink)]">استيراد Excel / CSV</h2>
          <p className="text-sm font-semibold text-[var(--fi-muted)]">
            رفع ملف المطور وإنشاء batch مع Auto Mapping للحقول.
          </p>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold leading-7 text-emerald-700">
          تم إنشاء batch بنجاح: {result.totalRows} صفوف، تمت معالجة {result.processedRows}، وتحتاج {result.failedRows} للمراجعة.
        </div>
      ) : null}

      <form onSubmit={submitImport} className="grid gap-4">
        <select name="developerId" className="h-11 rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-bold dark:bg-white/5" defaultValue="">
          <option value="">بدون مطور محدد</option>
          {developers.map((developer) => (
            <option key={developer.id} value={developer.id}>
              {developer.name_ar || developer.name}
            </option>
          ))}
        </select>
        <input
          name="file"
          type="file"
          accept=".xlsx,.csv"
          required
          className="rounded-lg border border-dashed border-[var(--fi-line)] bg-white p-4 text-sm font-bold text-[var(--fi-muted)] dark:bg-white/5"
        />
        <button type="submit" disabled={pending} className="fi-primary-button flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-black disabled:opacity-60">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
          {pending ? 'جاري الاستيراد...' : 'رفع وتحليل الملف'}
        </button>
      </form>
    </section>
  )
}
