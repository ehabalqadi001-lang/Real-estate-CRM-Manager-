'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CheckCheck, Clock, MessageSquare, Trash2, UserPlus, WalletCards, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { AppNotificationItem, NotificationType } from './useNotifications'

type NotificationCenterProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  notifications: AppNotificationItem[]
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  error: string | null
  onLoadMore: () => void
  onMarkRead: (id: string) => Promise<void>
  onMarkAllRead: () => Promise<void>
  onDeleteAll: () => Promise<void>
}

export function NotificationCenter({
  open,
  onOpenChange,
  notifications,
  isLoading,
  isLoadingMore,
  hasMore,
  error,
  onLoadMore,
  onMarkRead,
  onMarkAllRead,
  onDeleteAll,
}: NotificationCenterProps) {
  const router = useRouter()
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const grouped = useMemo(() => groupNotifications(notifications), [notifications])

  useEffect(() => {
    if (!open || !sentinelRef.current) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && hasMore && !isLoadingMore) onLoadMore()
    }, { rootMargin: '140px' })
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, isLoadingMore, onLoadMore, open])

  async function openNotification(item: AppNotificationItem) {
    if (!item.isRead) await onMarkRead(item.id)
    onOpenChange(false)
    if (item.link) router.push(item.link)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full overflow-hidden bg-white p-0 sm:max-w-md" dir="rtl">
        <SheetHeader className="border-b border-[var(--fi-line)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle className="text-right text-xl font-black text-[var(--fi-ink)]">مركز الإشعارات</SheetTitle>
              <SheetDescription className="text-right font-semibold text-[var(--fi-muted)]">
                آخر التنبيهات والمهام المهمة
              </SheetDescription>
            </div>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => onOpenChange(false)} aria-label="إغلاق">
              <X className="size-4" />
            </Button>
          </div>
          <div className="mt-3 flex gap-2">
            <Button type="button" variant="outline" className="flex-1 gap-2 bg-white" onClick={() => void onMarkAllRead()}>
              <CheckCheck className="size-4" />
              تحديد الكل كمقروء
            </Button>
            <Button type="button" variant="destructive" className="gap-2" onClick={() => void onDeleteAll()}>
              <Trash2 className="size-4" />
              حذف الكل
            </Button>
          </div>
        </SheetHeader>

        <div className="h-[calc(100vh-142px)] overflow-y-auto p-4">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-lg bg-[var(--fi-soft)]" />)}
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>
          ) : notifications.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-[var(--fi-line)] bg-[var(--fi-soft)] text-center">
              <Bell className="size-9 text-[var(--fi-muted)]" />
              <p className="mt-3 text-sm font-black text-[var(--fi-ink)]">لا توجد إشعارات</p>
              <p className="mt-1 text-xs font-semibold text-[var(--fi-muted)]">ستظهر التنبيهات المهمة هنا فور وصولها.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {grouped.map((group) => (
                <section key={group.label} className="space-y-2">
                  <h3 className="text-xs font-black text-[var(--fi-muted)]">{group.label}</h3>
                  {group.items.map((item) => {
                    const Icon = iconForType(item.type)
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => void openNotification(item)}
                        className={`w-full rounded-lg border p-3 text-right transition hover:border-[var(--fi-emerald)] ${item.isRead ? 'border-[var(--fi-line)] bg-white' : 'border-[var(--fi-emerald)] bg-[var(--fi-soft)]'}`}
                      >
                        <div className="flex gap-3">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-[var(--fi-emerald)]">
                            <Icon className="size-5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-black text-[var(--fi-ink)]">{item.title}</p>
                              {!item.isRead && <span className="mt-1 size-2 shrink-0 rounded-full bg-red-500" />}
                            </div>
                            {item.body && <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-[var(--fi-muted)]">{item.body}</p>}
                            <p className="mt-2 text-[11px] font-bold text-[var(--fi-muted)]">{relativeArabic(item.createdAt)}</p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </section>
              ))}
              <div ref={sentinelRef} className="h-10">
                {isLoadingMore && <p className="text-center text-xs font-bold text-[var(--fi-muted)]">جاري تحميل المزيد...</p>}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function groupNotifications(items: AppNotificationItem[]) {
  const groups = [
    { label: 'اليوم', items: [] as AppNotificationItem[] },
    { label: 'أمس', items: [] as AppNotificationItem[] },
    { label: 'هذا الأسبوع', items: [] as AppNotificationItem[] },
    { label: 'أقدم', items: [] as AppNotificationItem[] },
  ]

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const yesterday = today - 86400000
  const week = today - 6 * 86400000

  for (const item of items) {
    const time = new Date(item.createdAt).getTime()
    if (time >= today) groups[0].items.push(item)
    else if (time >= yesterday) groups[1].items.push(item)
    else if (time >= week) groups[2].items.push(item)
    else groups[3].items.push(item)
  }

  return groups.filter((group) => group.items.length > 0)
}

function iconForType(type: NotificationType) {
  if (type === 'deal_moved') return WalletCards
  if (type === 'new_client') return UserPlus
  if (type === 'task_due') return Clock
  if (type === 'mention') return MessageSquare
  return Bell
}

function relativeArabic(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.max(0, Math.floor(diff / 60000))
  if (minutes < 1) return 'الآن'
  if (minutes < 60) return `منذ ${minutes.toLocaleString('ar-EG')} دقائق`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `منذ ${hours.toLocaleString('ar-EG')} ساعة`
  const days = Math.floor(hours / 24)
  return `منذ ${days.toLocaleString('ar-EG')} يوم`
}
