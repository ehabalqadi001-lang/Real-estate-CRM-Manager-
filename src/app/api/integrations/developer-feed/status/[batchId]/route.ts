import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requireSession } from '@/shared/auth/session'
import { hasPermission } from '@/shared/rbac/permissions'
import { nullableUuid } from '@/lib/uuid'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ batchId: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await requireSession()
    if (!hasPermission(session.profile.role, 'inventory.import') && !hasPermission(session.profile.role, 'inventory.read')) {
      return NextResponse.json({ error: 'غير مصرح لك بمتابعة حالة الاستيراد.' }, { status: 403 })
    }

    const { batchId: rawBatchId } = await context.params
    const batchId = nullableUuid(rawBatchId)
    if (!batchId) return NextResponse.json({ error: 'معرف الاستيراد غير صحيح.' }, { status: 400 })

    const service = createServiceRoleClient()
    const { data: batch, error } = await service
      .from('inventory_ingestion_batches')
      .select('id, developer_id, company_id, source_type, source_name, status, total_rows, processed_rows, failed_rows, error_summary, created_at, completed_at')
      .eq('id', batchId)
      .maybeSingle()

    if (error) throw error
    if (!batch) return NextResponse.json({ error: 'ملف الاستيراد غير موجود.' }, { status: 404 })

    const companyId = nullableUuid(session.profile.company_id) ?? nullableUuid(session.profile.tenant_id)
    const isPlatform = session.profile.role === 'super_admin' || session.profile.role === 'platform_admin'
    if (!isPlatform && batch.company_id && companyId && batch.company_id !== companyId) {
      return NextResponse.json({ error: 'هذا الاستيراد تابع لشركة أخرى.' }, { status: 403 })
    }

    const progress = Number(batch.total_rows ?? 0)
      ? Math.round((Number(batch.processed_rows ?? 0) / Number(batch.total_rows)) * 100)
      : 0

    return NextResponse.json({ success: true, batch: { ...batch, progress } })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'تعذر تحميل حالة الاستيراد.',
    }, { status: 500 })
  }
}
