'use server'

import { revalidatePath } from 'next/cache'
import { createRawClient } from '@/lib/supabase/server'

const R = '/admin/marketplace/appearance'

export async function addTickerItemAction(formData: FormData) {
  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'غير مصرح' }

  const type = String(formData.get('type') ?? 'text') as 'text' | 'logo' | 'launch'
  const content = String(formData.get('content') ?? '').trim()
  const developerName = String(formData.get('developer_name') ?? '').trim()
  const badgeColor = String(formData.get('badge_color') ?? '#10b981').trim()
  const logoFile = formData.get('logo_file') as File | null

  if (type === 'logo' && !developerName) return { success: false, message: 'اسم المطور مطلوب' }
  if ((type === 'text' || type === 'launch') && !content) return { success: false, message: 'النص مطلوب' }

  let logoUrl: string | null = null

  if (type === 'logo' && logoFile && logoFile.size > 0) {
    const ext = logoFile.name.split('.').pop() ?? 'png'
    const path = `ticker-logos/${Date.now()}-${developerName.replace(/\s+/g, '-')}.${ext}`
    const { error: uploadErr } = await supabase.storage
      .from('marketplace-assets')
      .upload(path, logoFile, { upsert: true, contentType: logoFile.type })
    if (uploadErr) return { success: false, message: `فشل رفع الصورة: ${uploadErr.message}` }
    const { data: { publicUrl } } = supabase.storage.from('marketplace-assets').getPublicUrl(path)
    logoUrl = publicUrl
  }

  const { data: maxOrder } = await supabase
    .from('marketplace_ticker')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { error } = await supabase.from('marketplace_ticker').insert({
    type,
    content: content || null,
    logo_url: logoUrl,
    developer_name: developerName || null,
    badge_color: badgeColor,
    display_order: (maxOrder?.display_order ?? 0) + 1,
    created_by: user.id,
  })

  if (error) return { success: false, message: error.message }

  revalidatePath(R)
  revalidatePath('/marketplace')
  return { success: true }
}

export async function toggleTickerItemAction(id: string, isActive: boolean) {
  const supabase = await createRawClient()
  const { error } = await supabase
    .from('marketplace_ticker')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { success: false, message: error.message }
  revalidatePath(R)
  revalidatePath('/marketplace')
  return { success: true }
}

export async function deleteTickerItemAction(id: string) {
  const supabase = await createRawClient()
  const { error } = await supabase.from('marketplace_ticker').delete().eq('id', id)
  if (error) return { success: false, message: error.message }
  revalidatePath(R)
  revalidatePath('/marketplace')
  return { success: true }
}

export async function reorderTickerItemAction(id: string, direction: 'up' | 'down') {
  const supabase = await createRawClient()
  const { data: items } = await supabase
    .from('marketplace_ticker')
    .select('id, display_order')
    .order('display_order')

  if (!items) return { success: false, message: 'فشل تحميل العناصر' }

  const idx = items.findIndex((i) => i.id === id)
  if (idx === -1) return { success: false, message: 'العنصر غير موجود' }

  const swapIdx = direction === 'up' ? idx - 1 : idx + 1
  if (swapIdx < 0 || swapIdx >= items.length) return { success: true }

  const current = items[idx]
  const swap = items[swapIdx]

  await Promise.all([
    supabase.from('marketplace_ticker').update({ display_order: swap.display_order }).eq('id', current.id),
    supabase.from('marketplace_ticker').update({ display_order: current.display_order }).eq('id', swap.id),
  ])

  revalidatePath(R)
  revalidatePath('/marketplace')
  return { success: true }
}
