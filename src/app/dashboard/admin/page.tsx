'use client'
import { useI18n } from '@/hooks/use-i18n'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { ShieldCheck } from 'lucide-react'

interface AdminUser {
  id: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  company_name?: string
  account_type?: string
  status?: string
}

export default function AdminPage() {
  const { dir } = useI18n()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (mounted && !error) setUsers((data as AdminUser[]) ?? [])
        if (mounted) setLoading(false)
      })
    return () => { mounted = false }
  }, [])

  const updateStatus = async (id: string, newStatus: string) => {
    if (!confirm(`هل أنت متأكد من تغيير الحالة إلى "${newStatus}"؟`)) return
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    const { error } = await supabase.from('user_profiles').update({ status: newStatus }).eq('id', id)
    if (!error) setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: newStatus } : u)))
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--fi-line)] bg-white p-5 shadow-sm dark:bg-gray-900">
        <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50">
          <ShieldCheck className="size-5 text-[var(--fi-emerald)]" />
        </div>
        <div>
          <h1 className="text-xl font-black text-[var(--fi-ink)] dark:text-white">
            إدارة حسابات الشركاء
          </h1>
          <p className="text-xs font-semibold text-[var(--fi-muted)]">
            مراجعة وإدارة طلبات الشركاء المعلقة
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[var(--fi-line)] bg-white shadow-sm overflow-hidden dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--fi-line)] bg-[var(--fi-soft)]">
                {['الشريك', 'التواصل', 'نوع الحساب', 'الحالة', 'إجراء'].map((h) => (
                  <th key={h} className="px-5 py-3 text-right text-xs font-black text-[var(--fi-muted)] uppercase tracking-[0.1em]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--fi-line)]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-[var(--fi-muted)]">
                    جارٍ التحميل…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-[var(--fi-muted)]">
                    لا توجد بيانات.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-[var(--fi-soft)] transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-bold text-[var(--fi-ink)] dark:text-white">
                        {u.first_name} {u.last_name}
                      </p>
                      <p className="text-xs text-[var(--fi-muted)] mt-0.5">
                        {u.company_name || 'مستقل'}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[var(--fi-ink)] dark:text-white">{u.email}</p>
                      <p className="text-xs text-[var(--fi-muted)] mt-0.5 ltr text-left">{u.phone}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-lg bg-[var(--fi-soft)] px-2.5 py-1 text-xs font-bold text-[var(--fi-muted)] capitalize">
                        {u.account_type || 'User'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${
                          u.status === 'approved'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : u.status === 'rejected'
                              ? 'border-red-200 bg-red-50 text-red-600'
                              : 'border-amber-200 bg-amber-50 text-amber-700'
                        }`}
                      >
                        {u.status === 'approved'
                          ? 'معتمد'
                          : u.status === 'rejected'
                            ? 'مرفوض'
                            : 'قيد المراجعة'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {u.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateStatus(u.id, 'approved')}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-black text-white transition hover:bg-emerald-700"
                          >
                            اعتماد
                          </button>
                          <button
                            onClick={() => updateStatus(u.id, 'rejected')}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-black text-red-600 transition hover:bg-red-50"
                          >
                            رفض
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--fi-muted)]">تمت المعالجة</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
