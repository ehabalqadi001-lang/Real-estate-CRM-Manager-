'use server'

import { revalidatePath } from 'next/cache'
import { createRawClient } from '@/lib/supabase/server'
import { requirePermission } from '@/shared/rbac/require-permission'
import * as XLSX from 'xlsx'

type ImportResult = { inserted: number; updated: number; errors: string[] }

// ── Developers ───────────────────────────────────────────────
export async function importDevelopersAction(formData: FormData): Promise<ImportResult> {
  await requirePermission('inventory.import')
  const supabase = await createRawClient()

  const file = formData.get('file') as File | null
  if (!file) return { inserted: 0, updated: 0, errors: ['لم يتم رفع ملف'] }

  const buffer = Buffer.from(await file.arrayBuffer())
  const wb = XLSX.read(buffer, { type: 'buffer' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null })

  const records = rows.map((r) => ({
    name:        String(r['name'] ?? r['الاسم'] ?? r['اسم المطور'] ?? '').trim(),
    description: String(r['description'] ?? r['الوصف'] ?? '').trim() || null,
    phone:       String(r['phone'] ?? r['الهاتف'] ?? '').trim() || null,
    address:     String(r['address'] ?? r['العنوان'] ?? '').trim() || null,
  })).filter((r) => r.name)

  if (!records.length) return { inserted: 0, updated: 0, errors: ['لا توجد بيانات صالحة في الملف'] }

  const { error, data } = await supabase
    .from('developers')
    .upsert(records, { onConflict: 'name', ignoreDuplicates: false })
    .select('id')

  if (error) return { inserted: 0, updated: 0, errors: [error.message] }

  revalidatePath('/admin/data-entry')
  return { inserted: data?.length ?? records.length, updated: 0, errors: [] }
}

// ── Projects ─────────────────────────────────────────────────
export async function importProjectsAction(formData: FormData): Promise<ImportResult> {
  await requirePermission('inventory.import')
  const supabase = await createRawClient()

  const file = formData.get('file') as File | null
  if (!file) return { inserted: 0, updated: 0, errors: ['لم يتم رفع ملف'] }

  const buffer = Buffer.from(await file.arrayBuffer())
  const wb = XLSX.read(buffer, { type: 'buffer' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null })

  const errors: string[] = []
  const records = rows.map((r, i) => {
    const name = String(r['name'] ?? r['اسم المشروع'] ?? '').trim()
    if (!name) { errors.push(`صف ${i + 2}: اسم المشروع مطلوب`); return null }
    return {
      name,
      description:    String(r['description'] ?? r['الوصف'] ?? '').trim() || null,
      location:       String(r['location'] ?? r['الموقع'] ?? '').trim() || null,
      total_units:    Number(r['total_units'] ?? r['عدد الوحدات'] ?? 0) || 0,
      status:         String(r['status'] ?? r['الحالة'] ?? 'available').trim(),
    }
  }).filter(Boolean)

  if (!records.length) return { inserted: 0, updated: 0, errors: ['لا توجد بيانات صالحة'].concat(errors) }

  const { error, data } = await supabase
    .from('projects')
    .upsert(records as object[], { onConflict: 'name', ignoreDuplicates: false })
    .select('id')

  if (error) return { inserted: 0, updated: 0, errors: [error.message, ...errors] }

  revalidatePath('/admin/data-entry')
  return { inserted: data?.length ?? records.length, updated: 0, errors }
}

// ── Units (Inventory) ────────────────────────────────────────
export async function importUnitsAction(formData: FormData): Promise<ImportResult> {
  await requirePermission('inventory.import')
  const supabase = await createRawClient()

  const file = formData.get('file') as File | null
  if (!file) return { inserted: 0, updated: 0, errors: ['لم يتم رفع ملف'] }

  const buffer = Buffer.from(await file.arrayBuffer())
  const wb = XLSX.read(buffer, { type: 'buffer' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null })

  const errors: string[] = []
  const records = rows.map((r, i) => {
    const unit_number = String(r['unit_number'] ?? r['رقم الوحدة'] ?? '').trim()
    if (!unit_number) { errors.push(`صف ${i + 2}: رقم الوحدة مطلوب`); return null }
    return {
      unit_number,
      floor:        Number(r['floor'] ?? r['الطابق'] ?? 0) || 0,
      area_sqm:     Number(r['area_sqm'] ?? r['المساحة'] ?? 0) || null,
      price:        Number(r['price'] ?? r['السعر'] ?? 0) || null,
      status:       String(r['status'] ?? r['الحالة'] ?? 'available').trim(),
      bedrooms:     Number(r['bedrooms'] ?? r['غرف'] ?? 0) || null,
      bathrooms:    Number(r['bathrooms'] ?? r['حمامات'] ?? 0) || null,
    }
  }).filter(Boolean)

  if (!records.length) return { inserted: 0, updated: 0, errors: ['لا توجد بيانات صالحة'].concat(errors) }

  const { error, data } = await supabase
    .from('units')
    .upsert(records as object[], { onConflict: 'unit_number', ignoreDuplicates: false })
    .select('id')

  if (error) return { inserted: 0, updated: 0, errors: [error.message, ...errors] }

  revalidatePath('/admin/data-entry')
  return { inserted: data?.length ?? records.length, updated: 0, errors }
}
