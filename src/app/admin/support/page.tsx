import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createTypedServerClient } from '@/lib/supabase/typed'
import { requirePermission } from '@/shared/rbac/require-permission'
import { updateTicket } from './actions'

export const dynamic = 'force-dynamic'

export default async function AdminSupportPage() {
  await requirePermission('admin.view')
  const supabase = await createTypedServerClient()
  const [{ data: tickets, error }, { data: users }] = await Promise.all([
    supabase.from('support_tickets').select('*').order('created_at', { ascending: false }),
    supabase.from('user_profiles').select('id, full_name, email').in('role', ['super_admin', 'company_admin', 'agent']),
  ])

  return (
    <main className="space-y-5 p-4 sm:p-6" dir="rtl">
      <section className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] p-5"><h1 className="text-2xl font-black">الدعم الفني</h1><p className="text-sm text-[var(--fi-muted)]">تذاكر المستخدمين وحالات المعالجة.</p></section>
      {error ? <div className="text-destructive">{error.message}</div> : tickets?.length ? (
        <div className="grid gap-3">
          {tickets.map((ticket) => (
            <article key={ticket.id} className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4">
              <div className="flex flex-col justify-between gap-4 md:flex-row">
                <div><h2 className="font-black">{ticket.title}</h2><p className="mt-1 text-sm text-[var(--fi-muted)]">{ticket.description ?? 'لا يوجد وصف'}</p><div className="mt-2 flex gap-2"><Badge>{ticket.status}</Badge><Badge variant={ticket.priority === 'critical' ? 'destructive' : 'outline'}>{ticket.priority}</Badge></div></div>
                <form action={updateTicket} className="grid gap-2 sm:grid-cols-4">
                  <input type="hidden" name="id" value={ticket.id} />
                  <select name="status" defaultValue={ticket.status} className="h-8 rounded-lg border px-2 text-sm"><option value="open">open</option><option value="in_progress">in_progress</option><option value="resolved">resolved</option></select>
                  <select name="priority" defaultValue={ticket.priority} className="h-8 rounded-lg border px-2 text-sm"><option value="low">low</option><option value="medium">medium</option><option value="high">high</option><option value="critical">critical</option></select>
                  <select name="assigned_to" defaultValue={ticket.assigned_to ?? ''} className="h-8 rounded-lg border px-2 text-sm"><option value="">بدون تعيين</option>{users?.map((user) => <option key={user.id} value={user.id}>{user.full_name ?? user.email}</option>)}</select>
                  <Button size="sm">حفظ</Button>
                </form>
              </div>
            </article>
          ))}
        </div>
      ) : <div className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] p-8 text-center text-[var(--fi-muted)]">لا توجد تذاكر دعم حالياً.</div>}
    </main>
  )
}
