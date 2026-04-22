import readXlsxFile from 'read-excel-file/node'

export type CellValue = string | number | boolean | Date | null
export type ParsedInventoryRow = Record<string, CellValue>

const HEADER_ALIASES: Record<string, string> = {
  developer: 'developer_name',
  developer_name: 'developer_name',
  'اسم المطور': 'developer_name',
  المطور: 'developer_name',
  project: 'project_name',
  project_name: 'project_name',
  'اسم المشروع': 'project_name',
  المشروع: 'project_name',
  unit: 'unit_number',
  unit_number: 'unit_number',
  'رقم الوحدة': 'unit_number',
  الوحدة: 'unit_number',
  building: 'building',
  المبنى: 'building',
  floor: 'floor_number',
  floor_number: 'floor_number',
  الدور: 'floor_number',
  الطابق: 'floor_number',
  type: 'unit_type',
  unit_type: 'unit_type',
  'نوع الوحدة': 'unit_type',
  area: 'area_sqm',
  area_sqm: 'area_sqm',
  المساحة: 'area_sqm',
  price: 'price',
  السعر: 'price',
  status: 'status',
  الحالة: 'status',
  down_payment: 'down_payment',
  المقدم: 'down_payment',
  monthly_installment: 'monthly_installment',
  القسط: 'monthly_installment',
  installment_years: 'installment_years',
  'سنوات التقسيط': 'installment_years',
}

export async function parseInventoryFile(file: File) {
  const fileName = file.name.toLowerCase()

  if (fileName.endsWith('.csv')) {
    return rowsToRecords(parseCsvRows(await file.text()))
  }

  if (fileName.endsWith('.xlsx')) {
    const rows = await readXlsxFile(Buffer.from(await file.arrayBuffer()))
    return rowsToRecords(rows as unknown as CellValue[][])
  }

  throw new Error('صيغة الملف غير مدعومة. ارفع ملف CSV أو XLSX فقط.')
}

export function mapInventoryRow(row: ParsedInventoryRow) {
  const mapped = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [canonicalHeader(key), normalizeCellValue(value)]),
  )

  return normalizeMappedInventoryRow(mapped)
}

export function mapInventoryRowWithMapping(row: ParsedInventoryRow, mapping: Record<string, string>) {
  const mapped = Object.fromEntries(
    Object.entries(row).map(([key, value]) => {
      const target = mapping[key] || canonicalHeader(key)
      return [target, normalizeCellValue(value)]
    }),
  )

  return normalizeMappedInventoryRow(mapped)
}

function normalizeMappedInventoryRow(mapped: Record<string, unknown>) {
  return {
    developer_name: stringValue(mapped.developer_name),
    project_name: stringValue(mapped.project_name),
    unit_number: stringValue(mapped.unit_number),
    building: stringValue(mapped.building),
    floor_number: numberValue(mapped.floor_number),
    unit_type: normalizeUnitType(stringValue(mapped.unit_type)),
    area_sqm: numberValue(mapped.area_sqm),
    price: numberValue(mapped.price),
    status: normalizeStatus(stringValue(mapped.status)),
    down_payment: numberValue(mapped.down_payment),
    monthly_installment: numberValue(mapped.monthly_installment),
    installment_years: numberValue(mapped.installment_years),
  }
}

export function detectMapping(headers: string[]) {
  return Object.fromEntries(headers.map((header) => [header, canonicalHeader(header)]))
}

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

  const headers = headerRow.map((header) => String(header ?? '').trim()).filter(Boolean)

  return dataRows
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? null])) as ParsedInventoryRow)
    .filter((record) => Object.values(record).some((value) => value !== null && String(value).trim() !== ''))
}

function canonicalHeader(header: string) {
  const normalized = header.trim().toLowerCase().replace(/\s+/g, '_')
  return HEADER_ALIASES[normalized] ?? HEADER_ALIASES[header.trim()] ?? normalized
}

function normalizeCellValue(value: CellValue | undefined) {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'string') return value.trim()
  return value ?? null
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim()
}

function numberValue(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  const numeric = Number(String(value).replace(/,/g, ''))
  return Number.isFinite(numeric) ? numeric : null
}

function normalizeStatus(value: string) {
  const normalized = value.trim().toLowerCase()
  const map: Record<string, string> = {
    available: 'available',
    متاح: 'available',
    reserved: 'reserved',
    محجوز: 'reserved',
    sold: 'sold',
    مباع: 'sold',
    held: 'held',
    محتجز: 'held',
  }

  return map[normalized] ?? 'available'
}

function normalizeUnitType(value: string) {
  const normalized = value.trim().toLowerCase()
  const map: Record<string, string> = {
    apartment: 'apartment',
    شقة: 'apartment',
    villa: 'villa',
    فيلا: 'villa',
    duplex: 'duplex',
    دوبلكس: 'duplex',
    penthouse: 'penthouse',
    studio: 'studio',
    office: 'office',
    مكتب: 'office',
    shop: 'shop',
    محل: 'shop',
    chalet: 'chalet',
    شاليه: 'chalet',
    townhouse: 'townhouse',
  }

  return map[normalized] ?? 'apartment'
}
