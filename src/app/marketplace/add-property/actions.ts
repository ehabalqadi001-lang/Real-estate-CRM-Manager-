'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createRawClient } from '@/lib/supabase/server'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_DOC_BYTES = 10 * 1024 * 1024
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const DOC_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/octet-stream'])

const listingSchema = z.object({
  title: z.string().trim().min(8, 'عنوان الإعلان يجب أن يكون 8 أحرف على الأقل'),
  area_location: z.string().trim().min(1, 'المنطقة / الموقع مطلوب'),
  unit_type: z.enum(['سكني', 'تجاري', 'إداري', 'فندقي', 'طبي'], { error: 'اختر نوع الوحدة' }),
  features: z.enum(['ROOF', 'GARDEN', 'NONE']).default('NONE'),
  finishing: z.enum(['تشطيب كامل', 'نصف تشطيب', 'طوب أحمر']).optional().or(z.literal('')),
  pricing_strategy: z.enum(['كاش', 'أقساط', 'تكملة أقساط'], { error: 'اختر طريقة البيع' }),
  is_furnished: z.boolean(),
  is_rented: z.boolean(),
  project_id: z.string().uuid().optional().nullable(),
  developer_id: z.string().uuid().optional().nullable(),
  detailed_address: z.string().trim().optional().nullable(),
  unit_number: z.string().trim().optional().nullable(),
  rooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  area_sqm: z.number().positive().optional(),
  internal_area_sqm: z.number().positive().optional(),
  external_area_sqm: z.number().positive().optional(),
  rental_value: z.number().min(0).optional(),
  special_notes: z.string().trim().optional().nullable(),
  marketing_description: z.string().trim().optional().nullable(),
  down_payment: z.number().min(0).optional(),
  installment_amount: z.number().min(0).optional(),
  total_cash_price: z.number().min(1, 'السعر الإجمالي مطلوب'),
}).superRefine((value, ctx) => {
  if (value.unit_type === 'تجاري' && (!value.internal_area_sqm || !value.external_area_sqm)) {
    ctx.addIssue({ code: 'custom', message: 'المساحة الداخلية والخارجية مطلوبة للوحدات التجارية' })
  }

  if (value.is_rented && value.rental_value == null) {
    ctx.addIssue({ code: 'custom', message: 'قيمة الإيجار مطلوبة إذا كانت الوحدة مؤجرة' })
  }

  if (value.pricing_strategy !== 'كاش' && (value.down_payment == null || value.installment_amount == null)) {
    ctx.addIssue({ code: 'custom', message: 'المقدم وقيمة القسط مطلوبان عند اختيار الأقساط' })
  }
})

function optionalString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? '').trim()
  return value.length > 0 ? value : null
}

function optionalNumber(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? '').trim()
  if (!raw) return undefined
  const value = Number(raw)
  return Number.isFinite(value) ? value : undefined
}

function optionalUuid(formData: FormData, key: string) {
  const value = optionalString(formData, key)
  return value || null
}

function listingType(formData: FormData) {
  const value = String(formData.get('listing_type') ?? 'REGULAR').toUpperCase()
  return value === 'PREMIUM' ? 'PREMIUM' : 'REGULAR'
}

async function uploadFile(
  supabase: Awaited<ReturnType<typeof createRawClient>>,
  bucket: string,
  folder: string,
  file: File,
  publicUrl: boolean,
) {
  const ext = file.name.split('.').pop() ?? 'bin'
  const path = `${folder}/${crypto.randomUUID()}.${ext}`
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  })

  if (error) throw new Error(error.message)
  if (!publicUrl) return data.path

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
  return urlData.publicUrl
}

function assertFile(file: File, allowedTypes: Set<string>, maxBytes: number, label: string) {
  if (file.size > maxBytes) throw new Error(`${label} أكبر من الحد المسموح`)
  if (!allowedTypes.has(file.type || 'application/octet-stream')) throw new Error(`${label} بنوع ملف غير مدعوم`)
}

