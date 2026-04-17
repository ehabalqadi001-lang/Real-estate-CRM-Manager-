'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useNotificationStore, AppNotification } from '@/store/notificationStore'

function pushDesktop(n: AppNotification) {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    const desk = new Notification(n.title, { body: n.message, icon: '/favicon.ico', dir: 'rtl' })
    desk.onclick = () => { window.focus(); desk.close() }
  }
}

export default function NotificationListener() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const addNotification = useNotificationStore((s) => s.addNotification)
  const notifChannelRef  = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const dealsChannelRef  = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const leadsChannelRef  = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
    }
    void getUser()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // notifications table — personal channel
  useEffect(() => {
    if (!userId) return
    if (notifChannelRef.current) void supabase.removeChannel(notifChannelRef.current)

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const raw = payload.new as { id: string; title: string; message: string; type?: string; created_at: string }
          const n: AppNotification = {
            id: raw.id,
            title: raw.title ?? 'إشعار جديد',
            message: raw.message ?? '',
            type: (raw.type as AppNotification['type']) ?? 'info',
            read: false,
            created_at: raw.created_at ?? new Date().toISOString(),
          }
          addNotification(n)
          pushDesktop(n)
        }
      )
      .subscribe()

    notifChannelRef.current = channel
    return () => { if (notifChannelRef.current) void supabase.removeChannel(notifChannelRef.current) }
  }, [userId, supabase, addNotification])

  // deals table — stage updates (broadcast to everyone)
  useEffect(() => {
    if (dealsChannelRef.current) void supabase.removeChannel(dealsChannelRef.current)

    const channel = supabase
      .channel('deals:realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'deals' },
        (payload) => {
          const prev = payload.old as { stage?: string; title?: string }
          const next = payload.new as { stage?: string; title?: string; id?: string }
          if (prev.stage && next.stage && prev.stage !== next.stage) {
            const n: AppNotification = {
              id: `deal-${next.id}-${Date.now()}`,
              title: 'تحديث مرحلة الصفقة',
              message: `صفقة "${next.title ?? ''}" انتقلت من ${prev.stage} إلى ${next.stage}`,
              type: 'info',
              read: false,
              created_at: new Date().toISOString(),
            }
            addNotification(n)
            pushDesktop(n)
          }
        }
      )
      .subscribe()

    dealsChannelRef.current = channel
    return () => { if (dealsChannelRef.current) void supabase.removeChannel(dealsChannelRef.current) }
  }, [supabase, addNotification])

  // leads table — new leads assigned to me
  useEffect(() => {
    if (!userId) return
    if (leadsChannelRef.current) void supabase.removeChannel(leadsChannelRef.current)

    const channel = supabase
      .channel(`leads:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'leads', filter: `assigned_to=eq.${userId}` },
        (payload) => {
          const raw = payload.new as { id?: string; name?: string; phone?: string }
          const n: AppNotification = {
            id: `lead-${raw.id}-${Date.now()}`,
            title: 'عميل جديد تم تعيينه لك',
            message: `${raw.name ?? 'عميل'} — ${raw.phone ?? ''}`,
            type: 'success',
            read: false,
            created_at: new Date().toISOString(),
          }
          addNotification(n)
          pushDesktop(n)
        }
      )
      .subscribe()

    leadsChannelRef.current = channel
    return () => { if (leadsChannelRef.current) void supabase.removeChannel(leadsChannelRef.current) }
  }, [userId, supabase, addNotification])

  return null
}
