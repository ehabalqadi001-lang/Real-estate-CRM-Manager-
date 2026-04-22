'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { requireSession } from '@/shared/auth/session'
import { isSuperAdmin } from '@/shared/auth/types'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { nullableUuid } from '@/lib/uuid'
import { ACTIVE_COMPANY_COOKIE } from './server'

export type SelectCompanyState = {
  success: boolean
  error?: string
}

export async function selectActiveCompanyAction(companyId: string): Promise<SelectCompanyState> {
  const session = await requireSession()
  if (!isSuperAdmin(session.profile.role)) {
    return { success: false, error: 'غير مصرح لك بتغيير شركة التشغيل.' }
  }

  const activeCompanyId = nullableUuid(companyId)
  if (!activeCompanyId) return { success: false, error: 'اختر شركة صحيحة.' }

  const service = createServiceRoleClient()
  const { data: company, error: companyError } = await service
    .from('companies')
    .select('id, name, is_suspended')
    .eq('id', activeCompanyId)
    .maybeSingle()

  if (companyError) return { success: false, error: companyError.message }
  if (!company) return { success: false, error: 'الشركة غير موجودة.' }
  if (company.is_suspended) return { success: false, error: 'لا يمكن اختيار شركة معلقة.' }

  const cookieStore = await cookies()
  cookieStore.set(ACTIVE_COMPANY_COOKIE, activeCompanyId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })

  const { error: userProfileError } = await service
    .from('user_profiles')
    .update({
      company_id: activeCompanyId,
    })
    .eq('id', session.user.id)

  if (userProfileError) return { success: false, error: userProfileError.message }

  await service
    .from('profiles')
    .update({
      company_name: company.name ?? null,
    })
    .eq('id', session.user.id)

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/deals')
  revalidatePath('/dashboard/erp/hr')
  revalidatePath('/dashboard/integrations')

  return { success: true }
}
