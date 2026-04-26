'use client'

import { Bell, X, CheckCheck, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react'
import { useNotificationStore, AppNotification } from '@/store/notificationStore'
import { useEffect, useRef } from 'react'

const TYPE_ICON: Record<AppNotification['type'], React.ElementType> = {
  info:    Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error:   AlertCircle,
}
const TYPE_COLOR: Record<AppNotification['type'], string> = {
  info:    'text-blue-500',
  success: 'text-emerald-500',
  warning: 'text-amber-500',
  error:   'text-red-500',
}

export default function NotificationBell() {
  const { notifications, unreadCount, panelOpen, togglePanel, closePanel, markAllRead, markRead } = useNotificationStore()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) closePanel()
    }
    if (panelOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [panelOpen, closePanel])

  return (
    <div className="relative" ref={panelRef}>
      <button onClick={togglePanel}
        className="relative w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-black text-white flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {panelOpen && (
        <div className="absolute left-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden"
          // eslint-disable-next-line no-inline-styles/no-inline-styles
          style={{ right: 'auto', left: '-280px' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
            <span className="font-black text-slate-800 text-sm">الإشعارات</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead}
                  className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1">
                  <CheckCheck size={13} /> قراءة الكل
                </button>
              )}
              <button onClick={closePanel} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <Bell size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs font-semibold">لا توجد إشعارات</p>
              </div>
            ) : notifications.map((n) => {
              const Icon = TYPE_ICON[n.type]
              return (
                <button key={n.id} onClick={() => markRead(n.id)}
                  className={`w-full text-right px-4 py-3 hover:bg-slate-50 transition-colors flex gap-3 items-start ${n.read ? 'opacity-60' : ''}`}>
                  <Icon size={16} className={`mt-0.5 flex-shrink-0 ${TYPE_COLOR[n.type]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black text-slate-800 truncate">{n.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {new Date(n.created_at).toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
