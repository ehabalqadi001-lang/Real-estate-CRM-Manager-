'use server'

import { revalidatePath } from 'next/cache'
import { createRawClient } from '@/lib/supabase/server'
import { requirePermission } from '@/shared/rbac/require-permission'

export async function saveAnnouncement(formData: FormData) {
  await requirePermission('admin.view')
  const supabase = await createRawClient()
  await supabase.from('announcements').insert({
    title: String(formData.get('title') ?? ''),
    body: String(formData.get('body') ?? ''),
    type: String(formData.get('type') ?? 'banner'),
    target_audience: String(formData.get('target_audience') ?? 'all'),
    start_date: String(formData.get('start_date') ?? '') || null,
    end_date: String(formData.get('end_date') ?? '') || null,
    is_active: true,
  })
  revalidatePath('/admin/content')
}

export async function toggleAnnouncement(formData: FormData) {
  await requirePermission('admin.view')
  const supabase = await createRawClient()
  await supabase.from('announcements').update({ is_active: formData.get('is_active') === 'true' }).eq('id', String(formData.get('id') ?? ''))
  revalidatePath('/admin/content')
}
