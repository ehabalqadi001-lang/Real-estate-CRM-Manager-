'use server'

import { revalidatePath } from 'next/cache'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requireSession } from '@/shared/auth/session'
import type { AppRole } from '@/shared/auth/types'

export type AccountActionState = { ok: boolean; message: string }

const ALLOWED: AppRole[] = [
  'super_admin', 'platform_admin', 'finance_manager',
  'company_admin', 'company_owner',
]

export async function createAccountAction(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  try {
    const session = await requireSession()
    if (!ALLOWED.includes(session.profile.role as AppRole)) {
      return { ok: false, message: 'غير مصرح بإنشاء حسابات.' }
    }

    const service   = createServiceRoleClient()
    const companyId = session.profile.company_id ?? session.profile.tenant_id

    const accountCode = String(formData.get('accountCode') ?? '').trim()
    const accountName = String(formData.get('accountName') ?? '').trim()
    const accountType = String(formData.get('accountType') ?? '').trim()
    const parentId    = String(formData.get('parentId') ?? '').trim() || null
    const description = String(formData.get('description') ?? '').trim()

    if (!accountCode || !accountName || !accountType) {
      return { ok: false, message: 'كود الحساب، الاسم، والنوع مطلوبة.' }
    }

    const { count } = await service
      .from('chart_of_accounts')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('account_code', accountCode)

    if ((count ?? 0) > 0) {
      return { ok: false, message: `كود الحساب ${accountCode} موجود بالفعل.` }
    }

    const { error } = await service.from('chart_of_accounts').insert({
      company_id:   companyId,
      account_code: accountCode,
      account_name: accountName,
      account_type: accountType,
      parent_id:    parentId,
      description:  description || null,
      balance:      0,
      is_active:    true,
    })
    if (error) throw error

    revalidatePath('/dashboard/erp/finance/accounts')
    revalidatePath('/dashboard/erp/finance')
    return { ok: true, message: `تم إنشاء الحساب ${accountCode} — ${accountName} بنجاح.` }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'حدث خطأ.' }
  }
}
