'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, X, UploadCloud, FileSpreadsheet } from 'lucide-react'
import { getDevelopersList, addSingleUnit, addBulkUnits } from '@/app/dashboard/inventory/actions'
import readXlsxFile from 'read-excel-file/browser'

type CellValue = string | number | boolean | Date | null

function parseCsvRows(text: string): CellValue[][] {
  const rows: string[][] = []
  let row: string[] = []
  let value = ''
  let quoted = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    const next = text[i + 1]

    if (char === '"' && quoted && next === '"') {
      value += '"'
      i += 1
    } else if (char === '"') {
      quoted = !quoted
    } else if (char === ',' && !quoted) {
      row.push(value)
      value = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1
      row.push(value)
      if (row.some((cell) => cell.trim())) rows.push(row)
      row = []
      value = ''
    } else {
      value += char
    }
  }

  row.push(value)
  if (row.some((cell) => cell.trim())) rows.push(row)
  return rows
}

function rowsToRecords(rows: CellValue[][]) {
  const [headerRow, ...dataRows] = rows
  if (!headerRow) return []

  const headers = headerRow.map((header) => String(header ?? '').trim())

  return dataRows
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? null])))
    .filter((record) => Object.values(record).some((value) => value !== null && String(value).trim() !== '')) as Record<string, unknown>[]
}

async function parseSpreadsheetFile(file: File) {
  const fileName = file.name.toLowerCase()

  if (fileName.endsWith('.csv')) {
    return rowsToRecords(parseCsvRows(await file.text()))
  }

  if (!fileName.endsWith('.xlsx')) {
    throw new Error('صيغة الملف غير مدعومة. استخدم CSV أو XLSX.')
  }

  const rows = await readXlsxFile(file)
  return rowsToRecords(rows as unknown as CellValue[][])
}

export default function AddUnitButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single')
  const [developers, setDevelopers] = useState<{id: string, name: string}[]>([])
  const [selectedDeveloper, setSelectedDeveloper] = useState('')
  const [excelFile, setExcelFile] = useState<File | null>(null)

  useEffect(() => {
    if (!isOpen) return
    let mounted = true
    async function load() {
      try {
        const data = await getDevelopersList()
        if (mounted) setDevelopers(data)
      } catch { /* silently ignore */ }
    }
    load()
    return () => { mounted = false }
  }, [isOpen])

  // معالجة الإضافة اليدوية
  const handleSingleSubmit = async (e: { preventDefault(): void; currentTarget: HTMLFormElement }) => {
    e.preventDefault()
    setLoading(true)
    try {
      await addSingleUnit(new FormData(e.currentTarget))
      setIsOpen(false)
    } catch (error: unknown) {
      alert('خطأ: ' + (error instanceof Error ? error.message : 'خطأ غير معروف'))
    } finally {
      setLoading(false)
    }
  }

  // معالجة رفع وتفكيك ملف الإكسيل
  const handleBulkSubmit = async (e: { preventDefault(): void; currentTarget: HTMLFormElement }) => {
    e.preventDefault()
    if (!excelFile || !selectedDeveloper) return alert('يرجى اختيار المطور وملف الإكسيل')
    
    setLoading(true)
    try {
      const jsonData = await parseSpreadsheetFile(excelFile)
      await addBulkUnits(jsonData, selectedDeveloper)
      setIsOpen(false)
      alert(`تمت إضافة ${jsonData.length} وحدة بنجاح!`)
    } catch (error: unknown) {
      alert('حدث خطأ أثناء معالجة الملف: ' + (error instanceof Error ? error.message : 'خطأ غير معروف'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg shadow-md transition-all">
        <PlusIcon size={18} />
        <span className="text-sm font-medium">إضافة للمخزون</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header & Tabs */}
            <div className="bg-slate-50 border-b border-slate-100">
              <div className="p-4 flex justify-between items-center">
                <h3 className="font-bold text-slate-900">إضافة وحدات عقارية</h3>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
              </div>
              <div className="flex border-t border-slate-200">
                <button onClick={() => setActiveTab('single')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'single' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:bg-slate-100'}`}>إضافة يدوية</button>
                <button onClick={() => setActiveTab('bulk')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex justify-center items-center gap-2 ${activeTab === 'bulk' ? 'border-green-600 text-green-600 bg-white' : 'border-transparent text-slate-500 hover:bg-slate-100'}`}><FileSpreadsheet size={16}/> رفع Excel</button>
              </div>
            </div>

            {/* محتوى التبويبات */}
            <div className="p-6">
              {activeTab === 'single' ? (
                <form onSubmit={handleSingleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">اسم الوحدة / الكود</label>
                    <input name="unit_name" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">المطور العقاري</label>
                    <select name="developer_id" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white">
                      <option value="">-- اختر المطور --</option>
                      {developers.map(dev => <option key={dev.id} value={dev.id}>{dev.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">نوع الوحدة</label>
                      <input name="unit_type" placeholder="شقة، فيلا، تجاري..." required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">السعر</label>
                      <input name="price" type="number" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold mt-2">{loading ? 'جاري الحفظ...' : 'حفظ الوحدة'}</button>
                </form>
              ) : (
                <form onSubmit={handleBulkSubmit} className="space-y-4 text-center">
                  <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-xs font-medium mb-4 text-right">
                    💡 <strong>صيغة الإكسيل المطلوبة:</strong> يجب أن يحتوي الملف على أعمدة بهذه الأسماء (اسم الوحدة، النوع، السعر).
                  </div>
                  <div className="text-right">
                    <label className="block text-xs font-bold text-slate-700 mb-1">إلى أي مطور تنتمي هذه الوحدات؟</label>
                    <select required value={selectedDeveloper} onChange={(e) => setSelectedDeveloper(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 text-sm bg-white">
                      <option value="">-- اختر المطور أولاً --</option>
                      {developers.map(dev => <option key={dev.id} value={dev.id}>{dev.name}</option>)}
                    </select>
                  </div>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 hover:bg-slate-50 transition-colors relative mt-4">
                    <input type="file" accept=".xlsx,.csv" required onChange={(e) => setExcelFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <UploadCloud size={40} className="mx-auto text-slate-400 mb-3" />
                    <p className="text-sm font-bold text-slate-700">{excelFile ? excelFile.name : 'اسحب ملف Excel هنا أو اضغط للاختيار'}</p>
                  </div>
                  <button type="submit" disabled={loading || !excelFile} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold disabled:bg-slate-300 transition-colors">{loading ? 'جاري رفع ومعالجة الملف...' : 'استيراد الوحدات'}</button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
