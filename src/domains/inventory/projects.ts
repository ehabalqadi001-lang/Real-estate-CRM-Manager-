import 'server-only'

import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/shared/rbac/require-permission'
import { createServerSupabaseClient } from '@/shared/supabase/server'
import type { Developer, Project, Unit } from '@/lib/types/db'
import type { ActionResult } from '@/shared/types/action-result'

export type ProjectListItem = Project & { developers: { name: string } | null }
export type ProjectDetail = Project & { developers: Developer | null }

export interface ProjectDetailResult {
  project: ProjectDetail | null
  units: Unit[]
}

export async function getProjects(developerId?: string): Promise<ProjectListItem[]> {
  await requirePermission('project.view')
  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('projects')
    .select('*, developers(name)')
    .order('name')

  if (developerId) query = query.eq('developer_id', developerId)

  const { data } = await query
  return (data ?? []) as ProjectListItem[]
}

export async function getProject(id: string): Promise<ProjectDetailResult> {
  await requirePermission('project.view')
  const supabase = await createServerSupabaseClient()

  const [{ data: project }, { data: units }] = await Promise.all([
    supabase.from('projects').select('*, developers(*)').eq('id', id).single(),
    supabase.from('units').select('*').eq('project_id', id).order('unit_number'),
  ])

  return {
    project: project as ProjectDetail | null,
    units: (units ?? []) as Unit[],
  }
}

export async function upsertProject(input: Partial<Project> & { name: string }): Promise<ActionResult> {
  const session = await requirePermission('project.manage')
  const supabase = await createServerSupabaseClient()
  const { id, ...rest } = input
  const companyId = session.profile.company_id ?? session.user.id
  const payload = { ...rest, company_id: companyId, updated_at: new Date().toISOString() }

  if (!payload.name?.trim()) {
    return { ok: false, error: 'اسم المشروع مطلوب', code: 'VALIDATION_ERROR' }
  }

  const result = id
    ? await supabase.from('projects').update(payload).eq('id', id)
    : await supabase.from('projects').insert(payload)

  if (result.error) {
    return { ok: false, error: result.error.message, code: 'DATABASE_ERROR' }
  }

  revalidatePath('/dashboard/projects')
  revalidatePath('/dashboard/inventory')
  revalidatePath('/dashboard/inventory/projects')
  return { ok: true, data: undefined }
}
