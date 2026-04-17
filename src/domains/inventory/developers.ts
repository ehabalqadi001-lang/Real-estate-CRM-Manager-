import 'server-only'

import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/shared/rbac/require-permission'
import { createServerSupabaseClient } from '@/shared/supabase/server'
import type { Developer, Project } from '@/lib/types/db'
import type { ActionResult } from '@/shared/types/action-result'

export interface DeveloperDetailResult {
  developer: Developer | null
  projects: (Project & { units?: { count: number }[] })[]
}

export async function getDevelopers(): Promise<Developer[]> {
  await requirePermission('developer.view')
  const supabase = await createServerSupabaseClient()

  const { data } = await supabase
    .from('developers')
    .select('*')
    .order('name')

  return (data ?? []) as Developer[]
}

export async function getDeveloper(id: string): Promise<DeveloperDetailResult> {
  await requirePermission('developer.view')
  const supabase = await createServerSupabaseClient()

  const [{ data: developer }, { data: projects }] = await Promise.all([
    supabase.from('developers').select('*').eq('id', id).single(),
    supabase.from('projects').select('*, units(count)').eq('developer_id', id).order('name'),
  ])

  return {
    developer: developer as Developer | null,
    projects: (projects ?? []) as (Project & { units?: { count: number }[] })[],
  }
}

export async function upsertDeveloper(input: Partial<Developer> & { name: string }): Promise<ActionResult> {
  await requirePermission('developer.manage')
  const supabase = await createServerSupabaseClient()
  const { id, ...payload } = input

  if (!payload.name?.trim()) {
    return { ok: false, error: 'اسم المطور مطلوب', code: 'VALIDATION_ERROR' }
  }

  const result = id
    ? await supabase.from('developers').update(payload).eq('id', id)
    : await supabase.from('developers').insert(payload)

  if (result.error) {
    return { ok: false, error: result.error.message, code: 'DATABASE_ERROR' }
  }

  revalidatePath('/dashboard/developers')
  revalidatePath('/dashboard/inventory')
  return { ok: true, data: undefined }
}
