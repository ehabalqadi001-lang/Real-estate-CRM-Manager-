'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, CheckCheck, Circle, CheckCircle2, Info, CheckCircle, AlertTriangle, XCircle, Trash2, ExternalLink } from 'lucide-react'
import { getMyNotifications, markNotificationAsRead } from './actions'
import { useNotificationStore } from '@/store/notificationStore'

interface DBNotification {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  link: string | null
  created_at: string
}

const typeConfig = {
  info:    { icon: Info,          bg: 'bg-blue-50',   text: 'text-blue-600',   badge: 'bg-blue-100 text-blue-700',   label: 'معلومة' },
  success: { icon: CheckCircle,   bg: 'bg-emerald-50', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700', label: 'نجاح' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-50',  text: 'text-amber-600',  badge: 'bg-amber-100 text-amber-700',  label: 'تحذير' },
  error:   { icon: XCircle,       bg: 'bg-red-50',    text: 'text-red-600',    badge: 'bg-red-100 text-red-700',    label: 'خطأ' },
}

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60)   return 'الآن'
  if (diff < 3600) return `${Math.floor(diff / 60)} د`
  if (diff < 86400) return `${Math.floor(diff / 3600)} س`
  return new Date(dateStr).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })
}

export default function NotificationsPage() {
  const [dbNotifs, setDbNotifs]   = useState<DBNotification[]>([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState<'all' | 'unread'>('all')
  const rtNotifs   = useNotificationStore((s) => s.notifications)
  const markAllRt  = useNotificationStore((s) => s.markAllRead)
  const markOneRt  = useNotificationStore((s) => s.markRead)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await getMyNotifications()
    setDbNotifs(data)
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  const handleRead = async (id: string, link: string | null) => {
    await markNotificationAsRead(id)
    setDbNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    if (link) window.location.assign(link)
  }

  const handleMarkAllRead = async () => {
    markAllRt()
    const unread = dbNotifs.filter(n => !n.is_read)
    await Promise.all(unread.map(n => markNotificationAsRead(n.id)))
    setDbNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const shownDb = filter === 'unread' ? dbNotifs.filter(n => !n.is_read) : dbNotifs
  const shownRt = filter === 'unread' ? rtNotifs.filter(n => !n.read)    : rtNotifs
  const totalUnread = dbNotifs.filter(n => !n.is_read).length + rtNotifs.filter(n => !n.read).length

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6" dir="rtl">

      {/* Header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-xl flex items-center justify-center">
            <Bell size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">الإشعارات</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {totalUnread > 0 ? `${totalUnread} إشعار غير مقروء` : 'كل الإشعارات مقروءة'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter(f => f === 'all' ? 'unread' : 'all')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
              filter === 'unread' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {filter === 'unread' ? 'عرض الكل' : 'غير المقروءة'}
          </button>
          {totalUnread > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition-colors"
            >
              <CheckCheck size={14} /> تعليم الكل كمقروء
            </button>
          )}
        </div>
      </div>

      {/* Realtime (in-memory) */}
      {shownRt.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-400 px-1">مباشر — هذه الجلسة</p>
          {shownRt.map(n => {
            const cfg = typeConfig[n.type as keyof typeof typeConfig] ?? typeConfig.info
            const Icon = cfg.icon
            return (
              <div key={`rt-${n.id}`}
                className={`flex gap-4 items-start p-4 rounded-2xl border transition-colors ${
                  !n.read ? `${cfg.bg} border-transparent` : 'bg-white border-slate-100'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg} ${cfg.text}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-black ${!n.read ? 'text-slate-900' : 'text-slate-500'}`}>{n.title}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${cfg.badge}`}>{cfg.label}</span>
                      <span className="text-[10px] text-slate-400">{timeAgo(n.created_at)}</span>
                    </div>
                  </div>
                  {n.message && <p className="text-xs text-slate-500 mt-1">{n.message}</p>}
                </div>
                <div className="shrink-0">
                  {!n.read
                    ? <Circle size={10} className="text-blue-600 fill-blue-600 mt-1" onClick={() => markOneRt(n.id)} />
                    : <CheckCircle2 size={10} className="text-slate-300 mt-1" />}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* DB notifications */}
      <div className="space-y-2">
        {shownRt.length > 0 && <p className="text-xs font-bold text-slate-400 px-1">السجل المحفوظ</p>}
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
          ))
        ) : shownDb.length === 0 && shownRt.length === 0 ? (
          <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-100">
            <Bell size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-bold text-sm">لا توجد إشعارات</p>
          </div>
        ) : shownDb.map(n => {
          const cfg = typeConfig[n.type as keyof typeof typeConfig] ?? typeConfig.info
          const Icon = cfg.icon
          return (
            <div key={n.id}
              onClick={() => handleRead(n.id, n.link)}
              className={`flex gap-4 items-start p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-sm ${
                !n.is_read ? `${cfg.bg} border-transparent` : 'bg-white border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg} ${cfg.text}`}>
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm font-black ${!n.is_read ? 'text-slate-900' : 'text-slate-500'}`}>{n.title}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${cfg.badge}`}>{cfg.label}</span>
                    <span className="text-[10px] text-slate-400">{timeAgo(n.created_at)}</span>
                  </div>
                </div>
                {n.message && <p className="text-xs text-slate-500 mt-1">{n.message}</p>}
              </div>
              <div className="flex items-center gap-1.5 shrink-0 mt-1">
                {n.link && <ExternalLink size={12} className="text-slate-400" />}
                {!n.is_read
                  ? <Circle size={10} className="text-blue-600 fill-blue-600" />
                  : <Trash2 size={10} className="text-slate-200" />}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
