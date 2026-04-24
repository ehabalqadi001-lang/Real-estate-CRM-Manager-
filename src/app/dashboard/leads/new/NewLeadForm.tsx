'use client'

import { useRef, type ReactNode } from 'react'

export function NewLeadForm({ action, children }: { action: (formData: FormData) => Promise<void>; children: ReactNode }) {
  const submittingRef = useRef(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (submittingRef.current) {
      e.preventDefault()
      return
    }
    submittingRef.current = true
    // Reset after 10s in case the server action redirect fails for some reason
    setTimeout(() => { submittingRef.current = false }, 10_000)
  }

  return (
    <form action={action} onSubmit={handleSubmit} className="space-y-5">
      {children}
    </form>
  )
}
