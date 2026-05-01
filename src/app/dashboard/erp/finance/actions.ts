'use server'

import { revalidatePath } from 'next/cache'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requireSession } from '@/shared/auth/session'
import type { AppRole } from '@/shared/auth/types'

export type FinanceActionState = { ok: boolean; message: string }

const ALLOWED_ROLES: AppRole[] = ['super_admin', 'platform_admin', 'finance_manager', 'finance_officer']

export async function createJournalEntryAction(
  _prev: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  try {
    const session = await requireSession()
    if (!ALLOWED_ROLES.includes(session.profile.role as AppRole)) {
      return { ok: false, message: 'غير مصرح بإنشاء قيود محاسبية.' }
    }

    const service = createServiceRoleClient()
    const companyId = session.profile.company_id ?? session.profile.tenant_id

    const description = String(formData.get('description') ?? '').trim()
    const entryDate   = String(formData.get('entryDate') ?? '').trim()
    const debitAccId  = String(formData.get('debitAccountId') ?? '').trim()
    const creditAccId = String(formData.get('creditAccountId') ?? '').trim()
    const amount      = Number(formData.get('amount') ?? 0)

    if (!description || !entryDate || !debitAccId || !creditAccId || amount <= 0) {
      return { ok: false, message: 'يرجى تعبئة جميع الحقول المطلوبة.' }
    }
    if (debitAccId === creditAccId) {
      return { ok: false, message: 'لا يمكن أن يكون الحساب المدين والدائن نفس الحساب.' }
    }

    // Auto-generate entry number: JE-YYYYMM-XXXX
    const prefix = `JE-${entryDate.slice(0, 7).replace('-', '')}`
    const { count } = await service
      .from('journal_entries')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .like('entry_number', `${prefix}%`)
    const seq = String((count ?? 0) + 1).padStart(4, '0')
    const entryNumber = `${prefix}-${seq}`

    const { data: je, error: jeErr } = await service
      .from('journal_entries')
      .insert({
        company_id: companyId,
        entry_number: entryNumber,
        description,
        entry_date: entryDate,
        total_debit: amount,
        is_posted: false,
        created_by: session.user.id,
      })
      .select('id')
      .single()

    if (jeErr || !je) throw jeErr ?? new Error('فشل إنشاء القيد')

    const { error: linesErr } = await service.from('journal_lines').insert([
      { journal_entry_id: je.id, account_id: debitAccId,  debit: amount, credit: 0,      description },
      { journal_entry_id: je.id, account_id: creditAccId, debit: 0,      credit: amount, description },
    ])

    if (linesErr) throw linesErr

    revalidatePath('/dashboard/erp/finance')
    return { ok: true, message: `تم إنشاء القيد ${entryNumber} بنجاح.` }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'حدث خطأ.' }
  }
}
