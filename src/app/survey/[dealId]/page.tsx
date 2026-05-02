'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Star, CheckCircle } from 'lucide-react'

function StarRating({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  const [hover, setHover] = useState(0)
  return (
    <div>
      <p className="text-sm font-bold text-slate-700 mb-2">{label}</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-110">
            <Star size={32}
              className={`transition-colors ${n <= (hover || value) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} />
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-1">
        {['', 'سيء جداً', 'سيء', 'متوسط', 'جيد', 'ممتاز'][value] ?? ''}
      </p>
    </div>
  )
}

export default function SurveyPage() {
  const { dealId } = useParams<{ dealId: string }>()
  const [score, setScore] = useState(0)
  const [agentRating, setAgentRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault()
    if (!score) return
    setLoading(true)
    await fetch('/api/satisfaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deal_id: dealId, score, agent_rating: agentRating || null, comment }),
    })
    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6" dir="rtl">
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-md w-full">
          <CheckCircle size={56} className="text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-900 mb-2">شكراً على تقييمك!</h2>
          <p className="text-slate-500 text-sm">رأيك يساعدنا على تحسين خدمتنا لك وللعملاء القادمين.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-900 p-4 sm:p-6 text-center">
          <h1 className="text-xl font-black text-white">FAST INVESTMENT</h1>
          <p className="text-slate-400 text-sm mt-1">استطلاع رضا العملاء</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <h2 className="font-black text-slate-900 mb-1">كيف تقيّم تجربتك الشاملة معنا؟</h2>
            <p className="text-xs text-slate-400 mb-3">من 1 (سيء جداً) إلى 5 (ممتاز)</p>
            <StarRating value={score} onChange={setScore} label="التقييم العام" />
          </div>

          <div>
            <StarRating value={agentRating} onChange={setAgentRating} label="تقييم مسؤول المبيعات" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">تعليق (اختياري)</label>
            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
              placeholder="شاركنا رأيك أو أي ملاحظات..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-400 resize-none" />
          </div>

          <button type="submit" disabled={!score || loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-50">
            {loading ? 'جاري الإرسال...' : 'إرسال التقييم'}
          </button>
        </form>
      </div>
    </div>
  )
}
