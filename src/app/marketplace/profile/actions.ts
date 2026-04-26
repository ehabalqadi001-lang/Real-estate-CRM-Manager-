'use server'

import { revalidatePath } from 'next/cache'
import { createRawClient } from '@/lib/supabase/server'

export async function updateClientProfileAction(formData: FormData) {
  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'يجب تسجيل الدخول أولا' }

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role, account_type, status, is_active')
    .eq('id', user.id)
    .maybeSingle()

  const currentRole = String(currentProfile?.role ?? '').trim()
  const currentAccountType = String(currentProfile?.account_type ?? '').trim()
  const shouldKeepClientIdentity =
    !currentRole ||
    currentRole === 'CLIENT' ||
    currentRole === 'client' ||
    currentRole === 'viewer' ||
    currentAccountType === 'client'

  const payload = {
    full_name: String(formData.get('full_name') ?? '').trim(),
    email: user.email ?? null,
    phone: String(formData.get('phone') ?? '').trim(),
    region: String(formData.get('region') ?? '').trim(),
    preferred_contact: String(formData.get('preferred_contact') ?? 'whatsapp'),
    client_notes: String(formData.get('client_notes') ?? '').trim() || null,
    role: shouldKeepClientIdentity ? 'CLIENT' : currentProfile?.role,
    account_type: shouldKeepClientIdentity ? 'client' : currentProfile?.account_type,
    status: shouldKeepClientIdentity ? 'active' : currentProfile?.status,
    is_active: shouldKeepClientIdentity ? true : currentProfile?.is_active,
    updated_at: new Date().toISOString(),
  }

  if (!payload.full_name || !payload.phone) {
    return { success: false, message: 'الاسم ورقم الهاتف مطلوبان' }
  }

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, ...payload }, { onConflict: 'id' })

  if (error) return { success: false, message: error.message }

  revalidatePath('/marketplace/profile')
  return { success: true, message: 'تم حفظ البيانات الشخصية' }
}

export async function createClientSupportTicketAction(formData: FormData) {
  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'يجب تسجيل الدخول أولا' }

  const title = String(formData.get('title') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const category = String(formData.get('category') ?? 'marketplace').trim()
  const priority = String(formData.get('priority') ?? 'medium').trim()

  if (!title || !description) {
    return { success: false, message: 'عنوان الطلب ووصفه مطلوبان' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, tenant_id')
    .eq('id', user.id)
    .maybeSingle()

  const { error } = await supabase.from('support_tickets').insert({
    user_id: user.id,
    company_id: profile?.company_id ?? profile?.tenant_id ?? null,
    title,
    description,
    category,
    priority: ['low', 'medium', 'high', 'critical'].includes(priority) ? priority : 'medium',
    status: 'open',
  })

  if (error) return { success: false, message: error.message }

  revalidatePath('/marketplace/profile')
  return { success: true, message: 'تم إرسال طلب الدعم وسيتم متابعته من خدمة العملاء' }
}

export async function promoteAdAction(formData: FormData) {
  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'يجب تسجيل الدخول أولا' }

  const adId = String(formData.get('ad_id') ?? '').trim()
  const kind = String(formData.get('kind') ?? 'regular') as 'regular' | 'premium'

  if (!adId) return { success: false, message: 'معرّف الإعلان مطلوب' }
  if (!['regular', 'premium'].includes(kind)) return { success: false, message: 'نوع الترقية غير صالح' }

  const listingType = kind === 'premium' ? 'PREMIUM' : 'REGULAR'

  const { data: costs } = await supabase
    .from('ad_cost_config')
    .select('regular_points_cost, premium_points_cost')
    .eq('id', true)
    .maybeSingle()

  const pointsCost = kind === 'premium'
    ? Number(costs?.premium_points_cost ?? 50)
    : Number(costs?.regular_points_cost ?? 10)

  const { error } = await supabase.rpc('spend_points_for_marketplace_ad', {
    p_user_id: user.id,
    p_ad_id: adId,
    p_listing_type: listingType,
  })

  if (error) {
    if (error.message.includes('Insufficient')) return { success: false, message: 'رصيد النقاط غير كافٍ لترقية هذا الإعلان' }
    return { success: false, message: error.message }
  }

  revalidatePath('/marketplace/profile')
  return {
    success: true,
    message: kind === 'premium'
      ? `تم ترقية الإعلان إلى Premium (${pointsCost} نقطة)`
      : `تم تفعيل الإعلان Regular (${pointsCost} نقطة)`,
  }
}

export async function changeClientPasswordAction(formData: FormData) {
  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'يجب تسجيل الدخول أولا' }

  const nextPassword = String(formData.get('new_password') ?? '')
  const confirmPassword = String(formData.get('confirm_password') ?? '')

  if (nextPassword.length < 8) {
    return { success: false, message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' }
  }

  if (nextPassword !== confirmPassword) {
    return { success: false, message: 'تأكيد كلمة المرور غير مطابق' }
  }

  const { error } = await supabase.auth.updateUser({ password: nextPassword })
  if (error) return { success: false, message: error.message }

  return { success: true, message: 'تم تغيير كلمة المرور بنجاح' }
}
