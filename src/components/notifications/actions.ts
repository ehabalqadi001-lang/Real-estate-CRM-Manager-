'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'

export async function updateUnitDetails(formData: FormData) {
  // التحقق من الجلسة (يمكنك إضافة التحقق من الصلاحيات هنا لاحقاً)
  await requireSession()
  const supabase = await createServerClient()
  
  const unitId = formData.get('unitId') as string
  const projectId = formData.get('projectId') as string
  const price = Number(formData.get('price'))
  const status = formData.get('status') as string

  if (!unitId || !projectId) throw new Error('بيانات الوحدة مفقودة')

  const { error } = await supabase
    .from('units')
    .update({ price, status })
    .eq('id', unitId)

  if (error) throw new Error(error.message)

  // تحديث الكاش لصفحة الوحدات وصفحة المخطط التفاعلي
  revalidatePath(`/dashboard/projects/${projectId}/units`)
  revalidatePath(`/dashboard/projects/${projectId}/masterplan`)
}