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
  const [pushGranted, setPushGranted] = useState(false)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/sw.js').then(reg => {
        console.log('[SW] Registered', reg.scope)
      })
    }

    // Check push permission
    if ('Notification' in window) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPushGranted(Notification.permission === 'granted')
    }

    // Intercept install prompt
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
    if (!('Notification' in window)) return
    const result = await Notification.requestPermission()
    setPushGranted(result === 'granted')
  }

  if (!showBanner && pushGranted) return null

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 max-w-xs" dir="rtl">
      {/* Push permission banner */}
      {!pushGranted && (
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl flex items-start gap-3">
          <Bell size={18} className="text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">تفعيل الإشعارات الفورية</p>
            <p className="text-xs text-slate-400 mt-0.5">احصل على تنبيهات الصفقات والعملاء فور حدوثها</p>
            <button onClick={requestPush}
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
              تفعيل الآن
            </button>
          </div>
        </div>
      )}

      {/* PWA install banner */}
      {showBanner && installPrompt && (
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl flex items-start gap-3">
          <Download size={18} className="text-emerald-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">تثبيت التطبيق</p>
            <p className="text-xs text-slate-400 mt-0.5">أضف CRM إلى شاشتك الرئيسية للوصول السريع</p>
            <button onClick={handleInstall}
              className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
              تثبيت التطبيق
            </button>
          </div>
          <button onClick={handleDismiss} className="text-slate-500 hover:text-slate-300 flex-shrink-0">
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  )
}
