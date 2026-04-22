'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/shared/supabase/server'
import { requireSession } from '@/shared/auth/session'
import { nullableUuid } from '@/lib/uuid'

export type CellActionState = {
  ok: boolean
  message: string
}

const MANAGER_ROLES = new Set([
  'super_admin',
  'platform_admin',
  'company_owner',
  'company_admin',
  'sales_director',
  'branch_manager',
  'team_leader',
  'admin',
  'company',
])

export async function createWorkCellAction(_prev: CellActionState, formData: FormData): Promise<CellActionState> {
  try {
    const session = await requireSession()
    if (!MANAGER_ROLES.has(session.profile.role)) {
      return { ok: false, message: 'غير مصرح لك بإدارة خلايا العمل.' }
    }

    const companyId = nullableUuid(session.profile.company_id) ?? nullableUuid(session.profile.tenant_id)
    if (!companyId) {
      return { ok: false, message: 'اربط حساب المدير بشركة صالحة قبل إنشاء خلية عمل.' }
    }

    const nameAr = String(formData.get('nameAr') ?? '').trim()
    const leaderId = nullableUuid(formData.get('leaderId'))
    const monthlyGmvTarget = money(formData.get('monthlyGmvTarget'))
    const monthlyLeadsTarget = integer(formData.get('monthlyLeadsTarget'))
    const conversionTargetPct = money(formData.get('conversionTargetPct'))

    if (!nameAr) return { ok: false, message: 'اكتب اسم الخلية أولاً.' }

    const supabase = await createServerSupabaseClient()
    const { data: cell, error } = await supabase
      .from('work_cells')
      .insert({
        company_id: companyId,
        name: slugify(nameAr),
        name_ar: nameAr,
        leader_id: leaderId,
        monthly_gmv_target: monthlyGmvTarget,
        monthly_leads_target: monthlyLeadsTarget,
        conversion_target_pct: conversionTargetPct,
        status: 'active',
      })
      .select('id')
      .single()

    if (error) throw error

    if (leaderId) {
      await supabase.from('work_cell_members').upsert(
        {
          cell_id: cell.id,
          company_id: companyId,
          user_id: leaderId,
          role_in_cell: 'leader',
          status: 'active',
        },
        { onConflict: 'cell_id,user_id' },
      )
    }

    revalidatePath('/dashboard/cells')
    return { ok: true, message: 'تم إنشاء خلية العمل بنجاح.' }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'تعذر إنشاء الخلية.' }
  }
}

function money(value: FormDataEntryValue | null) {
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0
}

function integer(value: FormDataEntryValue | null) {
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric >= 0 ? Math.trunc(numeric) : 0
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80)
}
