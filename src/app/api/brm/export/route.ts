import ExcelJS from 'exceljs'
import { jsPDF } from 'jspdf'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requireSession } from '@/shared/auth/session'
import { isManagerRole, isSuperAdmin } from '@/shared/auth/types'

type SaleRow = {
  id: string
  client_name: string | null
  client_phone: string | null
  project_name: string | null
  developer_name: string | null
  unit_code: string | null
  deal_value: number | string | null
  gross_commission: number | string | null
  broker_commission_amount: number | string | null
  company_commission_amount: number | string | null
  stage: string | null
  status: string | null
  documents_review_status: string | null
  commission_lifecycle_stage: string | null
  broker_payout_due_date: string | null
  created_at: string | null
}

const money = (value: number | string | null | undefined) =>
  new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(Number(value ?? 0))

export async function GET(request: NextRequest) {
  const session = await requireSession()
  if (!isManagerRole(session.profile.role) && !isSuperAdmin(session.profile.role) && session.profile.role !== 'account_manager') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') === 'excel' ? 'excel' : 'pdf'
  const rows = await getRows(searchParams)

  if (format === 'excel') return exportExcel(rows)
  return exportPdf(rows)
}

async function getRows(searchParams: URLSearchParams) {
  const service = createServiceRoleClient()
  let query = service
    .from('broker_sales_submissions')
    .select('id, client_name, client_phone, project_name, developer_name, unit_code, deal_value, gross_commission, broker_commission_amount, company_commission_amount, stage, status, documents_review_status, commission_lifecycle_stage, broker_payout_due_date, created_at')
    .order('created_at', { ascending: false })
    .limit(500)

  const status = searchParams.get('status')
  const stage = searchParams.get('stage')
  const lifecycle = searchParams.get('lifecycle')
  const accountManager = searchParams.get('accountManager')
  const payoutDate = searchParams.get('payoutDate')
  const developer = searchParams.get('developer')

  if (status) query = query.eq('status', status)
  if (stage) query = query.eq('stage', stage)
  if (lifecycle) query = query.eq('commission_lifecycle_stage', lifecycle)
  if (accountManager) query = query.eq('assigned_account_manager_id', accountManager)
  if (payoutDate) query = query.eq('broker_payout_due_date', payoutDate)
  if (developer) query = query.ilike('developer_name', `%${developer}%`)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as SaleRow[]
}

async function exportExcel(rows: SaleRow[]) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'FAST INVESTMENT'
  workbook.created = new Date()
  const sheet = workbook.addWorksheet('BRM Report', {
    views: [{ rightToLeft: true }],
  })

  sheet.columns = [
    { header: 'العميل', key: 'client_name', width: 24 },
    { header: 'الهاتف', key: 'client_phone', width: 18 },
    { header: 'المشروع', key: 'project_name', width: 28 },
    { header: 'المطور', key: 'developer_name', width: 22 },
    { header: 'الوحدة', key: 'unit_code', width: 16 },
    { header: 'المرحلة', key: 'stage', width: 14 },
    { header: 'الحالة', key: 'status', width: 16 },
    { header: 'حالة المستندات', key: 'documents_review_status', width: 20 },
    { header: 'دورة العمولة', key: 'commission_lifecycle_stage', width: 28 },
    { header: 'قيمة البيع', key: 'deal_value', width: 18 },
    { header: 'إجمالي العمولة', key: 'gross_commission', width: 18 },
    { header: 'عمولة الشريك', key: 'broker_commission_amount', width: 18 },
    { header: 'نصيب الشركة', key: 'company_commission_amount', width: 18 },
    { header: 'موعد الصرف', key: 'broker_payout_due_date', width: 16 },
    { header: 'تاريخ الرفع', key: 'created_at', width: 18 },
  ]

  rows.forEach((row) => {
    sheet.addRow({
      ...row,
      created_at: row.created_at ? new Date(row.created_at).toLocaleDateString('ar-EG') : '',
      deal_value: Number(row.deal_value ?? 0),
      gross_commission: Number(row.gross_commission ?? 0),
      broker_commission_amount: Number(row.broker_commission_amount ?? 0),
      company_commission_amount: Number(row.company_commission_amount ?? 0),
    })
  })

  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF102033' } }
  sheet.autoFilter = { from: 'A1', to: 'O1' }

  const buffer = await workbook.xlsx.writeBuffer()
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="brm-report-${Date.now()}.xlsx"`,
    },
  })
}

function exportPdf(rows: SaleRow[]) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  doc.setFontSize(16)
  doc.text('FAST INVESTMENT - BRM Report', 40, 40)
  doc.setFontSize(10)
  doc.text(`Generated: ${new Date().toLocaleString('en-GB')}`, 40, 58)
  doc.text(`Rows: ${rows.length}`, 40, 74)

  const startY = 100
  const rowHeight = 24
  const columns = [
    { title: 'Client', x: 40 },
    { title: 'Project', x: 160 },
    { title: 'Developer', x: 300 },
    { title: 'Stage', x: 420 },
    { title: 'Status', x: 490 },
    { title: 'Docs', x: 570 },
    { title: 'Deal', x: 660 },
    { title: 'Broker', x: 750 },
  ]

  doc.setFillColor(16, 32, 51)
  doc.rect(35, startY - 16, 790, 22, 'F')
  doc.setTextColor(255, 255, 255)
  columns.forEach((column) => doc.text(column.title, column.x, startY))

  doc.setTextColor(20, 30, 45)
  rows.slice(0, 24).forEach((row, index) => {
    const y = startY + 28 + index * rowHeight
    if (index % 2 === 0) {
      doc.setFillColor(246, 248, 250)
      doc.rect(35, y - 15, 790, 22, 'F')
    }
    doc.text(short(row.client_name), 40, y)
    doc.text(short(row.project_name), 160, y)
    doc.text(short(row.developer_name), 300, y)
    doc.text(short(row.stage), 420, y)
    doc.text(short(row.status), 490, y)
    doc.text(short(row.documents_review_status), 570, y)
    doc.text(money(row.deal_value), 660, y)
    doc.text(money(row.broker_commission_amount), 750, y)
  })

  if (rows.length > 24) {
    doc.setTextColor(120, 120, 120)
    doc.text(`Only first 24 rows are shown in PDF. Use Excel for the full ${rows.length} rows.`, 40, 565)
  }

  const arrayBuffer = doc.output('arraybuffer')
  return new NextResponse(arrayBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="brm-report-${Date.now()}.pdf"`,
    },
  })
}

function short(value: string | null | undefined) {
  const text = String(value ?? '-')
  return text.length > 18 ? `${text.slice(0, 17)}...` : text
}
