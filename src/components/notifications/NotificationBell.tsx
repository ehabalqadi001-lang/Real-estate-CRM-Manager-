'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NotificationCenter } from './NotificationCenter'
import { useNotifications } from './useNotifications'

export function NotificationBell({ userId: providedUserId }: { userId?: string }) {
  const [open, setOpen] = useState(false)
  const [clientUserId, setClientUserId] = useState(providedUserId ?? '')
  const userId = providedUserId ?? clientUserId

  useEffect(() => {
    if (providedUserId) return
    import('@/shared/supabase/browser').then(async ({ createBrowserSupabaseClient }) => {
      const supabase = createBrowserSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setClientUserId(user.id)
    })
  }, [providedUserId])

  const {
    notifications,
    unreadCount,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    markRead,
    markAllRead,
    deleteAll,
  } = useNotifications(userId)

  if (!userId) {
    return (
      <Button type="button" variant="outline" size="icon-lg" className="relative bg-white" aria-label="الإشعارات" disabled>
        <Bell className="size-5 text-[var(--fi-emerald)]" />
      </Button>
    )
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon-lg"
        className="relative bg-white"
        aria-label="فتح الإشعارات"
        onClick={() => setOpen(true)}
      >
        <Bell className="size-5 text-[var(--fi-emerald)]" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: [1, 1.22, 1], opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white ring-2 ring-white"
            >
              {unreadCount > 99 ? '٩٩+' : unreadCount.toLocaleString('ar-EG')}
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
      <NotificationCenter
        open={open}
        onOpenChange={setOpen}
        notifications={notifications}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        error={error}
        onLoadMore={loadMore}
        onMarkRead={markRead}
        onMarkAllRead={markAllRead}
        onDeleteAll={deleteAll}
      />
    </>
  )
}

export default NotificationBell
