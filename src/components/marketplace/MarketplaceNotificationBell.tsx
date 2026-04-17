'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell, CheckCircle2, Circle, X } from 'lucide-react'
import { getMyNotifications, markNotificationAsRead } from '@/app/dashboard/notifications/actions'

type NotificationItem = {
  id: string
  title: string
  message: string
  is_read: boolean
  link: string | null
  created_at?: string
}

export default function MarketplaceNotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let mounted = true
    async function loadNotifications() {
      const data = await getMyNotifications()
      if (mounted) setItems(data as NotificationItem[])
    }
    void loadNotifications()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [open])

  const unread = items.filter((item) => !item.is_read).length

  async function openNotification(item: NotificationItem) {
    await markNotificationAsRead(item.id)
    setItems((current) => current.map((n) => (n.id === item.id ? { ...n, is_read: true } : n)))
    setOpen(false)
    if (item.link) window.location.assign(item.link)
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        aria-label="الإشعارات"
        onClick={() => setOpen((value) => !value)}
        className="relative flex size-10 items-center justify-center rounded-lg border border-[#DDE6E4] bg-white text-[#17375E] transition hover:bg-[#EEF6F5]"
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[#B54747] text-[10px] font-black text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-3 w-80 overflow-hidden rounded-lg border border-[#DDE6E4] bg-white text-right shadow-xl" dir="rtl">
          <div className="flex items-center justify-between border-b border-[#DDE6E4] bg-[#FBFCFA] px-4 py-3">
            <div>
              <p className="text-sm font-black text-[#102033]">الإشعارات</p>
              <p className="text-xs font-bold text-[#64748B]">{unread ? `${unread} جديد` : 'لا توجد إشعارات جديدة'}</p>
            </div>
            <button
              type="button"
              aria-label="إغلاق"
              onClick={() => setOpen(false)}
              className="flex size-8 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#EEF6F5]"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="mx-auto size-8 text-[#DDE6E4]" />
                <p className="mt-3 text-sm font-bold text-[#64748B]">لا توجد إشعارات حاليا</p>
              </div>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openNotification(item)}
                  className="flex w-full gap-3 border-b border-[#EEF6F5] px-4 py-3 text-right transition hover:bg-[#EEF6F5]"
                >
                  <span className="mt-1 shrink-0">
                    {item.is_read ? (
                      <CheckCircle2 className="size-3.5 text-[#0F8F83]" />
                    ) : (
                      <Circle className="size-3.5 fill-[#17375E] text-[#17375E]" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-black text-[#102033]">{item.title}</span>
                    <span className="mt-1 block text-xs font-semibold leading-5 text-[#64748B]">{item.message}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
