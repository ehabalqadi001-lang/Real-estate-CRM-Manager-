'use client'

import { useState, useRef } from 'react'
import { Upload, X, FileText, CheckCircle, AlertCircle, Download } from 'lucide-react'
import { bulkImportLeads } from '@/app/dashboard/leads/import-actions'

interface ParsedRow {
  name: string
  phone: string
  email?: string
  source?: string
  expected_value?: number
  notes?: string
  status?: string
}

const REQUIRED_COLS = ['name', 'phone']
const ALL_COLS = ['name', 'phone', 'email', 'source', 'expected_value', 'notes', 'status']

// Map Arabic header names to internal keys
const HEADER_MAP: Record<string, string> = {
  'الاسم': 'name', 'name': 'name',
  'الهاتف': 'phone', 'phone': 'phone', 'mobile': 'phone', 'رقم الهاتف': 'phone',
  'البريد': 'email', 'email': 'email', 'البريد الإلكتروني': 'email',
  'المصدر': 'source', 'source': 'source',
  'القيمة المتوقعة': 'expected_value', 'expected_value': 'expected_value', 'value': 'expected_value',
  'ملاحظات': 'notes', 'notes': 'notes',
  'الحالة': 'status', 'status': 'status',
}

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (!lines.length) return { headers: [], rows: [] }
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  const rows = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = values[i] ?? '' })
    return row
  })
  return { headers, rows }
}

function mapRow(row: Record<string, string>): ParsedRow | null {
  const mapped: Record<string, string> = {}
  for (const [rawKey, value] of Object.entries(row)) {
    const key = HEADER_MAP[rawKey.toLowerCase()] ?? HEADER_MAP[rawKey]
    if (key) mapped[key] = value
  }
  if (!mapped.name || !mapped.phone) return null
  return {
    name: mapped.name,
    phone: mapped.phone,
    email: mapped.email,
    source: mapped.source,
    expected_value: mapped.expected_value ? Number(mapped.expected_value.replace(/,/g, '')) : undefined,
    notes: mapped.notes,
    status: mapped.status,
  }
}

export default function BulkImportButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [parsed, setParsed] = useState<ParsedRow[]>([])
  const [invalidCount, setInvalidCount] = useState(0)
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ imported: number } | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    setFileName(file.name)
    setResult(null)
    setError('')
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const { rows } = parseCSV(text)
      const valid: ParsedRow[] = []
      let invalid = 0
      rows.forEach(r => {
        const m = mapRow(r)
        if (m) valid.push(m)
        else invalid++
      })
      setParsed(valid)
      setInvalidCount(invalid)
    }
    reader.readAsText(file, 'UTF-8')
  }

  const handleImport = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await bulkImportLeads(parsed)
      setResult(res)
      setParsed([])
      setFileName('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطأ غير معروف')
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    const header = 'name,phone,email,source,expected_value,notes,status'
    const sample = 'أحمد محمد,01012345678,ahmed@example.com,Facebook,500000,,Fresh Leads'
    const blob = new Blob([`\uFEFF${header}\n${sample}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'leads-template.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const reset = () => {
    setParsed([]); setFileName(''); setResult(null); setError(''); setInvalidCount(0)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg transition-all text-sm font-bold">
        <Upload size={15} /> استيراد CSV
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Upload size={16} className="text-blue-600" /> استيراد عملاء بالجملة (CSV)
              </h3>
              <button onClick={() => { setIsOpen(false); reset() }} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <div className="p-5 space-y-4">
              {/* Download template */}
              <button onClick={downloadTemplate}
                className="w-full border-2 border-dashed border-blue-200 bg-blue-50 text-blue-700 rounded-xl py-3 flex items-center justify-center gap-2 text-sm font-bold hover:bg-blue-100 transition-colors">
                <Download size={15} /> تحميل قالب CSV النموذجي
              </button>

              {/* Column reference */}
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs font-bold text-slate-600 mb-2">الأعمدة المدعومة:</p>
                <div className="flex flex-wrap gap-1">
                  {ALL_COLS.map(c => (
                    <span key={c}
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${REQUIRED_COLS.includes(c) ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-600'}`}>
                      {c} {REQUIRED_COLS.includes(c) ? '*' : ''}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">* الأعمدة المطلوبة — الباقي اختياري</p>
              </div>

              {/* File drop zone */}
              {!fileName ? (
                <label className="block cursor-pointer">
                  <input ref={fileRef} type="file" accept=".csv" className="sr-only"
                    onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} />
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/40 transition-colors">
                    <FileText size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-600 text-sm">اسحب الملف هنا أو انقر للاختيار</p>
                    <p className="text-xs text-slate-400 mt-1">CSV فقط — حد أقصى 500 سجل</p>
                  </div>
                </label>
              ) : (
                <div className="border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <FileText size={15} className="text-blue-500" /> {fileName}
                    </span>
                    <button onClick={reset} className="text-slate-400 hover:text-red-500 transition-colors"><X size={15} /></button>
                  </div>
                  <div className="flex gap-3 text-xs font-bold">
                    <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg">
                      {parsed.length} سجل صالح
                    </span>
                    {invalidCount > 0 && (
                      <span className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg">
                        {invalidCount} سجل محذوف (ناقص اسم/هاتف)
                      </span>
                    )}
                  </div>

                  {/* Preview table */}
                  {parsed.length > 0 && (
                    <div className="mt-3 max-h-40 overflow-y-auto rounded-lg border border-slate-100">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 sticky top-0">
                          <tr>
                            <th className="p-2 text-right font-bold text-slate-500">الاسم</th>
                            <th className="p-2 text-right font-bold text-slate-500">الهاتف</th>
                            <th className="p-2 text-right font-bold text-slate-500">المصدر</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {parsed.slice(0, 10).map((r, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="p-2 font-semibold text-slate-700">{r.name}</td>
                              <td className="p-2 text-slate-500 font-mono">{r.phone}</td>
                              <td className="p-2 text-slate-400">{r.source ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {parsed.length > 10 && (
                        <p className="text-center text-xs text-slate-400 py-2">
                          +{parsed.length - 10} سجل آخر...
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Success / Error */}
              {result && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle size={20} className="text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-emerald-800">تم الاستيراد بنجاح!</p>
                    <p className="text-sm text-emerald-600">تم إضافة {result.imported} عميل محتمل</p>
                  </div>
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                  <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
                  <p className="text-sm font-bold text-red-700">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button onClick={() => { setIsOpen(false); reset() }}
                  className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors">
                  إغلاق
                </button>
                {parsed.length > 0 && !result && (
                  <button onClick={handleImport} disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? 'جاري الاستيراد...' : <><Upload size={15} /> استيراد {parsed.length} سجل</>}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
