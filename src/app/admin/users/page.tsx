import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createTypedServerClient } from '@/lib/supabase/typed'
import { requirePermission } from '@/shared/rbac/require-permission'
import { updateUserRole, updateUserStatus } from './actions'

export const dynamic = 'force-dynamic'

const roles = ['super_admin', 'company_admin', 'branch_manager', 'senior_agent', 'agent', 'individual', 'viewer']

export default async function AdminUsersPage({ searchParams }: { searchParams?: Promise<{ q?: string; role?: string; status?: string; company?: string }> }) {
  await requirePermission('admin.view')
  const params = await searchParams
  const supabase = await createTypedServerClient()
  const [{ data: users, error }, { data: companies }] = await Promise.all([
    supabase.from('user_profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('companies').select('id, name').order('name'),
  ])

  const q = (params?.q ?? '').toLowerCase()
  const filtered = (users ?? []).filter((user) => {
    const matchesQ = !q || [user.full_name, user.email, user.phone].some((value) => String(value ?? '').toLowerCase().includes(q))
    const matchesRole = !params?.role || user.role === params.role
    const matchesStatus = !params?.status || user.status === params.status
    const matchesCompany = !params?.company || user.company_id === params.company
    return matchesQ && matchesRole && matchesStatus && matchesCompany
  })

  return (
    <main className="space-y-5 p-4 sm:p-6" dir="rtl">
      <section className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] p-5">
        <h1 className="text-2xl font-black text-[var(--fi-ink)]">كل المستخدمين</h1>
        <p className="mt-1 text-sm text-[var(--fi-muted)]">بحث وتصفية وتغيير صلاحيات المستخدمين عبر كل الشركات.</p>
      </section>

      <form className="grid gap-3 rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4 md:grid-cols-4">
        <Input name="q" defaultValue={params?.q} placeholder="بحث بالاسم / البريد / الهاتف" />
        <select name="role" defaultValue={params?.role ?? ''} className="h-8 rounded-lg border border-[var(--fi-line)] bg-background px-2 text-sm">
          <option value="">كل الأدوار</option>
          {roles.map((role) => <option key={role} value={role}>{role}</option>)}
        </select>
        <select name="status" defaultValue={params?.status ?? ''} className="h-8 rounded-lg border border-[var(--fi-line)] bg-background px-2 text-sm">
          <option value="">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="pending">معلق</option>
          <option value="suspended">موقوف</option>
          <option value="rejected">مرفوض</option>
        </select>
        <Button>تطبيق الفلاتر</Button>
      </form>

      {error ? <div className="rounded-lg bg-[var(--fi-paper)] p-6 text-destructive">{error.message}</div> : (
        <div className="overflow-hidden rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)]">
          <table className="w-full min-w-[1050px] text-sm">
            <thead className="bg-[var(--fi-soft)] text-[var(--fi-muted)]">
              <tr><th className="p-3 text-right">الاسم</th><th className="p-3 text-right">الشركة</th><th className="p-3 text-right">الدور</th><th className="p-3 text-right">الحالة</th><th className="p-3 text-right">تاريخ الانضمام</th><th className="p-3 text-right">إجراءات</th></tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-t border-[var(--fi-line)]">
                  <td className="p-3"><p className="font-black text-[var(--fi-ink)]">{user.full_name ?? `${user.first_name} ${user.last_name}`}</p><p className="text-xs text-[var(--fi-muted)]">{user.email} · {user.phone}</p></td>
                  <td className="p-3">{companies?.find((company) => company.id === user.company_id)?.name ?? user.company_name ?? 'فردي'}</td>
                  <td className="p-3"><Badge variant="outline">{user.role ?? 'agent'}</Badge></td>
                  <td className="p-3"><Badge>{user.status ?? 'pending'}</Badge></td>
                  <td className="p-3">{user.created_at ? new Date(user.created_at).toLocaleDateString('ar-EG') : 'غير محدد'}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <form action={updateUserRole} className="flex gap-1"><input type="hidden" name="id" value={user.id} /><select name="role" defaultValue={user.role ?? 'agent'} className="h-8 rounded-lg border px-2 text-xs">{roles.map((role) => <option key={role}>{role}</option>)}</select><Button size="sm">تغيير الدور</Button></form>
                      <form action={updateUserStatus}><input type="hidden" name="id" value={user.id} /><input type="hidden" name="status" value={user.status === 'suspended' ? 'active' : 'suspended'} /><Button size="sm" variant="outline">{user.status === 'suspended' ? 'تفعيل' : 'تعليق'}</Button></form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
