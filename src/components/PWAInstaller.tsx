'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstaller() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
      const dismissed = localStorage.getItem('pwa-banner-dismissed')
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
    localStorage.setItem('pwa-banner-dismissed', '1')
  }

  if (!showBanner || !installPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-xs" dir="rtl">
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
    </div>
  )
}
