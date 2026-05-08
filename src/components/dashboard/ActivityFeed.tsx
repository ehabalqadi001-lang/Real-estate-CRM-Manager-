'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bell, FileClock, Home, UserPlus, WalletCards } from 'lucide-react'
import type { RealtimePostgresInsertPayload } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createBrowserSupabaseClient } from '@/shared/supabase/browser'
import type { AuditLog, Database } from '@/lib/types/db'
import { useI18n } from '@/hooks/use-i18n'

export type ActivityFeedItem = {
  id: string
  action: string
  targetTable: string | null
  agentName: string
  createdAt: string
}

type ActivityFeedProps = {
  initialActivities: ActivityFeedItem[]
}

export function ActivityFeed({ initialActivities }: ActivityFeedProps) {
  const { t, numLocale } = useI18n()
  const [activities, setActivities] = useState<ActivityFeedItem[]>(initialActivities)
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])

  function labelAction(action: string) {
    const labels: Record<string, string> = {
      'lead.created': t('إضافة عميل جديد', 'New lead added'),
      'lead.updated': t('تحديث بيانات عميل', 'Lead updated'),
      'deal.created': t('إضافة صفقة جديدة', 'New deal added'),
      'deal.stage_changed': t('تغيير مرحلة صفقة', 'Deal stage changed'),
      'commission.approved': t('اعتماد عمولة', 'Commission approved'),
      'task.created': t('إضافة مهمة جديدة', 'New task added'),
    }
    return labels[action] ?? action.replaceAll('.', ' ')
  }

  function relativeTime(value: string) {
    const diff = Date.now() - new Date(value).getTime()
    const minutes = Math.max(0, Math.floor(diff / 60000))
    if (minutes < 1) return t('الآن', 'Just now')
    if (minutes < 60) return t(`منذ ${minutes.toLocaleString(numLocale)} دقائق`, `${minutes} min ago`)
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return t(`منذ ${hours.toLocaleString(numLocale)} ساعة`, `${hours}h ago`)
    const days = Math.floor(hours / 24)
    return t(`منذ ${days.toLocaleString(numLocale)} يوم`, `${days}d ago`)
  }

  useEffect(() => {
    const channel = supabase
      .channel('dashboard-audit-logs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_logs' },
        (payload: RealtimePostgresInsertPayload<Database['public']['Tables']['audit_logs']['Row']>) => {
          const row = payload.new
          setActivities((current) => [
            {
              id: row.id,
              action: row.action,
              targetTable: row.target_table,
              agentName: t('عضو فريق', 'Team Member'),
              createdAt: row.created_at,
            },
            ...current,
          ].slice(0, 15))
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase])

  return (
    <Card className="border-[var(--fi-line)] bg-white">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="flex size-10 items-center justify-center rounded-lg bg-[var(--fi-soft)] text-[var(--fi-emerald)]">
            <Bell className="size-5" />
          </span>
          <div>
            <CardTitle className="text-base font-black text-[var(--fi-ink)]">{t('النشاطات الأخيرة', 'Recent Activity')}</CardTitle>
            <CardDescription className="font-semibold text-[var(--fi-muted)]">{t('آخر 15 حركة مباشرة', 'Last 15 live events')}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--fi-line)] bg-[var(--fi-soft)] p-6 text-center text-sm font-bold text-[var(--fi-muted)]">
            {t('لا توجد نشاطات مسجلة حتى الآن', 'No activity recorded yet')}
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => {
              const Icon = iconForTable(activity.targetTable)
              return (
                <div key={activity.id} className="flex gap-3 rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] p-3">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--fi-soft)] text-[var(--fi-emerald)]">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-[var(--fi-ink)]">{labelAction(activity.action)}</p>
                    <p className="mt-1 text-xs font-semibold text-[var(--fi-muted)]">
                      {activity.agentName} · {relativeTime(activity.createdAt)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function mapAuditLogToActivity(row: AuditLog, agentName?: string | null): ActivityFeedItem {
  return {
    id: row.id,
    action: row.action,
    targetTable: row.target_table,
    agentName: agentName || 'Team Member',
    createdAt: row.created_at,
  }
}

function iconForTable(table: string | null) {
  if (table === 'leads') return UserPlus
  if (table === 'deals') return WalletCards
  if (table === 'units' || table === 'inventory') return Home
  return FileClock
}
