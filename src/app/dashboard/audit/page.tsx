import { getI18n } from '@/lib/i18n'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'
import { requireAdmin } from '@/lib/require-role'

interface AuditLog {
  id: string
  user_id: string
  action: string
  target_table: string
  target_id: string
  metadata: Record<string, unknown> | null
  created_at: string
  profiles?: { full_name?: string; email?: string } | null
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  'lead.created':        { label: 'إضافة عميل',       color: 'bg-blue-100 text-blue-700' },
  'lead.updated':        { label: 'تعديل عميل',        color: 'bg-yellow-100 text-yellow-700' },
  'lead.deleted':        { label: 'حذف عميل',          color: 'bg-red-100 text-red-700' },
  'deal.created':        { label: 'إضافة صفقة',        color: 'bg-green-100 text-green-700' },
  'deal.updated':        { label: 'تعديل صفقة',        color: 'bg-yellow-100 text-yellow-700' },
  'deal.deleted':        { label: 'حذف صفقة',          color: 'bg-red-100 text-red-700' },
  'client.created':      { label: 'إضافة مستثمر',      color: 'bg-purple-100 text-purple-700' },
  'client.updated':      { label: 'تعديل مستثمر',      color: 'bg-yellow-100 text-yellow-700' },
  'commission.updated':  { label: 'تعديل عمولة',       color: 'bg-orange-100 text-orange-700' },
  'team.member_added':   { label: 'إضافة عضو فريق',    color: 'bg-teal-100 text-teal-700' },
  'team.member_removed': { label: 'إزالة عضو فريق',    color: 'bg-red-100 text-red-700' },
  'inventory.unit_added':   { label: 'إضافة وحدة',    color: 'bg-indigo-100 text-indigo-700' },
  'inventory.unit_updated': { label: 'تعديل وحدة',    color: 'bg-yellow-100 text-yellow-700' },
  'developer.created':   { label: 'إضافة مطور',        color: 'bg-cyan-100 text-cyan-700' },
  'developer.updated':   { label: 'تعديل مطور',        color: 'bg-yellow-100 text-yellow-700' },
}

export default async function AuditPage() {
  const { dir } = await getI18n()
  await requireAdmin()
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: logs } = await supabase
    .from('audit_logs')
    .select('*, profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(200)

  const auditLogs: AuditLog[] = logs || []

  return (
    <div className="p-6 space-y-6 bg-[var(--fi-soft)] min-h-screen">
      <div className="flex justify-between items-center bg-[var(--fi-paper)] p-4 sm:p-6 rounded-2xl shadow-sm border border-[var(--fi-line)]">
        <div>
          <h1 className="text-2xl font-bold text-[var(--fi-ink)]">سجل العمليات</h1>
          <p className="text-sm text-[var(--fi-muted)] mt-1">تتبع كل عملية في النظام — آخر 200 إجراء</p>
        </div>
        <span className="text-sm text-[var(--fi-muted)]">{auditLogs.length} سجل</span>
      </div>

      <Card className="overflow-hidden">
        {auditLogs.length === 0 ? (
          <div className="p-20 text-center text-[var(--fi-muted)]">
            <p className="text-lg font-semibold">لا توجد سجلات بعد</p>
            <p className="text-sm mt-1">ستظهر هنا كل العمليات التي تتم على النظام</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full rounded-xl"><table className="w-full text-sm">
            <thead className="bg-[var(--fi-soft)] border-b border-[var(--fi-line)]">
              <tr>
                <th className="text-right p-4 font-semibold text-[var(--fi-muted)]">الإجراء</th>
                <th className="text-right p-4 font-semibold text-[var(--fi-muted)]">المستخدم</th>
                <th className="text-right p-4 font-semibold text-[var(--fi-muted)]">الجدول</th>
                <th className="text-right p-4 font-semibold text-[var(--fi-muted)]">المعرف</th>
                <th className="text-right p-4 font-semibold text-[var(--fi-muted)]">التوقيت</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => {
                const meta = ACTION_LABELS[log.action]
                return (
                  <tr key={log.id} className="border-b border-[var(--fi-line)] hover:bg-[var(--fi-soft)] transition-colors">
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${meta?.color ?? 'bg-slate-100 text-[var(--fi-muted)]'}`}>
                        {meta?.label ?? log.action}
                      </span>
                    </td>
                    <td className="p-4 text-[var(--fi-ink)]">
                      {log.profiles?.full_name ?? log.profiles?.email ?? log.user_id.slice(0, 8) + '…'}
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="font-mono text-xs">{log.target_table}</Badge>
                    </td>
                    <td className="p-4 font-mono text-xs text-[var(--fi-muted)]">{log.target_id.slice(0, 8)}…</td>
                    <td className="p-4 text-[var(--fi-muted)] text-xs">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ar })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table></div>
        )}
      </Card>
    </div>
  )
}
