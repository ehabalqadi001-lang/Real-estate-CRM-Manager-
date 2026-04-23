'use client'

import { Loader2 } from 'lucide-react'
import { useFormStatus } from 'react-dom'

export default function SubmitLeadButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-2xl bg-[#00C27C] p-3.5 font-black text-white shadow-lg shadow-[#00C27C]/20 transition-colors hover:bg-[#009F64] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <span className="inline-flex items-center justify-center gap-2">
          <Loader2 className="size-4 animate-spin" />
          جاري الإضافة...
        </span>
      ) : (
        'تأكيد وإضافة العميل'
      )}
    </button>
  )
}
