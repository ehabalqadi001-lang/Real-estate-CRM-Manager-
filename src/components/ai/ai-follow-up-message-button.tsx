'use client'

import { MessageSquareText, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

type AiFollowUpMessageButtonProps = {
  clientName: string
  dealStage: string
  lastContactDate: string | null
  propertyInterest: string | null
  objections: string | null
}

export function AiFollowUpMessageButton(props: AiFollowUpMessageButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function generate() {
    setIsLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/ai/follow-up-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(props),
      })

      if (!response.ok || !response.body) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error ?? 'تعذر توليد الرسالة')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value, { stream: true })
        setMessage(fullText)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'تعذر توليد الرسالة')
    } finally {
      setIsLoading(false)
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(message)
    toast.success('تم نسخ رسالة المتابعة')
  }

  return (
    <div className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-soft)] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-black text-[var(--fi-ink)]">رسالة متابعة ذكية</p>
        <Button type="button" variant="outline" size="sm" onClick={generate} disabled={isLoading}>
          <Sparkles className="size-4" />
          {isLoading ? 'جاري الاقتراح...' : 'اقتراح رسالة متابعة'}
        </Button>
      </div>
      {message ? (
        <div className="mt-3 space-y-2">
          <p className="rounded-lg border border-[var(--fi-line)] bg-white p-3 text-sm font-semibold leading-7 text-[var(--fi-ink)]">
            {message}
          </p>
          <Button type="button" variant="outline" size="sm" onClick={copy}>
            <MessageSquareText className="size-4" />
            نسخ للواتساب
          </Button>
        </div>
      ) : null}
    </div>
  )
}