export async function submitListingAction(formData: FormData): Promise<{ error: string } | void> {
  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const imageFiles = formData.getAll('images').filter((file): file is File => file instanceof File && file.size > 0)
  if (imageFiles.length === 0) return { error: 'يجب رفع صورة واحدة على الأقل للوحدة' }
  if (imageFiles.length > 12) return { error: 'الحد الأقصى للصور هو 12 صورة' }

  try {
    imageFiles.forEach((file) => assertFile(file, IMAGE_TYPES, MAX_IMAGE_BYTES, 'صورة الوحدة'))

    const payload = listingSchema.parse({
      title: optionalString(formData, 'title') ?? '',
      area_location: optionalString(formData, 'area_location') ?? '',
      unit_type: optionalString(formData, 'unit_type') ?? '',
      features: optionalString(formData, 'features') ?? 'NONE',
      finishing: optionalString(formData, 'finishing') ?? '',
      pricing_strategy: optionalString(formData, 'pricing_strategy') ?? '',
      is_furnished: formData.get('is_furnished') === 'true',
      is_rented: formData.get('is_rented') === 'true',
      project_id: optionalUuid(formData, 'project_id'),
      developer_id: optionalUuid(formData, 'developer_id'),
      detailed_address: optionalString(formData, 'detailed_address'),
      unit_number: optionalString(formData, 'unit_number'),
      rooms: optionalNumber(formData, 'rooms'),
      bathrooms: optionalNumber(formData, 'bathrooms'),
      area_sqm: optionalNumber(formData, 'area_sqm'),
      internal_area_sqm: optionalNumber(formData, 'internal_area_sqm'),
      external_area_sqm: optionalNumber(formData, 'external_area_sqm'),
      rental_value: optionalNumber(formData, 'rental_value'),
      special_notes: optionalString(formData, 'special_notes'),
      marketing_description: optionalString(formData, 'marketing_description'),
      down_payment: optionalNumber(formData, 'down_payment'),
      installment_amount: optionalNumber(formData, 'installment_amount'),
      total_cash_price: optionalNumber(formData, 'total_cash_price'),
    })

    const imageUrls: string[] = []
    for (const image of imageFiles) {
      imageUrls.push(await uploadFile(supabase, 'listing-images', user.id, image, true))
    }

    const docFiles: string[] = []
    for (const key of ['contract_file', 'payment_plan_file', 'poa_file']) {
      const file = formData.get(key)
      if (file instanceof File && file.size > 0) {
        assertFile(file, DOC_TYPES, MAX_DOC_BYTES, 'مستند الوحدة')
        docFiles.push(await uploadFile(supabase, 'listing-docs', user.id, file, false))
      }
    }

    let layoutFile: string | null = null
    let masterplanFile: string | null = null
    const layout = formData.get('layout_file')
    const masterplan = formData.get('masterplan_file')

    if (layout instanceof File && layout.size > 0) {
      assertFile(layout, DOC_TYPES, MAX_DOC_BYTES, 'ملف Layout')
      layoutFile = await uploadFile(supabase, 'listing-arch', user.id, layout, false)
    }

    if (masterplan instanceof File && masterplan.size > 0) {
      assertFile(masterplan, DOC_TYPES, MAX_DOC_BYTES, 'ملف Masterplan')
      masterplanFile = await uploadFile(supabase, 'listing-arch', user.id, masterplan, false)
    }

    const description = payload.marketing_description || payload.special_notes || payload.title

    const selectedListingType = listingType(formData)

    const { data: ad, error } = await supabase.from('ads').insert({
      user_id: user.id,
      title: payload.title,
      description,
      property_type: payload.unit_type,
      status: 'pending',
      currency: 'EGP',
      listing_kind: 'resale',
      seller_type: 'individual',
      area_location: payload.area_location,
      location: payload.area_location,
      project_id: payload.project_id,
      developer_id: payload.developer_id,
      detailed_address: payload.detailed_address,
      unit_number: payload.unit_number,
      rooms: payload.rooms,
      bedrooms: payload.rooms,
      bathrooms: payload.bathrooms,
      area_sqm: payload.area_sqm,
      features: payload.features,
      finishing: payload.finishing || null,
      is_furnished: payload.is_furnished,
      unit_type: payload.unit_type,
      internal_area_sqm: payload.unit_type === 'تجاري' ? payload.internal_area_sqm : null,
      external_area_sqm: payload.unit_type === 'تجاري' ? payload.external_area_sqm : null,
      is_rented: payload.is_rented,
      rental_value: payload.is_rented ? payload.rental_value : null,
      marketing_description: payload.marketing_description,
      special_notes: payload.special_notes,
      price: payload.total_cash_price,
      total_cash_price: payload.total_cash_price,
      pricing_strategy: payload.pricing_strategy,
      down_payment: payload.pricing_strategy === 'كاش' ? null : payload.down_payment,
      installment_amount: payload.pricing_strategy === 'كاش' ? null : payload.installment_amount,
      images: imageUrls,
      documents: docFiles,
      doc_files: docFiles,
      layout_file: layoutFile,
      masterplan_file: masterplanFile,
      listing_type: selectedListingType,
      is_featured: selectedListingType === 'PREMIUM',
      is_urgent: false,
    })
      .select('id')
      .single()

    if (error) return { error: error.message }

    const { error: spendError } = await supabase.rpc('spend_points_for_marketplace_ad', {
      p_user_id: user.id,
      p_ad_id: ad.id,
      p_listing_type: selectedListingType,
    })

    if (spendError) {
      await supabase.from('ads').delete().eq('id', ad.id).eq('user_id', user.id)
      return { error: `${spendError.message}. Please buy points before publishing this ad.` }
    }
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message ?? 'بيانات غير مكتملة' }
    return { error: error instanceof Error ? error.message : 'فشل إرسال الإعلان' }
  }
}

export async function submitPropertyAction(formData: FormData) {
  const result = await submitListingAction(formData)
  if (result?.error) redirect(`/marketplace/add-property?error=${encodeURIComponent(result.error)}`)
  redirect('/marketplace/add-property?submitted=1')
}
