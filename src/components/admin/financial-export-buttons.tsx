'use client'

import { Download, FileSpreadsheet, Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export interface AdminFinancialExportRow {
  id: string
  dealId: string | null
  companyId: string | null
  status: string | null
  companyAmount: number
  grossCommission: number
  grossDealValue: number
  createdAt: string | null
  paidAt: string | null
}

export interface AdminMonthlyRevenueRow {
  month: string
  value: number
}

interface FinancialExportButtonsProps {
  rows: AdminFinancialExportRow[]
  monthly: AdminMonthlyRevenueRow[]
}

function formatEgp(value: number) {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value: string | null) {
  if (!value) return 'غير محدد'
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  const chunks: string[] = []

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize)
    chunks.push(String.fromCharCode(...chunk))
  }

  return window.btoa(chunks.join(''))
}

async function loadArabicPdfFont(doc: {
  addFileToVFS: (filename: string, data: string) => void
  addFont: (filename: string, fontName: string, fontStyle: string) => void
}) {
  const response = await fetch('/fonts/fi-arabic.ttf')
  if (!response.ok) throw new Error('تعذر تحميل الخط العربي')

  const fontBase64 = arrayBufferToBase64(await response.arrayBuffer())
  doc.addFileToVFS('fi-arabic.ttf', fontBase64)
  doc.addFont('fi-arabic.ttf', 'FIArabic', 'normal')
  doc.addFont('fi-arabic.ttf', 'FIArabic', 'bold')

  return 'FIArabic'
}

async function ensureArabicReportFont() {
  const fontFace = new FontFace('FIArabicReport', 'url(/fonts/fi-arabic.ttf)')
  const loadedFont = await fontFace.load()
  document.fonts.add(loadedFont)
  await document.fonts.ready
}

function buildPdfReportElement(params: {
  rows: AdminFinancialExportRow[]
  monthly: AdminMonthlyRevenueRow[]
  totals: { paidRevenue: number; platformRevenue: number; gmv: number }
}) {
  const root = document.createElement('section')
  root.dir = 'rtl'
  root.style.cssText = [
    'position:fixed',
    'left:-10000px',
    'top:0',
    'width:1120px',
    'min-height:794px',
    'background:#ffffff',
    'color:#0f172a',
    'font-family:FIArabicReport,Tahoma,Arial,sans-serif',
    'padding:42px',
    'box-sizing:border-box',
    'direction:rtl',
  ].join(';')

  const rowsHtml = params.rows.length > 0
    ? params.rows.map((row) => `
      <tr>
        <td>${row.id}</td>
        <td>${row.dealId ?? 'غير محدد'}</td>
        <td>${row.companyId ?? 'غير محدد'}</td>
        <td>${row.status ?? 'غير محدد'}</td>
        <td>${formatEgp(row.companyAmount)}</td>
        <td>${formatEgp(row.grossCommission)}</td>
        <td>${formatEgp(row.grossDealValue)}</td>
        <td>${formatDate(row.createdAt)}</td>
        <td>${formatDate(row.paidAt)}</td>
      </tr>
    `).join('')
    : '<tr><td colspan="9">لا توجد سجلات مالية للتصدير.</td></tr>'

  const monthlyHtml = params.monthly.length > 0
    ? params.monthly.map((row) => `
      <tr>
        <td>${row.month}</td>
        <td>${formatEgp(row.value)}</td>
      </tr>
    `).join('')
    : '<tr><td colspan="2">لا توجد بيانات شهرية.</td></tr>'

  root.innerHTML = `
    <style>
      .report-title { margin: 0; font-size: 28px; font-weight: 900; color: #050816; }
      .report-subtitle { margin: 8px 0 0; font-size: 13px; color: #64748b; }
      .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 26px 0; }
      .summary-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; background: #f8fafc; }
      .summary-label { font-size: 12px; color: #64748b; margin-bottom: 6px; }
      .summary-value { font-size: 20px; font-weight: 900; color: #050816; }
      .section-title { font-size: 16px; font-weight: 900; margin: 24px 0 10px; color: #050816; }
      table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 10px; direction: rtl; }
      th { background: #050816; color: #ffffff; font-weight: 900; padding: 9px 7px; border: 1px solid #050816; text-align: right; }
      td { padding: 8px 7px; border: 1px solid #e2e8f0; text-align: right; color: #0f172a; word-break: break-word; }
      tbody tr:nth-child(even) td { background: #f8fafc; }
      .monthly-table { width: 42%; }
      .footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 10px; text-align: center; }
    </style>
    <header>
      <h1 class="report-title">تقرير ماليات المنصة - Fast Investment CRM</h1>
      <p class="report-subtitle">تاريخ التصدير: ${new Date().toLocaleString('ar-EG')}</p>
    </header>
    <div class="summary-grid">
      <div class="summary-card"><div class="summary-label">الإيرادات المدفوعة</div><div class="summary-value">${formatEgp(params.totals.paidRevenue)}</div></div>
      <div class="summary-card"><div class="summary-label">إجمالي نصيب المنصة</div><div class="summary-value">${formatEgp(params.totals.platformRevenue)}</div></div>
      <div class="summary-card"><div class="summary-label">GMV</div><div class="summary-value">${formatEgp(params.totals.gmv)}</div></div>
    </div>
    <h2 class="section-title">الإيراد الشهري</h2>
    <table class="monthly-table">
      <thead><tr><th>الشهر</th><th>إيراد المنصة</th></tr></thead>
      <tbody>${monthlyHtml}</tbody>
    </table>
    <h2 class="section-title">تفاصيل العمولات</h2>
    <table>
      <thead>
        <tr>
          <th>رقم العمولة</th>
          <th>الصفقة</th>
          <th>الشركة</th>
          <th>الحالة</th>
          <th>نصيب المنصة</th>
          <th>العمولة</th>
          <th>قيمة الصفقة</th>
          <th>الإنشاء</th>
          <th>الدفع</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    <div class="footer">FAST INVESTMENT CRM - تقرير مالي صادر من لوحة Super Admin</div>
  `

  return root
}

