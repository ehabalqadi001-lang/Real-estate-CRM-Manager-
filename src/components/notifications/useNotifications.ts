'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { createBrowserSupabaseClient } from '@/shared/supabase/browser'
import type { Database, Notification } from '@/lib/types/db'

export type NotificationType = Notification['type']

export type AppNotificationItem = {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string
  link: string | null
  readAt: string | null
  isRead: boolean
  createdAt: string
}

const PAGE_SIZE = 50

export function useNotifications(userId: string) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])
  const [notifications, setNotifications] = useState<AppNotificationItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)

  const load = useCallback(async () => {
    if (!userId) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    const { data, error: queryError } = await supabase
      .from('notifications')
      .select('id, user_id, type, title, message, body, link, is_read, read_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)

    if (queryError) {
      setError(queryError.message)
    } else {
      setNotifications((data ?? []).map(mapNotification))
      setHasMore((data ?? []).length === PAGE_SIZE)
    }
    setIsLoading(false)
  }, [supabase, userId])

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(timeout)
  }, [load])

  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`notification-center:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const item = mapNotification(payload.new as Database['public']['Tables']['notifications']['Row'])
          setNotifications((current) => [item, ...current.filter((n) => n.id !== item.id)].slice(0, 100))
          toast(item.title, {
            description: item.body,
            action: item.link ? {
              label: 'عرض',
              onClick: () => window.location.assign(item.link!),
            } : undefined,
          })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [supabase, userId])

  const loadMore = useCallback(async () => {
    if (!userId || !hasMore || isLoadingMore || notifications.length === 0) return
    setIsLoadingMore(true)
    const last = notifications[notifications.length - 1]
    const { data, error: queryError } = await supabase
      .from('notifications')
      .select('id, user_id, type, title, message, body, link, is_read, read_at, created_at')
      .eq('user_id', userId)
      .lt('created_at', last.createdAt)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)

    if (queryError) {
      setError(queryError.message)
    } else {
      const next = (data ?? []).map(mapNotification)
      setNotifications((current) => [...current, ...next])
      setHasMore(next.length === PAGE_SIZE)
    }
    setIsLoadingMore(false)
  }, [hasMore, isLoadingMore, notifications, supabase, userId])

  const markRead = useCallback(async (id: string) => {
    if (!userId) return
    const readAt = new Date().toISOString()
    setNotifications((current) => current.map((item) => item.id === id ? { ...item, isRead: true, readAt } : item))
    await supabase.from('notifications').update({ is_read: true, read_at: readAt }).eq('id', id).eq('user_id', userId)
  }, [supabase, userId])

  const markAllRead = useCallback(async () => {
    if (!userId) return
    const readAt = new Date().toISOString()
    setNotifications((current) => current.map((item) => ({ ...item, isRead: true, readAt })))
    await supabase.from('notifications').update({ is_read: true, read_at: readAt }).eq('user_id', userId).eq('is_read', false)
  }, [supabase, userId])

  const deleteAll = useCallback(async () => {
    if (!userId) return
    setNotifications([])
    await supabase.from('notifications').delete().eq('user_id', userId)
  }, [supabase, userId])

  return {
    notifications,
    unreadCount: notifications.filter((item) => !item.isRead).length,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    markRead,
    markAllRead,
    deleteAll,
  }
}

function mapNotification(row: Database['public']['Tables']['notifications']['Row']): AppNotificationItem {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body ?? row.message ?? '',
    link: row.link ?? null,
    readAt: row.read_at ?? (row.is_read ? row.created_at : null),
    isRead: Boolean(row.is_read || row.read_at),
    createdAt: row.created_at,
  }
}
