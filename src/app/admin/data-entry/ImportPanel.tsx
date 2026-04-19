'use client'

import { useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import type { importDevelopersAction } from './actions'

type ImportAction = typeof importDevelopersAction
type ImportResult = { inserted: number; updated: number; errors: string[] }

interface Props {
  title: string
  description: string
  accept?: string
  action: ImportAction
  icon: React.ReactNode
  templateHref?: string
}

export function ImportPanel({ title, description, accept = '.csv,.xlsx', action, icon, templateHref }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [pending, startTransition] = useTransition()

  const handleFile = (file: File) => {
    setResult(null)
    const fd = new FormData()
    fd.set('file', file)
    startTransition(async () => {
      const res = await action(fd)
      setResult(res)
    })
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
      className="rounded-xl border-2 border-dashed border-[#DDE6E4] bg-[#FBFCFA] p-5 transition-colors hover:border-[#0F8F83]/40 dark:bg-slate-800/50"
    >
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <p className="font-black text-[#102033] dark:text-white">{title}</p>
      </div>
      <p className="mb-4 text-xs font-semibold text-slate-500">{description}</p>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={onInputChange}
      />

      <div className="flex flex-col gap-2">
        <Button
          size="sm"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
          className="bg-[#0F8F83] font-semibold text-white hover:bg-[#0B6F66]"
        >
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
          {pending ? 'جاري الرفع…' : 'رفع ملف'}
        </Button>
        {templateHref && (
          <a
            href={templateHref}
            download
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-[#DDE6E4] bg-white px-3 text-xs font-semibold text-[#102033] hover:bg-[#FBFCFA] dark:bg-slate-900 dark:text-white"
          >
            تحميل القالب
          </a>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className={`mt-3 rounded-lg p-3 text-xs font-semibold ${result.errors.length ? 'bg-red-50 text-red-700' : 'bg-[#EEF6F5] text-[#0F8F83]'}`}>
          {result.errors.length === 0 ? (
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5" />
              تم: {result.inserted} سجل جديد
            </span>
          ) : (
            <div className="space-y-1">
              <span className="flex items-center gap-1.5">
                <AlertCircle className="size-3.5" />
                {result.inserted} سجل · {result.errors.length} خطأ
              </span>
              {result.errors.slice(0, 3).map((e, i) => (
                <p key={i} className="opacity-80">• {e}</p>
              ))}
              {result.errors.length > 3 && <p className="opacity-60">و {result.errors.length - 3} خطأ آخر…</p>}
            </div>
          )}
        </div>
      )}

      <p className="mt-2 text-center text-[10px] font-semibold text-slate-400">أو اسحب الملف هنا</p>
    </div>
  )
}
