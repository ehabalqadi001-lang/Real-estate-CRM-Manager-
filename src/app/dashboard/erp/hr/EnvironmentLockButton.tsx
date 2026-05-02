'use client'

import { useState, useTransition } from 'react'
import { MapPin, Wifi, LockKeyhole, Loader2 } from 'lucide-react'
import { bindEmployeeEnvironmentAction } from './actions'

export function EnvironmentLockButton({
  employeeId,
  locked,
}: {
  employeeId: string
  locked: boolean
}) {
  const [wifiSsid, setWifiSsid] = useState('')
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  function lockEnvironment() {
    setMessage('جاري قراءة الموقع وربط البيئة...')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        startTransition(async () => {
          const result = await bindEmployeeEnvironmentAction({
            employeeId,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            wifiSsid,
            radius: 150,
          })
          setMessage(result.message)
        })
      },
      () => {
        startTransition(async () => {
          const result = await bindEmployeeEnvironmentAction({
            employeeId,
            latitude: null,
            longitude: null,
            wifiSsid,
            radius: 150,
          })
          setMessage(result.message)
        })
      },
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 30000 },
    )
  }

  return (
    <div className="min-w-[220px] space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Wifi className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[var(--fi-muted)]" />
          <input
            value={wifiSsid}
            onChange={(event) => setWifiSsid(event.target.value)}
            className="h-9 w-full rounded-lg border border-[var(--fi-line)] bg-white pr-9 pl-3 text-xs font-bold outline-none focus:border-[var(--fi-emerald)] dark:bg-white/5"
            placeholder="اسم شبكة Wi-Fi اختياري"
          />
        </div>
        <button
          type="button"
          disabled={isPending}
          onClick={lockEnvironment}
          className="flex h-9 items-center gap-2 rounded-lg border border-[var(--fi-line)] bg-[var(--fi-soft)] px-3 text-xs font-black text-[var(--fi-emerald)] transition hover:border-[var(--fi-emerald)] disabled:opacity-60"
        >
          {isPending ? <Loader2 className="size-3.5 animate-spin" /> : locked ? <LockKeyhole className="size-3.5" /> : <MapPin className="size-3.5" />}
          {locked ? 'تحديث القفل' : 'ربط البيئة'}
        </button>
      </div>
      {message ? <p className="text-xs font-bold text-[var(--fi-muted)]">{message}</p> : null}
    </div>
  )
}
