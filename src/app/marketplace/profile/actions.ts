'use server'

import { revalidatePath } from 'next/cache'
import { createRawClient } from '@/lib/supabase/server'

export async function updateClientProfileAction(formData: FormData) {
  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'يجب تسجيل الدخول أولا' }

  const payload = {
    full_name: String(formData.get('full_name') ?? '').trim(),
    phone: String(formData.get('phone') ?? '').trim(),
    region: String(formData.get('region') ?? '').trim(),
    preferred_contact: String(formData.get('preferred_contact') ?? 'whatsapp'),
    client_notes: String(formData.get('client_notes') ?? '').trim() || null,
    updated_at: new Date().toISOString(),
  }

  if (!payload.full_name || !payload.phone) {
    return { success: false, message: 'الاسم ورقم الهاتف مطلوبان' }
  }

  const { error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', user.id)

  if (error) return { success: false, message: error.message }

  revalidatePath('/marketplace/profile')
  return { success: true, message: 'تم حفظ البيانات الشخصية' }
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