export function FinancialExportButtons({ rows, monthly }: FinancialExportButtonsProps) {
  const [isExporting, setIsExporting] = useState<'excel' | 'pdf' | null>(null)
  const totals = useMemo(() => ({
    paidRevenue: rows.filter((row) => row.status === 'paid').reduce((sum, row) => sum + row.companyAmount, 0),
    platformRevenue: rows.reduce((sum, row) => sum + row.companyAmount, 0),
    gmv: rows.reduce((sum, row) => sum + row.grossDealValue, 0),
  }), [rows])

  async function exportExcel() {
    setIsExporting('excel')
    try {
      const ExcelJS = await import('exceljs')
      const workbook = new ExcelJS.Workbook()
      workbook.creator = 'Fast Investment CRM'
      workbook.created = new Date()

      const summary = workbook.addWorksheet('ملخص المنصة')
      summary.views = [{ rightToLeft: true }]
      summary.addRows([
        ['البند', 'القيمة'],
        ['إيرادات مدفوعة', totals.paidRevenue],
        ['إجمالي نصيب المنصة', totals.platformRevenue],
        ['GMV', totals.gmv],
        ['عدد السجلات', rows.length],
      ])
      summary.getColumn(1).width = 28
      summary.getColumn(2).width = 22

      const monthlySheet = workbook.addWorksheet('الإيراد الشهري')
      monthlySheet.views = [{ rightToLeft: true }]
      monthlySheet.columns = [
        { header: 'الشهر', key: 'month', width: 16 },
        { header: 'الإيراد', key: 'value', width: 18 },
      ]
      monthlySheet.addRows(monthly)

      const details = workbook.addWorksheet('تفاصيل العمولات')
      details.views = [{ rightToLeft: true }]
      details.columns = [
        { header: 'رقم العمولة', key: 'id', width: 38 },
        { header: 'الصفقة', key: 'dealId', width: 38 },
        { header: 'الشركة', key: 'companyId', width: 38 },
        { header: 'الحالة', key: 'status', width: 14 },
        { header: 'نصيب المنصة', key: 'companyAmount', width: 18 },
        { header: 'العمولة الإجمالية', key: 'grossCommission', width: 18 },
        { header: 'قيمة الصفقة', key: 'grossDealValue', width: 18 },
        { header: 'تاريخ الإنشاء', key: 'createdAt', width: 18 },
        { header: 'تاريخ الدفع', key: 'paidAt', width: 18 },
      ]
      details.addRows(rows)

      const buffer = await workbook.xlsx.writeBuffer()
      downloadBlob(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `platform-financials-${new Date().toISOString().slice(0, 10)}.xlsx`)
      toast.success('تم تصدير ملف Excel')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'فشل تصدير Excel')
    } finally {
      setIsExporting(null)
    }
  }

  async function exportPdf() {
    setIsExporting('pdf')
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ])
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
      let reportElement: HTMLElement | null = null

      try {
        await loadArabicPdfFont(doc)
      } catch {
        toast.warning('تعذر تضمين الخط داخل PDF، سيتم الاعتماد على رسم التقرير كصورة')
      }

      try {
        await ensureArabicReportFont()
        reportElement = buildPdfReportElement({ rows, monthly, totals })
        document.body.appendChild(reportElement)
        const canvas = await html2canvas(reportElement, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
          logging: false,
        })
        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()
        const imageWidth = pageWidth
        const imageHeight = (canvas.height * imageWidth) / canvas.width
        const imageData = canvas.toDataURL('image/png', 1)

        if (imageHeight <= pageHeight) {
          doc.addImage(imageData, 'PNG', 0, 0, imageWidth, imageHeight)
        } else {
          let remainingHeight = imageHeight
          let position = 0
          while (remainingHeight > 0) {
            doc.addImage(imageData, 'PNG', 0, position, imageWidth, imageHeight)
            remainingHeight -= pageHeight
            position -= pageHeight
            if (remainingHeight > 0) doc.addPage()
          }
        }
      } finally {
        reportElement?.remove()
      }

      doc.save(`platform-financials-${new Date().toISOString().slice(0, 10)}.pdf`)
      toast.success('تم تصدير ملف PDF')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'فشل تصدير PDF')
    } finally {
      setIsExporting(null)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" onClick={exportExcel} disabled={Boolean(isExporting)}>
        {isExporting === 'excel' ? <Loader2 className="size-4 animate-spin" /> : <FileSpreadsheet className="size-4" />}
        Excel
      </Button>
      <Button type="button" variant="outline" onClick={exportPdf} disabled={Boolean(isExporting)}>
        {isExporting === 'pdf' ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
        PDF
      </Button>
    </div>
  )
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
