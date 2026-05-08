'use client'

import { useState, useTransition } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { generateCopyAction, generateVideoAction } from './actions'
import { Wand2, Video, FileText, MessageSquare, Mail, Copy, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

type AssetType = 'ad_copy' | 'social_post' | 'email' | 'script'
type Tab = 'copy' | 'video'

const ASSET_TYPES: { key: AssetType; label: string; icon: React.ReactNode }[] = [
  { key: 'ad_copy',     label: 'إعلان Meta/Google', icon: <FileText className="size-4" /> },
  { key: 'social_post', label: 'منشور سوشيال',     icon: <MessageSquare className="size-4" /> },
  { key: 'email',       label: 'بريد إلكتروني',    icon: <Mail className="size-4" /> },
  { key: 'script',      label: 'سكريبت فيديو',     icon: <Video className="size-4" /> },
]

export function CreativeStudioClient() {
  const [tab, setTab] = useState<Tab>('copy')
  const [assetType, setAssetType] = useState<AssetType>('ad_copy')
  const [propertyRef, setPropertyRef] = useState('')
  const [audience, setAudience] = useState('مشترين عقاريين مصريين، 30-50 سنة')
  const [tone, setTone] = useState('احترافي ومقنع')
  const [output, setOutput] = useState('')
  const [videoScript, setVideoScript] = useState('')
  const [videoResult, setVideoResult] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [pending, start] = useTransition()

  const handleGenerate = () => {
    if (!propertyRef) return
    setOutput(''); setError('')
    const fd = new FormData()
    fd.set('asset_type', assetType)
    fd.set('property_ref', propertyRef)
    fd.set('audience', audience)
    fd.set('tone', tone)
    start(async () => {
      const res = await generateCopyAction(fd)
      if (res?.error) setError(res.error)
      else setOutput(res.output ?? '')
    })
  }

  const handleVideo = () => {
    if (!videoScript) return
    setVideoResult(''); setError('')
    const fd = new FormData()
    fd.set('script', videoScript)
    start(async () => {
      const res = await generateVideoAction(fd)
      if (res?.error) setError(res.error)
      else setVideoResult(`تم إرسال طلب الفيديو — Video ID: ${res.videoId}`)
    })
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 rounded-2xl border border-[#DDE6E4] bg-[#FBFCFA] p-1.5 dark:bg-slate-800">
        {([['copy', 'توليد النصوص', <Wand2 className="size-4" key="w" />], ['video', 'توليد الفيديو', <Video className="size-4" key="v" />]] as [Tab, string, React.ReactNode][]).map(([key, label, icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-black transition ${tab === key ? 'bg-[#0F8F83] text-white shadow' : 'text-slate-500 hover:text-[#0F8F83]'}`}
          >
            {icon}{label}
          </button>
        ))}
      </div>

      {tab === 'copy' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input */}
          <div className="space-y-4 rounded-2xl border border-[#DDE6E4] bg-white p-5 shadow-sm dark:bg-slate-900">
            <p className="font-black text-[#102033] dark:text-white">إعدادات المحتوى</p>

            <div className="flex flex-wrap gap-2">
              {ASSET_TYPES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setAssetType(t.key)}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${assetType === t.key ? 'border-[#0F8F83] bg-[#0F8F83]/10 text-[#0F8F83]' : 'border-[#DDE6E4] text-slate-500'}`}
                >
                  {t.icon}{t.label}
                </button>
              ))}
            </div>

            <div>
              <label className="mb-1 block text-xs font-black text-slate-500">العقار أو السياق</label>
              <Textarea
                placeholder="مثال: فيلا 350م في التجمع الخامس، كمبوند سيليا، 4 غرف نوم، حمام سباحة، تسليم 2026"
                value={propertyRef}
                onChange={(e) => setPropertyRef(e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-black text-slate-500">الجمهور المستهدف</label>
              <Input value={audience} onChange={(e) => setAudience(e.target.value)} />
            </div>

            <div>
              <label className="mb-1 block text-xs font-black text-slate-500">أسلوب الكتابة</label>
              <Input value={tone} onChange={(e) => setTone(e.target.value)} />
            </div>

            {error && (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
                <AlertCircle className="size-3.5" />{error}
              </p>
            )}

            <Button
              disabled={pending || !propertyRef}
              onClick={handleGenerate}
              className="w-full bg-[#0F8F83] font-semibold text-white hover:bg-[#0B6F66]"
            >
              {pending ? <><Loader2 className="size-4 animate-spin" />جاري التوليد…</> : <><Wand2 className="size-4" />توليد 3 نسخ</>}
            </Button>
          </div>

          {/* Output */}
          <div className="relative rounded-2xl border border-[#DDE6E4] bg-white p-5 shadow-sm dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-black text-[#102033] dark:text-white">النتيجة</p>
              {output && (
                <button onClick={handleCopy} className="flex items-center gap-1 text-xs font-semibold text-[#0F8F83]">
                  {copied ? <CheckCircle2 className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copied ? 'تم النسخ' : 'نسخ'}
                </button>
              )}
            </div>
            {pending && (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="size-8 animate-spin text-[#0F8F83]" />
              </div>
            )}
            {!pending && output && (
              <pre className="whitespace-pre-wrap text-sm font-semibold text-[#102033] leading-7 dark:text-slate-200">{output}</pre>
            )}
            {!pending && !output && (
              <div className="flex h-40 items-center justify-center text-sm font-semibold text-slate-300">
                سيظهر المحتوى المولّد هنا…
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'video' && (
        <div className="max-w-2xl space-y-4 rounded-2xl border border-[#DDE6E4] bg-white p-5 shadow-sm dark:bg-slate-900">
          <p className="font-black text-[#102033] dark:text-white">توليد فيديو HeyGen</p>
          <p className="text-xs font-semibold text-slate-500">
            يتطلب إضافة HeyGen API Key في <a href="/admin/api-vault" className="text-[#0F8F83] underline">API Vault</a> أولاً.
          </p>

          <div>
            <label className="mb-1 block text-xs font-black text-slate-500">نص الفيديو (Script)</label>
            <Textarea
              placeholder="اكتب نص الفيديو هنا — المتحدث الرقمي سيقرأه بصوت طبيعي…"
              value={videoScript}
              onChange={(e) => setVideoScript(e.target.value)}
              rows={6}
            />
          </div>

          {error && (
            <p className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
              <AlertCircle className="size-3.5" />{error}
            </p>
          )}
          {videoResult && (
            <p className="flex items-center gap-1.5 text-xs font-semibold text-[#0F8F83]">
              <CheckCircle2 className="size-3.5" />{videoResult}
            </p>
          )}

          <Button
            disabled={pending || !videoScript}
            onClick={handleVideo}
            className="w-full bg-[#C9964A] font-semibold text-white hover:bg-[#A87A3A]"
          >
            {pending ? <><Loader2 className="size-4 animate-spin" />جاري الإرسال…</> : <><Video className="size-4" />إنشاء الفيديو</>}
          </Button>
        </div>
      )}
    </div>
  )
}
