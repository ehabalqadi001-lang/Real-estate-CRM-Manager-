'use client'

import { useState, useEffect } from 'react'
import { Bell, CheckCircle2, Circle } from 'lucide-react'
import { getMyNotifications, markNotificationAsRead } from '@/app/dashboard/notifications/actions'

interface Notification {
  id: string
  title: string
  message: string
  is_read: boolean
  link: string | null
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)

  // تشغيل الرادار فور تحميل الواجهة
  useEffect(() => {
    let mounted = true
    async function load() {
      const data = await getMyNotifications()
      if (mounted) setNotifications(data)
    }
    load()
    return () => { mounted = false }
  }, [])

  // حساب الإشعارات غير المقروءة
  const unreadCount = notifications.filter(n => !n.is_read).length

  // تنفيذ الأوامر عند الضغط على الإشعار
  const handleRead = async (id: string, link: string | null) => {
    await markNotificationAsRead(id)
    // تحديث الواجهة فوراً (Optimistic UI)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setIsOpen(false)
    
    if (link) {
      window.location.assign(link) // التوجيه الفوري للصندوق الأسود
    }
  }

  return (
    <div className="relative">
      {/* أيقونة الجرس */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative p-2 text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 rounded-lg shadow-inner"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white shadow-sm border-2 border-[#0A1128] animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* نافذة الإشعارات المنسدلة */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 text-right" dir="rtl">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-black text-slate-800">جهاز اللاسلكي</h3>
            {unreadCount > 0 && <span className="text-[10px] font-bold text-white bg-red-500 px-2.5 py-1 rounded-full">{unreadCount} جديد</span>}
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-bold text-sm flex flex-col items-center gap-2">
                <Bell size={32} className="text-slate-200" />
                الرادار صامت، لا توجد تكليفات.
              </div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id} 
                  onClick={() => handleRead(n.id, n.link)} 
                  className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${!n.is_read ? 'bg-blue-50/40' : ''}`}
                >
                  <div className="flex gap-3 items-start">
                    <div className="mt-1 shrink-0">
                      {!n.is_read ? <Circle size={12} className="text-blue-600 fill-blue-600" /> : <CheckCircle2 size={12} className="text-slate-300" />}
                    </div>
                    <div>
                      <p className={`text-sm ${!n.is_read ? 'font-black text-slate-900' : 'font-bold text-slate-500'}`}>{n.title}</p>
                      <p className={`text-xs mt-1 ${!n.is_read ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>{n.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}