import 'server-only'

import { createServerClient } from '@/lib/supabase/server'

type TenantRecord = Record<string, unknown> & { tenant_id?: string }

export async function createTenantScopedClient(tenantId: string) {
  const supabase = await createServerClient()

  return {
    tenantId,
    supabase,
    fromTenant(table: string) {
      return {
        select(columns = '*', options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }) {
          return supabase.from(table).select(columns, options).eq('tenant_id', tenantId)
        },
        insert(values: TenantRecord | TenantRecord[]) {
          const rows = Array.isArray(values) ? values : [values]
          return supabase.from(table).insert(rows.map((row) => ({ ...row, tenant_id: tenantId })))
        },
        update(values: TenantRecord) {
          return supabase.from(table).update({ ...values, tenant_id: tenantId }).eq('tenant_id', tenantId)
        },
        delete() {
          return supabase.from(table).delete().eq('tenant_id', tenantId)
        },
      }
    },
  }
}
