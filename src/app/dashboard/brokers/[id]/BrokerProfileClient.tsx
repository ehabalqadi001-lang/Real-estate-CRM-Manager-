'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  PauseCircle, PlayCircle, Percent, Key, Copy, Check,
  ChevronLeft, AlertTriangle, CheckCircle2,
} from 'lucide-react'
import { holdBroker, unholdBroker, updateBrokerCommission, resetBrokerPassword } from './actions'

/* ─── shared helpers ─────────────────────────────────────────── */

const btnCls = 'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition disabled:opacity-50'
const inputCls = 'w-full rounded-lg border border-[var(--fi-line)] bg-white px-3 py-2.5 text-sm text-[var(--fi-ink)] outline-none focus:border-[var(--fi-emerald)] focus:ring-2 focus:ring-[var(--fi-emerald)]/20'

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold ${ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
      {ok ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertTriangle className="size-4 shrink-0" />}
      {msg}
    </div>
  )
}

/* ─── Tab nav ─────────────────────────────────────────────────── */

export type Tab = 'profile' | 'sales' | 'documents' | 'commission' | 'settings'

export function TabNav({ active }: { active: Tab }) {
  const tabs: { id: Tab; label: string }[] = [
    { id: 'profile', label: 'الملف الشخصي' },
    { id: 'sales', label: 'المبيعات' },
    { id: 'documents', label: 'الوثائق' },
    { id: 'commission', label: 'إدارة العمولة' },
    { id: 'settings', label: 'الإعدادات' },
  ]
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl border border-[var(--fi-line)] bg-[var(--fi-soft)] p-1">
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={`?tab=${t.id}`}
          className={`shrink-0 rounded-lg px-4 py-2 text-sm font-black transition ${
            active === t.id
              ? 'bg-white text-[var(--fi-ink)] shadow-sm'
              : 'text-[var(--fi-muted)] hover:text-[var(--fi-ink)]'
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  )
}

/* ─── HOLD panel ─────────────────────────────────────────────── */

interface HoldPanelProps {
  brokerId: string
  isHeld: boolean
  holdReason?: string | null
}

export function HoldPanel({ brokerId, isHeld, holdReason }: HoldPanelProps) {
  const [reason, setReason] = useState('')
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [pending, startTransition] = useTransition()

  const doHold = () => {
    if (!reason.trim()) { setMsg({ text: 'يرجى كتابة سبب التعليق', ok: false }); return }
    startTransition(async () => {
      try {
        await holdBroker(brokerId, reason)
        setMsg({ text: 'تم تعليق الحساب بنجاح', ok: true })
        setReason('')
      } catch (e) {
        setMsg({ text: e instanceof Error ? e.message : 'خطأ غير معروف', ok: false })
      }
    })
  }

  const doUnhold = () => {
    startTransition(async () => {
      try {
        await unholdBroker(brokerId)
        setMsg({ text: 'تم رفع التعليق بنجاح', ok: true })
      } catch (e) {
        setMsg({ text: e instanceof Error ? e.message : 'خطأ غير معروف', ok: false })
      }
    })
  }

  return (
    <div className="space-y-4">
      {isHeld && holdReason && (
        <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-orange-600" />
          <div>
            <p className="text-sm font-black text-orange-800">الحساب موقوف حالياً</p>
            <p className="mt-0.5 text-xs text-orange-700">السبب: {holdReason}</p>
          </div>
        </div>
      )}

      {isHeld ? (
        <button onClick={doUnhold} disabled={pending}
          className={`${btnCls} bg-emerald-600 text-white hover:bg-emerald-700`}>
          <PlayCircle className="size-4" />
          {pending ? 'جاري الرفع...' : 'رفع التعليق وإعادة تفعيل الحساب'}
        </button>
      ) : (
        <div className="space-y-3">
          <label className="block text-xs font-bold text-[var(--fi-muted)]">سبب التعليق <span className="text-red-500">*</span></label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="اكتب سبب التعليق بوضوح..."
            className={inputCls + ' resize-none'}
          />
          <button onClick={doHold} disabled={pending || !reason.trim()}
            className={`${btnCls} bg-orange-600 text-white hover:bg-orange-700`}>
            <PauseCircle className="size-4" />
            {pending ? 'جاري التعليق...' : 'تعليق الحساب مؤقتاً'}
          </button>
          <p className="text-xs text-[var(--fi-muted)]">ملاحظة: يتم الاحتفاظ بجميع بيانات الشريك ولا يتم حذف أي شيء</p>
        </div>
      )}

      {msg && <Toast msg={msg.text} ok={msg.ok} />}
    </div>
  )
}

/* ─── Commission panel ───────────────────────────────────────── */

interface CommissionPanelProps {
  brokerId: string
  currentDeveloperRate: number
  currentBrokerRate: number
}

export function CommissionPanel({ brokerId, currentDeveloperRate, currentBrokerRate }: CommissionPanelProps) {
  const [devRate, setDevRate] = useState(currentDeveloperRate)
  const [brkRate, setBrkRate] = useState(currentBrokerRate)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [pending, startTransition] = useTransition()

  const margin = Math.max(0, devRate - brkRate)

  const save = () => {
    if (brkRate > devRate) { setMsg({ text: 'نسبة الشريك لا يمكن أن تتجاوز نسبة المطور', ok: false }); return }
    startTransition(async () => {
      try {
        await updateBrokerCommission(brokerId, devRate, brkRate)
        setMsg({ text: 'تم تحديث العمولة بنجاح', ok: true })
      } catch (e) {
        setMsg({ text: e instanceof Error ? e.message : 'خطأ', ok: false })
      }
    })
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--fi-muted)]">نسبة عمولة المطور للشركة</label>
          <div className="flex items-center gap-2">
            <input type="number" min={0} max={30} step={0.25} value={devRate}
              onChange={(e) => setDevRate(parseFloat(e.target.value) || 0)}
              className={inputCls + ' w-24 text-center'} />
            <span className="font-bold text-[var(--fi-muted)]">%</span>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--fi-muted)]">نسبة عمولة الشريك من المطور</label>
          <div className="flex items-center gap-2">
            <input type="number" min={0} max={30} step={0.25} value={brkRate}
              onChange={(e) => setBrkRate(parseFloat(e.target.value) || 0)}
              className={inputCls + ' w-24 text-center'} />
            <span className="font-bold text-[var(--fi-muted)]">%</span>
          </div>
        </div>
      </div>

      {/* Visual breakdown */}
      <div className="rounded-xl border border-[var(--fi-line)] bg-[var(--fi-soft)] p-4">
        <p className="mb-3 text-xs font-black text-[var(--fi-muted)] uppercase tracking-wide">توزيع العمولة على صفقة بقيمة 1,000,000 ج.م</p>
        <div className="space-y-2">
          {[
            { label: 'إجمالي عمولة المطور', value: (1_000_000 * devRate / 100), color: 'bg-blue-500' },
            { label: 'عمولة الشريك', value: (1_000_000 * brkRate / 100), color: 'bg-[var(--fi-emerald)]' },
            { label: 'هامش الشركة', value: (1_000_000 * margin / 100), color: 'bg-purple-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={`size-2.5 rounded-full ${color}`} />
                <span className="text-xs font-bold text-[var(--fi-muted)]">{label}</span>
              </div>
              <span className="text-sm font-black text-[var(--fi-ink)]">{value.toLocaleString('ar-EG')} ج.م</span>
            </div>
          ))}
        </div>
      </div>

      <button onClick={save} disabled={pending}
        className={`${btnCls} bg-[var(--fi-emerald)] text-white hover:opacity-90`}>
        <Percent className="size-4" />
        {pending ? 'جاري الحفظ...' : 'حفظ نسب العمولة'}
      </button>

      {msg && <Toast msg={msg.text} ok={msg.ok} />}
    </div>
  )
}

/* ─── Password reset panel ───────────────────────────────────── */

export function PasswordResetPanel({ brokerEmail }: { brokerEmail: string }) {
  const [link, setLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [pending, startTransition] = useTransition()

  const generate = () => {
    startTransition(async () => {
      try {
        const result = await resetBrokerPassword(brokerEmail)
        setLink(result.link)
        setMsg({ text: 'تم إنشاء رابط إعادة تعيين كلمة المرور', ok: true })
      } catch (e) {
        setMsg({ text: e instanceof Error ? e.message : 'خطأ', ok: false })
      }
    })
  }

  const copy = async () => {
    if (!link) return
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--fi-muted)]">
        إنشاء رابط إعادة تعيين كلمة المرور للشريك ({brokerEmail}) وإرساله له مباشرة.
      </p>

      <button onClick={generate} disabled={pending}
        className={`${btnCls} bg-slate-900 text-white hover:bg-slate-700`}>
        <Key className="size-4" />
        {pending ? 'جاري الإنشاء...' : 'إنشاء رابط إعادة تعيين'}
      </button>

      {link && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-xl border border-[var(--fi-line)] bg-[var(--fi-soft)] p-3">
            <code className="flex-1 break-all text-xs text-[var(--fi-ink)]">{link}</code>
            <button onClick={copy}
              className="shrink-0 rounded-lg border border-[var(--fi-line)] bg-white p-1.5 text-[var(--fi-muted)] transition hover:text-[var(--fi-ink)]">
              {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
            </button>
          </div>
          <p className="text-xs text-orange-600 font-bold">هذا الرابط صالح لمرة واحدة فقط — شاركه مع الشريك فوراً</p>
        </div>
      )}

      {msg && <Toast msg={msg.text} ok={msg.ok} />}
    </div>
  )
}

/* ─── Back button ─────────────────────────────────────────────── */

export function BackButton() {
  return (
    <Link href="/dashboard/brokers"
      className="inline-flex items-center gap-2 text-sm font-bold text-[var(--fi-emerald)]">
      <ChevronLeft className="size-4" /> العودة لقائمة الوسطاء
    </Link>
  )
}
