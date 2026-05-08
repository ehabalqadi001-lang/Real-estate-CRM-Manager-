'use client'

import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { saveApiKey, deleteApiKey } from './actions'
import { Plus, Trash2, Eye, EyeOff, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react'

const KEY_PRESETS = [
  { name: 'openai',         label: 'OpenAI API Key',         placeholder: 'sk-...' },
  { name: 'heygen',         label: 'HeyGen API Key',         placeholder: 'heygen-...' },
  { name: 'elevenlabs',     label: 'ElevenLabs API Key',     placeholder: 'xi-...' },
  { name: 'meta_ads',       label: 'Meta Ads Access Token',  placeholder: 'EAA...' },
  { name: 'google_ads',     label: 'Google Ads Developer Token', placeholder: 'token...' },
  { name: 'resend',         label: 'Resend API Key',         placeholder: 're_...' },
  { name: 'whatsapp_token', label: 'WhatsApp Access Token',  placeholder: 'Bearer...' },
]

interface ExistingKey { id: string; key_name: string; hint: string | null; updated_at: string }

export function ApiKeyForm({ existing }: { existing: ExistingKey[] }) {
  const [selectedPreset, setSelectedPreset] = useState(KEY_PRESETS[0].name)
  const [customName, setCustomName] = useState('')
  const [value, setValue] = useState('')
  const [showValue, setShowValue] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [pending, start] = useTransition()

  const preset = KEY_PRESETS.find((p) => p.name === selectedPreset)
  const isCustom = selectedPreset === '__custom__'
  const keyName = isCustom ? customName : selectedPreset

  const handleSave = () => {
    if (!keyName || !value) return
    setResult(null)
    const fd = new FormData()
    fd.set('key_name', keyName)
    fd.set('value', value)
    start(async () => {
      const res = await saveApiKey(fd)
      if (res?.error) setResult({ ok: false, msg: res.error })
      else { setResult({ ok: true, msg: 'تم حفظ المفتاح بأمان' }); setValue('') }
    })
  }

  const handleDelete = (id: string) => {
    start(async () => { await deleteApiKey(id) })
  }

  return (
    <div className="space-y-6">
      {/* Add Key */}
      <div className="rounded-2xl border border-[#DDE6E4] bg-white p-5 shadow-sm dark:bg-slate-900">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="size-4 text-[#0F8F83]" />
          <p className="font-black text-[#102033] dark:text-white">إضافة مفتاح API</p>
        </div>
        <div className="space-y-3">
          <select
            value={selectedPreset}
            onChange={(e) => setSelectedPreset(e.target.value)}
            className="w-full rounded-xl border border-[#DDE6E4] bg-[#FBFCFA] px-3 py-2 text-sm font-semibold dark:bg-slate-800"
          >
            {KEY_PRESETS.map((p) => (
              <option key={p.name} value={p.name}>{p.label}</option>
            ))}
            <option value="__custom__">مفتاح مخصص…</option>
          </select>

          {isCustom && (
            <Input
              placeholder="اسم المفتاح (مثال: tiktok_token)"
              value={customName}
              onChange={(e) => setCustomName(e.target.value.toLowerCase().replace(/\s/g, '_'))}
              dir="ltr"
            />
          )}

          <div className="relative">
            <Input
              type={showValue ? 'text' : 'password'}
              placeholder={preset?.placeholder ?? 'قيمة المفتاح…'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              dir="ltr"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowValue((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              {showValue ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>

          {result && (
            <p className={`flex items-center gap-1.5 text-xs font-semibold ${result.ok ? 'text-[#0F8F83]' : 'text-red-600'}`}>
              {result.ok ? <CheckCircle2 className="size-3.5" /> : <AlertCircle className="size-3.5" />}
              {result.msg}
            </p>
          )}

          <Button
            disabled={pending || !value || !keyName}
            onClick={handleSave}
            className="w-full bg-[#0F8F83] font-semibold text-white hover:bg-[#0B6F66]"
          >
            {pending ? 'جاري التشفير والحفظ…' : 'حفظ المفتاح'}
          </Button>
        </div>
      </div>

      {/* Existing Keys */}
      {existing.length > 0 && (
        <div className="rounded-2xl border border-[#DDE6E4] bg-white p-5 shadow-sm dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-2">
            <KeyRound className="size-4 text-[#C9964A]" />
            <p className="font-black text-[#102033] dark:text-white">المفاتيح المحفوظة</p>
          </div>
          <div className="space-y-2">
            {existing.map((k) => (
              <div key={k.id} className="flex items-center justify-between rounded-xl border border-[#DDE6E4] px-3 py-2.5">
                <div>
                  <p className="text-sm font-black text-[#102033] dark:text-white">{k.key_name}</p>
                  <p className="font-mono text-xs text-slate-400">{k.hint ?? '••••'}</p>
                </div>
                <button
                  onClick={() => handleDelete(k.id)}
                  className="text-red-400 hover:text-red-600"
                  aria-label="Delete key"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
