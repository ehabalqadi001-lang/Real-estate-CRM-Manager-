'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'

export default function ExportReportsPdfButton({ fileName = 'fast-investment-report.pdf' }: { fileName?: string }) {
  const [pending, setPending] = useState(false)

  async function handleExport() {
    const node = document.querySelector<HTMLElement>('[data-report-export]')
    if (!node || pending) return

    setPending(true)
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])
      const canvas = await html2canvas(node, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      })
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const ratio = Math.min((pageWidth - 48) / canvas.width, (pageHeight - 48) / canvas.height)
      const width = canvas.width * ratio
      const height = canvas.height * ratio
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', (pageWidth - width) / 2, 24, width, height)
      pdf.save(fileName)
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={pending}
      className="flex items-center gap-2 rounded-xl border border-[var(--fi-line)] bg-[var(--fi-soft)] px-4 py-2.5 text-sm font-bold text-[var(--fi-ink)] transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
      aria-label="تصدير التقرير PDF"
    >
      {pending ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Download size={14} aria-hidden="true" />}
      {pending ? 'جاري التصدير...' : 'تصدير PDF'}
    </button>
  )
}
