'use client'

import { useMemo, useState } from 'react'
import { flexRender, getCoreRowModel, getFilteredRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table'
import { Download, FileSpreadsheet, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CommissionRequestSheet } from './CommissionRequestSheet'
import { CommissionCalculator } from './CommissionCalculator'
import { downloadCommissionStatement } from './CommissionPdf'
import type { CommissionLeadOption, CommissionProjectOption, CommissionRateOption, CommissionRow, CommissionStatus } from './commission-types'
import { useI18n } from '@/hooks/use-i18n'

const STATUS_CLASS: Record<CommissionStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-violet-50 text-violet-700 border-violet-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  disputed: 'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
}

export function CommissionsDashboard({
  commissions,
  projects,
  agents,
  rates,
  leads,
}: {
  commissions: CommissionRow[]
  projects: CommissionProjectOption[]
  agents: Array<{ id: string; name: string }>
  rates: CommissionRateOption[]
  leads: CommissionLeadOption[]
}) {
  const { t, numLocale } = useI18n()
  const [status, setStatus] = useState('all')
  const [agent, setAgent] = useState('all')
  const [project, setProject] = useState('all')
  const [range, setRange] = useState('all')

  const STATUS_LABELS: Record<CommissionStatus, string> = {
    pending: t('قيد المراجعة', 'Under Review'),
    approved: t('معتمدة', 'Approved'),
    processing: t('طلب صرف', 'Processing'),
    paid: t('مدفوعة', 'Paid'),
    disputed: t('نزاع', 'Disputed'),
    cancelled: t('ملغاة', 'Cancelled'),
  }

  function formatMoney(value: number) {
    return `${new Intl.NumberFormat(numLocale, { maximumFractionDigits: 0 }).format(value)} ${t('ج.م', 'EGP')}`
  }

  function exportExcel(rows: CommissionRow[]) {
    const headers = [t('الصفقة', 'Deal'), t('العميل', 'Client'), t('المشروع', 'Project'), t('قيمة الصفقة', 'Deal Value'), t('نسبة العمولة', 'Commission Rate'), t('العمولة الإجمالية', 'Total Commission'), t('نصيبي', 'My Share'), t('الحالة', 'Status')]
    const body = rows.map((row) => [
      row.dealTitle,
      row.clientName,
      row.projectName,
      row.grossDealValue,
      row.commissionRate,
      row.grossCommission,
      row.agentAmount,
      STATUS_LABELS[row.status],
    ])
    const csv = [headers, ...body].map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `commissions-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = useMemo(() => commissions.filter((row) => {
    if (status !== 'all' && row.status !== status) return false
    if (agent !== 'all' && row.agentId !== agent) return false
    if (project !== 'all' && row.projectName !== project) return false
    if (range !== 'all' && !matchesRange(row.createdAt, range)) return false
    return true
  }), [agent, commissions, project, range, status])

  const summary = useMemo(() => ({
    pending: filtered.filter((row) => ['pending', 'approved', 'processing'].includes(row.status)).reduce((sum, row) => sum + row.agentAmount, 0),
    paid: filtered.filter((row) => row.status === 'paid').reduce((sum, row) => sum + row.agentAmount, 0),
    review: filtered.filter((row) => row.status === 'pending').length,
    month: filtered.filter((row) => matchesRange(row.createdAt, 'month')).reduce((sum, row) => sum + row.agentAmount, 0),
  }), [filtered])

  const columns = useMemo<ColumnDef<CommissionRow>[]>(() => [
    { header: t('الصفقة', 'Deal'), accessorKey: 'dealTitle' },
    { header: t('العميل', 'Client'), accessorKey: 'clientName' },
    { header: t('المشروع', 'Project'), accessorKey: 'projectName' },
    { header: t('قيمة الصفقة', 'Deal Value'), cell: ({ row }) => formatMoney(row.original.grossDealValue) },
    { header: t('نسبة العمولة', 'Commission Rate'), cell: ({ row }) => `${row.original.commissionRate.toLocaleString(numLocale)}٪` },
    { header: t('العمولة الإجمالية', 'Total Commission'), cell: ({ row }) => formatMoney(row.original.grossCommission) },
    { header: t('نصيبي', 'My Share'), cell: ({ row }) => <span className="font-black text-[var(--fi-emerald)]">{formatMoney(row.original.agentAmount)}</span> },
    { header: t('الحالة', 'Status'), cell: ({ row }) => <Badge className={STATUS_CLASS[row.original.status]}>{STATUS_LABELS[row.original.status]}</Badge> },
    { header: t('الإجراء', 'Action'), cell: ({ row }) => row.original.status !== 'paid' ? <CommissionRequestSheet commission={row.original} /> : <Button size="sm" variant="outline" onClick={() => downloadCommissionStatement([row.original], t('إيصال عمولة', 'Commission Receipt'))}>PDF</Button> },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [numLocale, t])

  // TanStack Table intentionally returns stable methods that React Compiler cannot memoize safely.
   
  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <section className="space-y-4" dir="rtl">
      <div className="ds-card-hover rounded-xl border border-[var(--fi-line)] bg-white p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-10 items-center justify-center rounded-lg bg-[var(--fi-soft)] text-[var(--fi-emerald)]">
                <Wallet className="size-5" />
              </span>
              <div>
                <p className="text-xs font-black text-[var(--fi-emerald)]">FAST COMMISSIONS</p>
                <h1 className="text-2xl font-black text-[var(--fi-ink)]">{t('إدارة العمولات', 'Commission Management')}</h1>
              </div>
            </div>
            <p className="mt-2 text-sm font-semibold text-[var(--fi-muted)]">{t('متابعة مستحقات الوسطاء واعتماد طلبات الصرف وتصدير كشوفات احترافية.', 'Track broker dues, approve payout requests, and export professional statements.')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <CommissionCalculator projects={projects} rates={rates} leads={leads} />
            <Button variant="outline" className="gap-2 bg-white" onClick={() => downloadCommissionStatement(filtered)}>
              <Download className="size-4" />
              PDF
            </Button>
            <Button variant="outline" className="gap-2 bg-white" onClick={() => exportExcel(filtered)}>
              <FileSpreadsheet className="size-4" />
              Excel
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Kpi label={t('إجمالي مستحق', 'Total Due')} value={formatMoney(summary.pending)} />
        <Kpi label={t('إجمالي مدفوع', 'Total Paid')} value={formatMoney(summary.paid)} />
        <Kpi label={t('قيد المراجعة', 'Under Review')} value={summary.review.toLocaleString(numLocale)} />
        <Kpi label={t('هذا الشهر', 'This Month')} value={formatMoney(summary.month)} />
      </div>

      <div className="grid gap-2 rounded-xl border border-[var(--fi-line)] bg-[var(--fi-soft)] p-3 md:grid-cols-4">
        <select className="h-10 rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-bold" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">{t('كل الحالات', 'All Statuses')}</option>
          {Object.entries(STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
        <select className="h-10 rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-bold" value={agent} onChange={(event) => setAgent(event.target.value)}>
          <option value="all">{t('كل الوسطاء', 'All Agents')}</option>
          {agents.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select className="h-10 rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-bold" value={project} onChange={(event) => setProject(event.target.value)}>
          <option value="all">{t('كل المشاريع', 'All Projects')}</option>
          {Array.from(new Set(commissions.map((row) => row.projectName).filter(Boolean))).map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
        <select className="h-10 rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-bold" value={range} onChange={(event) => setRange(event.target.value)}>
          <option value="all">{t('كل التواريخ', 'All Dates')}</option>
          <option value="week">{t('هذا الأسبوع', 'This Week')}</option>
          <option value="month">{t('هذا الشهر', 'This Month')}</option>
          <option value="quarter">{t('آخر 3 أشهر', 'Last 3 Months')}</option>
        </select>
      </div>

      <div className="ds-card-hover overflow-hidden rounded-xl border border-[var(--fi-line)] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-right text-sm">
            <thead className="bg-[var(--fi-soft)]">
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id}>
                  {group.headers.map((header) => (
                    <th key={header.id} className="px-3 py-3 font-black text-[var(--fi-muted)]">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr><td colSpan={columns.length} className="px-4 py-12 text-center font-bold text-[var(--fi-muted)]">{t('لا توجد عمولات مطابقة للفلاتر', 'No commissions match the filters')}</td></tr>
              ) : table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-t border-[var(--fi-line)]">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-3 font-semibold text-[var(--fi-ink)]">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="ds-card-hover rounded-xl border border-[var(--fi-line)] bg-white p-4">
      <p className="text-xs font-black text-[var(--fi-muted)]">{label}</p>
      <p className="mt-2 text-xl font-black text-[var(--fi-ink)]">{value}</p>
    </div>
  )
}

function matchesRange(value: string, range: string) {
  const date = new Date(value)
  const now = new Date()
  const diff = (now.getTime() - date.getTime()) / 86400000
  if (range === 'week') return diff <= 7
  if (range === 'month') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  if (range === 'quarter') return diff <= 90
  return true
}
