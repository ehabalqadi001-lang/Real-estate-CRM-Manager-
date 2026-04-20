'use client'

import { useMemo, useState, useTransition } from 'react'
import { Bar, BarChart, ResponsiveContainer } from 'recharts'
import { toast } from 'sonner'
import { Eye, Mail, Shield, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateMemberRole, suspendMember, inviteAgentByEmail } from '@/app/dashboard/team/actions'

export type TeamMemberRow = {
  id: string
  name: string
  email: string | null
  role: string
  activeDeals: number
  monthSales: number
  commissions: number
  status: string
  sparkline: Array<{ label: string; value: number }>
}

export function TeamManagementClient({ members }: { members: TeamMemberRow[] }) {
  const [view, setView] = useState<'table' | 'leaderboard'>('table')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [isPending, startTransition] = useTransition()

  const sorted = useMemo(() => [...members].sort((a, b) => b.monthSales - a.monthSales), [members])
  const rows = view === 'leaderboard' ? sorted : members

  return (
    <section className="space-y-4" dir="rtl">
      <div className="rounded-xl border border-[var(--fi-line)] bg-white p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-black text-[var(--fi-ink)]">إدارة الفريق</h1>
            <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">أداء الوسطاء، الأدوار، الصفقات النشطة، والعمولات.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant={view === 'table' ? 'default' : 'outline'} onClick={() => setView('table')}>جدول</Button>
            <Button variant={view === 'leaderboard' ? 'default' : 'outline'} onClick={() => setView('leaderboard')}>Leaderboard</Button>
          </div>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-[1fr_1fr_auto]">
          <Input placeholder="اسم الوسيط" value={inviteName} onChange={(event) => setInviteName(event.target.value)} />
          <Input placeholder="البريد الإلكتروني" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} />
          <Button disabled={isPending || !inviteEmail} className="gap-2 bg-[var(--fi-emerald)] text-white hover:bg-[var(--fi-emerald)]/90" onClick={() => startTransition(async () => {
            const result = await inviteAgentByEmail(inviteEmail, inviteName)
            if (result.success) {
              toast.success('تم إرسال الدعوة')
              setInviteEmail('')
              setInviteName('')
            } else {
              toast.error(result.error ?? 'تعذر إرسال الدعوة')
            }
          })}>
            <Mail className="size-4" />
            إضافة وسيط
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--fi-line)] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-right text-sm">
            <thead className="bg-[var(--fi-soft)]">
              <tr>
                <th className="p-3">الاسم</th>
                <th className="p-3">الدور</th>
                <th className="p-3">الصفقات النشطة</th>
                <th className="p-3">المبيعات هذا الشهر</th>
                <th className="p-3">العمولات</th>
                <th className="p-3">الأداء</th>
                <th className="p-3">الحالة</th>
                <th className="p-3">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((member, index) => (
                <tr key={member.id} className="border-t border-[var(--fi-line)]">
                  <td className="p-3">
                    <p className="font-black text-[var(--fi-ink)]">{view === 'leaderboard' ? `${index + 1}. ` : ''}{member.name}</p>
                    <p className="text-xs font-semibold text-[var(--fi-muted)]">{member.email}</p>
                  </td>
                  <td className="p-3">
                    <select className="h-9 rounded-lg border border-[var(--fi-line)] bg-white px-2" value={member.role} onChange={(event) => startTransition(async () => {
                      await updateMemberRole(member.id, event.target.value)
                      toast.success('تم تحديث الدور')
                    })}>
                      {['branch_manager', 'senior_agent', 'agent', 'individual', 'viewer'].map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}
                    </select>
                  </td>
                  <td className="p-3 font-black">{member.activeDeals.toLocaleString('ar-EG')}</td>
                  <td className="p-3 font-black text-[var(--fi-emerald)]">{formatMoney(member.monthSales)}</td>
                  <td className="p-3 font-black">{formatMoney(member.commissions)}</td>
                  <td className="p-3">
                    <div className="h-10 w-28">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={member.sparkline}>
                          <Bar dataKey="value" fill="var(--fi-emerald)" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </td>
                  <td className="p-3"><span className={member.status === 'suspended' ? 'rounded-full bg-red-50 px-2 py-1 text-xs font-black text-red-700' : 'rounded-full bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700'}>{member.status === 'suspended' ? 'معلق' : 'نشط'}</span></td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button size="icon-sm" variant="outline" title="عرض التفاصيل"><Eye className="size-4" /></Button>
                      <Button size="icon-sm" variant="outline" title="تعديل الدور"><Shield className="size-4" /></Button>
                      <Button size="icon-sm" variant="destructive" title="تعليق الحساب" onClick={() => startTransition(async () => {
                        await suspendMember(member.id)
                        toast.success('تم تعليق الحساب')
                      })}><UserX className="size-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    branch_manager: 'مدير فرع',
    senior_agent: 'وسيط أول',
    agent: 'وسيط',
    individual: 'فردي',
    viewer: 'مشاهد',
  }
  return labels[role] ?? role
}

function formatMoney(value: number) {
  return `${new Intl.NumberFormat('ar-EG', { notation: 'compact', maximumFractionDigits: 1 }).format(value)} ج.م`
}
