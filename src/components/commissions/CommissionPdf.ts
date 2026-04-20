import jsPDF from 'jspdf'
import type { CommissionRow } from './commission-types'

export function downloadCommissionStatement(rows: CommissionRow[], title = 'كشف العمولات') {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  let y = 48

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(18)
  pdf.text('FAST INVESTMENT CRM', pageWidth - 48, y, { align: 'right' })
  y += 26
  pdf.setFontSize(14)
  pdf.text(title, pageWidth - 48, y, { align: 'right' })
  y += 24
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.text(new Date().toLocaleDateString('ar-EG'), pageWidth - 48, y, { align: 'right' })
  y += 28

  const totals = rows.reduce((acc, row) => {
    acc.gross += row.grossCommission
    acc.agent += row.agentAmount
    acc.company += row.companyAmount
    return acc
  }, { gross: 0, agent: 0, company: 0 })

  pdf.setFont('helvetica', 'bold')
  pdf.text(`Gross: ${formatNumber(totals.gross)} EGP`, 48, y)
  pdf.text(`Agent: ${formatNumber(totals.agent)} EGP`, 48, y + 16)
  pdf.text(`Company: ${formatNumber(totals.company)} EGP`, 48, y + 32)
  y += 62

  pdf.setFontSize(9)
  rows.forEach((row, index) => {
    if (y > 730) {
      pdf.addPage()
      y = 48
    }
    pdf.setFont('helvetica', 'bold')
    pdf.text(`${index + 1}. ${row.agentName}`, pageWidth - 48, y, { align: 'right' })
    pdf.setFont('helvetica', 'normal')
    pdf.text(`${row.dealTitle} | ${row.projectName}`, pageWidth - 48, y + 14, { align: 'right' })
    pdf.text(`Deal: ${formatNumber(row.grossDealValue)} | Rate: ${row.commissionRate}% | Net: ${formatNumber(row.agentAmount)} EGP`, pageWidth - 48, y + 28, { align: 'right' })
    pdf.text(`Status: ${row.status} | Date: ${new Date(row.createdAt).toLocaleDateString('ar-EG')}`, pageWidth - 48, y + 42, { align: 'right' })
    y += 66
  })

  pdf.save(`fast-investment-commissions-${Date.now()}.pdf`)
}

export function downloadSingleCommissionPdf(row: CommissionRow) {
  downloadCommissionStatement([row], `Commission Statement - ${row.agentName}`)
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)
}
