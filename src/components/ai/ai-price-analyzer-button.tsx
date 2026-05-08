'use client'

import { BarChart3, Loader2, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { PriceAnalysisInput, PriceAnalysisResult } from '@/lib/ai/types'
import { useI18n } from '@/hooks/use-i18n'

type AiPriceAnalyzerButtonProps = {
  input: PriceAnalysisInput
}

export function AiPriceAnalyzerButton({ input }: AiPriceAnalyzerButtonProps) {
  const { t, numLocale } = useI18n()
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
      if (!response.ok) throw new Error(payload?.error ?? t('تعذر تحليل السعر', 'Failed to analyze price'))

      setResult(payload as PriceAnalysisResult)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('تعذر تحليل السعر', 'Failed to analyze price'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={analyze} disabled={!input.price || !input.areaSqm || isLoading}>
        {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        {t('تحليل السعر', 'Analyze Price')}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-full overflow-y-auto bg-white sm:max-w-lg" dir="rtl">
          <SheetHeader>
            <SheetTitle className="text-right text-xl font-black text-[var(--fi-ink)]">{t('تحليل السعر بالذكاء الاصطناعي', 'AI Price Analysis')}</SheetTitle>
            <SheetDescription className="text-right font-semibold">
              {t('مقارنة الوحدة مع الوحدات المشابهة في قاعدة البيانات.', 'Comparing the unit with similar units in the database.')}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-4 pb-6">
            {isLoading ? (
              <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-[var(--fi-line)] bg-[var(--fi-soft)] text-center">
                <Loader2 className="mb-3 size-7 animate-spin text-[var(--fi-emerald)]" />
                <p className="text-sm font-black text-[var(--fi-ink)]">{t('جاري تحليل السعر...', 'Analyzing price...')}</p>
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
                  <Metric label={t('فرق السعر', 'Price Difference')} value={`${result.differencePercentage.toLocaleString(numLocale)}%`} />
                  <Metric label={t('عدد المقارنات', 'Comparisons')} value={result.comparableCount.toLocaleString(numLocale)} />
                </div>

                <div className="rounded-lg border border-[var(--fi-line)] bg-white p-4">
                  <p className="mb-3 text-sm font-black text-[var(--fi-ink)]">{t('توصيات عملية', 'Practical Recommendations')}</p>
                  <div className="space-y-2">
                    {result.recommendations.length > 0 ? result.recommendations.map((recommendation) => (
                      <p key={recommendation} className="rounded-lg bg-[var(--fi-soft)] px-3 py-2 text-sm font-semibold leading-7 text-[var(--fi-ink)]">
                        {recommendation}
                      </p>
                    )) : (
                      <p className="text-sm font-semibold text-[var(--fi-muted)]">{t('لا توجد توصيات إضافية.', 'No additional recommendations.')}</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-[var(--fi-line)] bg-[var(--fi-soft)] p-6 text-center text-sm font-bold text-[var(--fi-muted)]">
                {t('اضغط تحليل السعر لعرض النتيجة.', 'Click Analyze Price to view results.')}
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
