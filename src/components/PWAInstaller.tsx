'use client'

import { useEffect, useState } from 'react'
import { Download, X, Bell } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstaller() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [pushDismissed, setPushDismissed] = useState(() =>
    typeof window !== 'undefined' && !!sessionStorage.getItem('push-banner-dismissed')
  )
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    if (typeof window === 'undefined') return 'default'
    return 'Notification' in window ? Notification.permission : 'unsupported'
  })

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/sw.js').catch(() => {
        // The CRM remains usable even when service workers are blocked.
      })
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
      const dismissed = sessionStorage.getItem('pwa-banner-dismissed')
      if (!dismissed) setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setInstallPrompt(null)
    setShowBanner(false)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    sessionStorage.setItem('pwa-banner-dismissed', '1')
  }

  const requestPush = async () => {
    if (!('Notification' in window)) {
      setPushPermission('unsupported')
      return
    }

    if (Notification.permission === 'denied') {
      setPushPermission('denied')
      return
    }

    const result = await Notification.requestPermission()
    setPushPermission(result)
  }

  const showPushBanner = !pushDismissed && pushPermission !== 'granted' && pushPermission !== 'unsupported'

  const dismissPush = () => {
    setPushDismissed(true)
    sessionStorage.setItem('push-banner-dismissed', '1')
  }

  if (!showBanner && !showPushBanner) return null

  return (
    <div className="fixed bottom-4 left-4 z-50 flex max-w-xs flex-col gap-2" dir="rtl">
      {showPushBanner && (
        <div className="flex items-start gap-3 rounded-2xl bg-slate-900 p-4 text-white shadow-2xl">
          <Bell size={18} className="mt-0.5 flex-shrink-0 text-blue-400" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">تفعيل الإشعارات الفورية</p>
            <p className="mt-0.5 text-xs text-slate-400">
              {pushPermission === 'denied'
                ? 'تم رفض الإذن من المتصفح. فعّل الإشعارات من إعدادات الموقع في شريط العنوان.'
                : 'احصل على تنبيهات الصفقات والعملاء فور حدوثها'}
            </p>
            {pushPermission !== 'denied' && (
              <button
                onClick={requestPush}
                className="mt-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-blue-700"
              >
                تفعيل الآن
              </button>
            )}
          </div>
          <button onClick={dismissPush} className="flex-shrink-0 text-slate-500 hover:text-slate-300">
            <X size={15} />
          </button>
        </div>
      )}

      {showBanner && installPrompt && (
        <div className="flex items-start gap-3 rounded-2xl bg-slate-900 p-4 text-white shadow-2xl">
          <Download size={18} className="mt-0.5 flex-shrink-0 text-emerald-400" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">تثبيت التطبيق</p>
            <p className="mt-0.5 text-xs text-slate-400">أضف CRM إلى شاشتك الرئيسية للوصول السريع</p>
            <button
              onClick={handleInstall}
              className="mt-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
            >
              تثبيت التطبيق
            </button>
          </div>
          <button onClick={handleDismiss} className="flex-shrink-0 text-slate-500 hover:text-slate-300">
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  )
}
