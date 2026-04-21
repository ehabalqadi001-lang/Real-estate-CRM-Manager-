'use client'

import { Sparkles } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

type AiPropertyDescriptionButtonProps = {
  input: {
    projectName: string
    area: number
    bedrooms: number | null
    price: number
    finishing: string | null
    unitType?: string | null
    city?: string | null
  }
  onGenerated: (text: string) => void
}

export function AiPropertyDescriptionButton({ input, onGenerated }: AiPropertyDescriptionButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  async function generate() {
    setIsLoading(true)
    onGenerated('')

    try {
      const response = await fetch('/api/ai/property-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!response.ok || !response.body) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error ?? 'تعذر توليد الوصف')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value, { stream: true })
        onGenerated(fullText)
      }

      toast.success('تم توليد وصف الوحدة')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'تعذر توليد الوصف')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={generate}
      disabled={isLoading || !input.projectName || !input.area || !input.price}
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Sparkles className="size-4 text-blue-600" />
      {isLoading ? 'جاري التوليد...' : 'توليد وصف بالذكاء الاصطناعي'}
    </button>
  )
}
