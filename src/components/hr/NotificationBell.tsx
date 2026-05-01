'use client'

import Link from 'next/link'
import { useTransition, useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { markNotificationReadAction, markAllReadAction } from '@/app/dashboard/notifications/hr-actions'

export type NotifItem = {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

const typeIcon: Record<string, string> = {
  leave_request:      '📅',
  commission_pending: '💰',
  payroll_ready:      '💳',
  burnout_alert:      '🔥',
  onboarding_overdue: '📋',
  review_due:         '⭐',
  document_expiry:    '📄',
  general:            '🔔',
}

export function NotificationBell({ notifications }: { notifications: NotifItem[] }) {
  const unreadCount = notifications.filter((n) => !n.is_read).length
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="relative flex size-9 items-center justify-center rounded-lg border border-[var(--fi-line)] bg-white text-[var(--fi-muted)] transition hover:border-[var(--fi-emerald)] hover:text-[var(--fi-emerald)] dark:bg-white/5"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-50 mt-2 w-80 rounded-xl border border-[var(--fi-line)] bg-white shadow-xl dark:bg-[var(--fi-card)]" dir="rtl">
            <div className="flex items-center justify-between border-b border-[var(--fi-line)] px-4 py-3">
              <p className="text-sm font-black text-[var(--fi-ink)]">الإشعارات</p>
              {unreadCount > 0 && (
                <button
                  disabled={pending}
                  onClick={() => startTransition(() => markAllReadAction())}
                  className="flex items-center gap-1 text-xs font-bold text-[var(--fi-emerald)] transition hover:underline disabled:opacity-50"
                >
                  <CheckCheck className="size-3.5" />
                  قراءة الكل
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 && (
                <p className="px-4 py-8 text-center text-sm font-bold text-[var(--fi-muted)]">لا توجد إشعارات.</p>
              )}
              {notifications.slice(0, 15).map((n) => (
                <div
                  key={n.id}
                  className={`flex gap-3 border-b border-[var(--fi-line)] px-4 py-3 transition ${n.is_read ? 'opacity-60' : 'bg-emerald-50/30 dark:bg-emerald-900/10'}`}
                >
                  <span className="mt-0.5 text-lg">{typeIcon[n.type] ?? '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-black leading-snug text-[var(--fi-ink)] ${n.is_read ? '' : ''}`}>{n.title}</p>
                    {n.body && <p className="mt-0.5 text-xs text-[var(--fi-muted)] line-clamp-2">{n.body}</p>}
                    <p className="mt-1 text-xs text-[var(--fi-muted)]">
                      {new Intl.DateTimeFormat('ar-EG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(n.created_at))}
                    </p>
                  </div>
                  {!n.is_read && (
                    <button
                      disabled={pending}
                      onClick={() => startTransition(() => markNotificationReadAction(n.id))}
                      className="mt-1 shrink-0 size-4 rounded-full bg-emerald-500 transition hover:bg-emerald-600 disabled:opacity-50"
                      title="تحديد كمقروء"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-[var(--fi-line)] p-3">
              <Link
                href="/dashboard/notifications"
                onClick={() => setOpen(false)}
                className="block text-center text-xs font-black text-[var(--fi-emerald)] transition hover:underline"
              >
                عرض كل الإشعارات
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
