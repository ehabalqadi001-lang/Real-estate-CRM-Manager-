'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useNotificationStore, AppNotification } from '@/store/notificationStore'

export default function NotificationListener() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const addNotification = useNotificationStore((s) => s.addNotification)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      void Notification.requestPermission()
    }
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
    }
    void getUser()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!userId) return
    if (channelRef.current) {
      void supabase.removeChannel(channelRef.current)
    }

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
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            const desk = new Notification(n.title, { body: n.message, icon: '/favicon.ico', dir: 'rtl' })
            desk.onclick = () => { window.focus(); desk.close() }
          }
        }
      )
      .subscribe()

    channelRef.current = channel
    return () => {
      if (channelRef.current) void supabase.removeChannel(channelRef.current)
    }
  }, [userId, supabase, addNotification])

  return null
}
