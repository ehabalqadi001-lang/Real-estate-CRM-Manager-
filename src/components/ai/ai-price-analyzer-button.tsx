'use client'

import { BarChart3, Loader2, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { PriceAnalysisInput, PriceAnalysisResult } from '@/lib/ai/types'

type AiPriceAnalyzerButtonProps = {
  input: PriceAnalysisInput
}

export function AiPriceAnalyzerButton({ input }: AiPriceAnalyzerButtonProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<PriceAnalysisResult | null>(null)

  async function analyze() {
    setOpen(true)
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/ai/price-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error ?? 'تعذر تحليل السعر')

      setResult(payload as PriceAnalysisResult)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'تعذر تحليل السعر')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={analyze} disabled={!input.price || !input.areaSqm || isLoading}>
        {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        تحليل السعر
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-full overflow-y-auto bg-white sm:max-w-lg" dir="rtl">
          <SheetHeader>
            <SheetTitle className="text-right text-xl font-black text-[var(--fi-ink)]">تحليل السعر بالذكاء الاصطناعي</SheetTitle>
            <SheetDescription className="text-right font-semibold">
              مقارنة الوحدة مع الوحدات المشابهة في قاعدة البيانات.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-4 pb-6">
            {isLoading ? (
              <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-[var(--fi-line)] bg-[var(--fi-soft)] text-center">
                <Loader2 className="mb-3 size-7 animate-spin text-[var(--fi-emerald)]" />
                <p className="text-sm font-black text-[var(--fi-ink)]">جاري تحليل السعر...</p>
              </div>
            ) : result ? (
              <>
                <div className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-soft)] p-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="size-5 text-[var(--fi-emerald)]" />
                    <p className="font-black text-[var(--fi-ink)]">{result.verdict}</p>
                  </div>
                  <p className="mt-3 text-sm font-semibold leading-7 text-[var(--fi-muted)]">{result.summary}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Metric label="فرق السعر" value={`${result.differencePercentage.toLocaleString('ar-EG')}%`} />
                  <Metric label="عدد المقارنات" value={result.comparableCount.toLocaleString('ar-EG')} />
                </div>

                <div className="rounded-lg border border-[var(--fi-line)] bg-white p-4">
                  <p className="mb-3 text-sm font-black text-[var(--fi-ink)]">توصيات عملية</p>
                  <div className="space-y-2">
                    {result.recommendations.length > 0 ? result.recommendations.map((recommendation) => (
                      <p key={recommendation} className="rounded-lg bg-[var(--fi-soft)] px-3 py-2 text-sm font-semibold leading-7 text-[var(--fi-ink)]">
                        {recommendation}
                      </p>
                    )) : (
                      <p className="text-sm font-semibold text-[var(--fi-muted)]">لا توجد توصيات إضافية.</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-[var(--fi-line)] bg-[var(--fi-soft)] p-6 text-center text-sm font-bold text-[var(--fi-muted)]">
                اضغط تحليل السعر لعرض النتيجة.
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--fi-line)] bg-white p-3">
      <p className="text-xs font-black text-[var(--fi-muted)]">{label}</p>
      <p className="mt-2 text-lg font-black text-[var(--fi-ink)]">{value}</p>
    </div>
  )
}
