'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Clock3, Loader2, MapPin, ShieldAlert, ShieldCheck, Wifi } from 'lucide-react'
import { attendancePunchAction } from './actions'

export type SmartAttendanceEmployee = {
  id: string
  fullName: string
  jobTitle: string | null
  isEnvLocked: boolean
  todayCheckIn: string | null
  todayCheckOut: string | null
}

export function SmartAttendanceWidget({ employee }: { employee: SmartAttendanceEmployee | null }) {
  const [wifiSsid, setWifiSsid] = useState('')
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  const checkedIn = Boolean(employee?.todayCheckIn)
  const checkedOut = Boolean(employee?.todayCheckOut)
  const disabled = !employee || !employee.isEnvLocked || checkedOut || isPending

  function punch() {
    setMessage('جاري التحقق من البيئة...')

    navigator.geolocation.getCurrentPosition(
      (position) => submit(position.coords.latitude, position.coords.longitude),
      () => submit(null, null),
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 30000 },
    )
  }

  function submit(latitude: number | null, longitude: number | null) {
    startTransition(async () => {
      const result = await attendancePunchAction({ latitude, longitude, wifiSsid })
      setMessage(result.message)
    })
  }

  return (
    <section className="ds-card p-5" dir="rtl">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--fi-emerald)]">SMART ATTENDANCE</p>
          <h2 className="mt-1 text-xl font-black text-[var(--fi-ink)]">تسجيل الحضور الذكي</h2>
          <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">
            الزر يعمل فقط عند تطابق IP أو Wi-Fi أو نطاق GPS المسموح.
          </p>
        </div>
        <span className={`flex size-12 shrink-0 items-center justify-center rounded-lg ${
          employee?.isEnvLocked ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
        }`}>
          {employee?.isEnvLocked ? <ShieldCheck className="size-5" /> : <ShieldAlert className="size-5" />}
        </span>
      </div>

      {!employee ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          لا يوجد ملف موظف مرتبط بحسابك.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-soft)] p-4">
            <p className="text-sm font-black text-[var(--fi-ink)]">{employee.fullName}</p>
            <p className="mt-1 text-xs font-bold text-[var(--fi-muted)]">{employee.jobTitle ?? 'موظف'}</p>
          </div>

          {!employee.isEnvLocked ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
              بيئة العمل غير مربوطة. يجب على مدير الموارد البشرية أو مدير النظام ربط البيئة أولاً.
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <StatusCard label="الحضور" value={formatTime(employee.todayCheckIn)} done={checkedIn} />
            <StatusCard label="الانصراف" value={formatTime(employee.todayCheckOut)} done={checkedOut} />
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-black text-[var(--fi-ink)]">اسم شبكة Wi-Fi الحالية</span>
            <span className="relative block">
              <Wifi className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[var(--fi-muted)]" />
              <input
                value={wifiSsid}
                onChange={(event) => setWifiSsid(event.target.value)}
                className="h-11 w-full rounded-lg border border-[var(--fi-line)] bg-white pr-9 pl-3 text-sm font-bold outline-none focus:border-[var(--fi-emerald)] dark:bg-white/5"
                placeholder="اكتب اسم الشبكة إن كان مطلوباً"
              />
            </span>
          </label>

          <button
            type="button"
            disabled={disabled}
            onClick={punch}
            className="fi-primary-button flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />}
            {checkedOut ? 'تم تسجيل اليوم بالكامل' : checkedIn ? 'تسجيل الانصراف' : 'تسجيل الحضور الآن'}
          </button>

          {message ? (
            <div className={`rounded-lg border px-4 py-3 text-sm font-bold ${
              message.includes('خارج') || message.includes('تعذر') || message.includes('لم يتم')
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}>
              {message}
            </div>
          ) : null}
        </div>
      )}
    </section>
  )
}

function StatusCard({ label, value, done }: { label: string; value: string; done: boolean }) {
  return (
    <div className="rounded-lg border border-[var(--fi-line)] bg-white p-4 dark:bg-white/5">
      <div className="flex items-center gap-2 text-xs font-black text-[var(--fi-muted)]">
        {done ? <CheckCircle2 className="size-4 text-emerald-600" /> : <Clock3 className="size-4" />}
        {label}
      </div>
      <p className="mt-2 text-lg font-black text-[var(--fi-ink)]">{value}</p>
    </div>
  )
}

function formatTime(value: string | null) {
  if (!value) return 'لم يسجل'
  return new Intl.DateTimeFormat('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
