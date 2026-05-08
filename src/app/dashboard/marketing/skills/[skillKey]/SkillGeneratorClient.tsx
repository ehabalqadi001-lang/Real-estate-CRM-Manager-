'use client'

import { useState, useTransition } from 'react'
import { AlertCircle, CheckCircle2, Copy, Loader2, Sparkles } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { MODEL_OPTIONS, type AIModel } from '@/lib/ai-provider'
import { generateSkillContentAction } from '../actions'

type Props = {
  skillKey: string
  titleAr: string
  descriptionEn: string | null
  skillContent: string
  departmentColor: string
}

export function SkillGeneratorClient({ skillKey, titleAr, descriptionEn, skillContent, departmentColor }: Props) {
  const [context, setContext] = useState('')
  const [selectedModel, setSelectedModel] = useState<AIModel>('claude-sonnet-4-6')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [pending, start] = useTransition()

  const handleGenerate = () => {
    setOutput(''); setError('')
    start(async () => {
      const res = await generateSkillContentAction(skillKey, context, selectedModel)
      if (res?.error) setError(res.error)
      else setOutput(res.output ?? '')
    })
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Input Panel */}
      <div className="space-y-5 rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-6 shadow-sm">
        <div>
          <p className="font-black text-[var(--fi-ink)]">الإعدادات</p>
          {descriptionEn && (
            <p className="mt-1 text-xs font-semibold text-[var(--fi-muted)]" dir="ltr">{descriptionEn}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">
            السياق والتفاصيل <span className="opacity-50">(اختياري — تحسّن جودة النتيجة)</span>
          </label>
          <Textarea
            placeholder="مثال: شقة 120م في مدينة نصر، 3 غرف، سعر 2.5 مليون جنيه، بالقرب من المترو، تسليم فوري..."
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">نموذج الذكاء الاصطناعي</label>
          <div className="flex flex-wrap gap-2">
            {MODEL_OPTIONS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setSelectedModel(m.value as AIModel)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                  selectedModel !== m.value ? 'border-[var(--fi-line)] text-[var(--fi-muted)]' : ''
                }`}
                style={selectedModel === m.value
                  ? { backgroundColor: `${departmentColor}15`, borderColor: departmentColor, color: departmentColor }
                  : undefined
                }
              >
                {m.badge} {m.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
            <AlertCircle className="size-3.5 shrink-0" />{error}
          </p>
        )}

        <Button
          disabled={pending}
          onClick={handleGenerate}
          className="w-full font-semibold text-white"
          style={{ backgroundColor: departmentColor }}
        >
          {pending
            ? <><Loader2 className="size-4 animate-spin" />جاري التوليد…</>
            : <><Sparkles className="size-4" />توليد المحتوى</>
          }
        </Button>

        {/* Skill Prompt Preview */}
        <details className="group">
          <summary className="cursor-pointer text-xs font-bold text-[var(--fi-muted)] hover:text-[var(--fi-ink)]">
            عرض تعليمات المهارة ▾
          </summary>
          <pre className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-xl bg-[var(--fi-soft)] p-3 text-xs text-[var(--fi-muted)]">
            {skillContent}
          </pre>
        </details>
      </div>

      {/* Output Panel */}
      <div className="relative flex flex-col rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-black text-[var(--fi-ink)]">النتيجة</p>
          {output && (
            <button onClick={handleCopy} className="flex items-center gap-1 text-xs font-semibold" style={{ color: departmentColor }}>
              {copied ? <CheckCircle2 className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? 'تم النسخ' : 'نسخ الكل'}
            </button>
          )}
        </div>

        {pending && (
          <div className="flex flex-1 items-center justify-center py-20">
            <Loader2 className="size-10 animate-spin" style={{ color: departmentColor }} />
          </div>
        )}

        {!pending && output && (
          <pre className="flex-1 overflow-y-auto whitespace-pre-wrap text-sm font-semibold leading-7 text-[var(--fi-ink)]">
            {output}
          </pre>
        )}

        {!pending && !output && (
          <div className="flex flex-1 items-center justify-center py-20">
            <div className="text-center">
              <Sparkles className="mx-auto mb-3 size-10 text-[var(--fi-line)]" />
              <p className="text-sm font-semibold text-[var(--fi-muted)]">المحتوى المولّد سيظهر هنا…</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
