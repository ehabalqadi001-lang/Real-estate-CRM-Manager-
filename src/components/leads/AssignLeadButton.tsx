'use client'

import { useState } from 'react'
import { UserCheck, Loader2 } from 'lucide-react'

export default function AssignLeadButton({ leadId }: { leadId: string }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  const handleAssign = async () => {
    setLoading(true)
    setResult('')
    try {
      const res = await fetch('/api/leads/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, strategy: 'least-loaded' }),
      })
      const data = await res.json() as { ok?: boolean; assignedTo?: string; error?: string }
      if (data.ok) {
        setResult(`تم التعيين لـ: ${data.assignedTo}`)
        setTimeout(() => window.location.reload(), 1200)
      } else {
        setResult(data.error ?? 'خطأ')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={handleAssign} disabled={loading}
        className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50">
        {loading ? <Loader2 size={12} className="animate-spin" /> : <UserCheck size={12} />}
        تعيين تلقائي
      </button>
      {result && <span className="text-xs text-teal-700 font-bold">{result}</span>}
    </div>
  )
}
