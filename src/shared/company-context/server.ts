import 'server-only'

import { cookies } from 'next/headers'
import type { AppSession } from '@/shared/auth/types'
import { isSuperAdmin } from '@/shared/auth/types'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { nullableUuid } from '@/lib/uuid'

export const ACTIVE_COMPANY_COOKIE = 'fi_active_company_id'

export type CompanyOption = {
  id: string
  name: string
  slug: string | null
  logoUrl: string | null
  brandColor: string | null
  isSuspended: boolean
}

export type CompanyContext = {
  companyId: string | null
  companyName: string | null
  options: CompanyOption[]
}

export async function getActiveCompanyContext(session: AppSession): Promise<CompanyContext> {
  const profileCompanyId = nullableUuid(session.profile.company_id) ?? nullableUuid(session.profile.tenant_id)

  if (!isSuperAdmin(session.profile.role)) {
    return {
      companyId: profileCompanyId,
      companyName: session.profile.tenant_name ?? null,
      options: [],
    }
  }

  const options = await listCompanyOptions()
  const cookieStore = await cookies()
  const cookieCompanyId = nullableUuid(cookieStore.get(ACTIVE_COMPANY_COOKIE)?.value)
  const selectedCompanyId = cookieCompanyId ?? profileCompanyId ?? options[0]?.id ?? null
  const selectedCompany = options.find((company) => company.id === selectedCompanyId) ?? null

  return {
    companyId: selectedCompany?.id ?? selectedCompanyId,
    companyName: selectedCompany?.name ?? session.profile.tenant_name ?? null,
    options,
  }
}

export async function listCompanyOptions(): Promise<CompanyOption[]> {
  const service = createServiceRoleClient()
  const { data, error } = await service
    .from('companies')
    .select('id, name, slug, logo_url, primary_brand_color, is_suspended')
    .order('name', { ascending: true })
    .limit(500)

  if (error) throw new Error(error.message)

  return (data ?? [])
    .filter((company) => nullableUuid(company.id))
    .map((company) => ({
      id: company.id,
      name: company.name ?? `شركة ${String(company.id).slice(0, 8)}`,
      slug: company.slug ?? null,
      logoUrl: company.logo_url ?? null,
      brandColor: company.primary_brand_color ?? null,
      isSuspended: Boolean(company.is_suspended),
    }))
}
