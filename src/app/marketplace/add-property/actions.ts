'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createRawClient } from '@/lib/supabase/server'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function optNum(v: FormDataEntryValue | null): number | undefined {
  if (!v || v === '') return undefined
  const n = Number(v)
  return isNaN(n) ? undefined : n
}

function optStr(v: FormDataEntryValue | null): string | null {
  const s = typeof v === 'string' ? v.trim() : null
  return s && s.length > 0 ? s : null
}

// ─── Upload helper ────────────────────────────────────────────────────────────

async function uploadFile(
  supabase: Awaited<ReturnType<typeof createRawClient>>,
  bucket: string,
  folder: string,
  file: File,
): Promise<string | null> {
  const ext = file.name.split('.').pop() ?? 'bin'
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  })
  if (error) return null
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

// ─── New comprehensive listing action ─────────────────────────────────────────

const listingSchema = z.object({
  title:         z.string().trim().min(5, 'عنوان الإعلان قصير جداً'),
  unit_type:     z.string().trim().min(1, 'اختر نوع الوحدة'),
  area_location: z.string().trim().min(1, 'أدخل الموقع / المنطقة'),
})

export async function submitListingAction(
  formData: FormData,
): Promise<{ error: string } | void> {
  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const parsed = listingSchema.safeParse({
    title:         formData.get('title'),
    unit_type:     formData.get('unit_type'),
    area_location: formData.get('area_location'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'بيانات غير مكتملة' }
  }

  // ── Upload images ──────────────────────────────────────────────────────────
  const imageFiles = formData.getAll('images').filter((f): f is File => f instanceof File && f.size > 0)
  const imageUrls: string[] = []
  for (const img of imageFiles.slice(0, 12)) {
    const url = await uploadFile(supabase, 'listing-images', user.id, img)
    if (url) imageUrls.push(url)
  }

  // ── Upload documents ───────────────────────────────────────────────────────
  const docUrls: string[] = []
  for (const key of ['contract_file', 'payment_plan_file', 'poa_file']) {
    const file = formData.get(key)
    if (file instanceof File && file.size > 0) {
      const url = await uploadFile(supabase, 'listing-docs', user.id, file)
      if (url) docUrls.push(url)
    }
  }

  // ── Upload arch files ──────────────────────────────────────────────────────
  let layoutUrl: string | null = null
  let masterplanUrl: string | null = null
  const layoutFile = formData.get('layout_file')
  if (layoutFile instanceof File && layoutFile.size > 0) {
    layoutUrl = await uploadFile(supabase, 'listing-arch', user.id, layoutFile)
  }
  const masterplanFile = formData.get('masterplan_file')
  if (masterplanFile instanceof File && masterplanFile.size > 0) {
    masterplanUrl = await uploadFile(supabase, 'listing-arch', user.id, masterplanFile)
  }

  const isFurnished = formData.get('is_furnished') === 'true'
  const isRented    = formData.get('is_rented')    === 'true'
  const totalCashPrice = optNum(formData.get('total_cash_price'))

  const { error } = await supabase.from('ads').insert({
    user_id:               user.id,
    title:                 parsed.data.title,
    property_type:         parsed.data.unit_type,
    status:                'pending',
    currency:              'EGP',

    area_location:         parsed.data.area_location,
    location:              parsed.data.area_location,
    project_id:            optStr(formData.get('project_id')),
    developer_id:          optStr(formData.get('developer_id')),
    detailed_address:      optStr(formData.get('detailed_address')),
    unit_number:           optStr(formData.get('unit_number')),

    rooms:                 optNum(formData.get('rooms')),
    bedrooms:              optNum(formData.get('rooms')),
    bathrooms:             optNum(formData.get('bathrooms')),
    area_sqm:              optNum(formData.get('area_sqm')),
    features:              optStr(formData.get('features')) ?? 'NONE',
    finishing:             optStr(formData.get('finishing')),
    is_furnished:          isFurnished,
    unit_type:             parsed.data.unit_type,
    internal_area_sqm:     optNum(formData.get('internal_area_sqm')),
    external_area_sqm:     optNum(formData.get('external_area_sqm')),

    is_rented:             isRented,
    rental_value:          isRented ? optNum(formData.get('rental_value')) : null,

    description:           optStr(formData.get('marketing_description')) ?? '',
    marketing_description: optStr(formData.get('marketing_description')),
    special_notes:         optStr(formData.get('special_notes')),

    price:                 totalCashPrice ?? 0,
    total_cash_price:      totalCashPrice,
    pricing_strategy:      optStr(formData.get('pricing_strategy')),
    down_payment:          optNum(formData.get('down_payment')),
    installment_amount:    optNum(formData.get('installment_amount')),

    images:                imageUrls,
    documents:             docUrls,
    doc_files:             docUrls,
    layout_file:           layoutUrl,
    masterplan_file:       masterplanUrl,

    is_featured: false,
    is_urgent:   false,
  })

  if (error) return { error: error.message }
}

// ─── Legacy action (kept for backward-compat) ─────────────────────────────────

export async function submitPropertyAction(formData: FormData) {
  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const title        = String(formData.get('title') ?? '').trim()
  const propertyType = String(formData.get('property_type') ?? '').trim()
  const price        = Number(formData.get('price'))
  const city         = String(formData.get('city') ?? '').trim()
  const district     = String(formData.get('district') ?? '').trim()
  const description  = String(formData.get('description') ?? '').trim()

  if (!title || !propertyType || !price || !city || !district || description.length < 20) {
    redirect(`/marketplace/add-property?error=${encodeURIComponent('بيانات الإعلان غير مكتملة')}`)
  }

  const { error } = await supabase.from('ads').insert({
    user_id:       user.id,
    title,
    description,
    property_type: propertyType,
    price,
    currency:      'EGP',
    location:      `${district}، ${city}`,
    area_sqm:      optNum(formData.get('area_sqm')) ?? null,
    bedrooms:      optNum(formData.get('bedrooms')) ?? null,
    bathrooms:     optNum(formData.get('bathrooms')) ?? null,
    images:        [],
    documents:     [],
    is_featured:   false,
    is_urgent:     false,
    status:        'pending',
  })

  if (error) redirect(`/marketplace/add-property?error=${encodeURIComponent(error.message)}`)
  redirect('/marketplace/add-property?submitted=1')
}
