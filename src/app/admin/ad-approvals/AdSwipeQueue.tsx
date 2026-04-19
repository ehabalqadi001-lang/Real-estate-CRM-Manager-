'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Ruler,
  BedDouble,
  Bath,
  Clock,
  Layers,
} from 'lucide-react'
import { approveAdAction, rejectAdAction } from './actions'

export type AdCard = {
  id: string
  title: string
  price: number | string
  property_type: string | null
  location: string | null
  city: string | null
  area_sqm: number | null
  bedrooms: number | null
  bathrooms: number | null
  images: string[] | null
  is_urgent: boolean | null
  is_featured: boolean | null
  created_at: string
  compound_name: string | null
}

interface Props {
  initialAds: AdCard[]
}

function formatAge(createdAt: string) {
  const mins = Math.max(1, Math.round((Date.now() - new Date(createdAt).getTime()) / 60_000))
  if (mins < 60) return `منذ ${mins} دقيقة`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `منذ ${hrs} ساعة`
  return `منذ ${Math.round(hrs / 24)} يوم`
}

export function AdSwipeQueue({ initialAds }: Props) {
  const [queue] = useState<AdCard[]>(initialAds)
  const [current, setCurrent] = useState(0)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [swipeDir, setSwipeDir] = useState<'left' | 'right' | null>(null)
  const [processed, setProcessed] = useState<{ id: string; action: 'approved' | 'rejected' }[]>([])
  const [pending, startTransition] = useTransition()

  const ad = queue[current]
  const remaining = queue.length - current

  const approve = useCallback(() => {
    if (!ad || pending) return
    setSwipeDir('right')
    const fd = new FormData()
    fd.set('ad_id', ad.id)
    startTransition(async () => {
      await approveAdAction(fd)
      setProcessed((p) => [...p, { id: ad.id, action: 'approved' }])
      setTimeout(() => {
        setSwipeDir(null)
        setCurrent((c) => c + 1)
      }, 320)
    })
  }, [ad, pending])

  const reject = useCallback(() => {
    if (!ad || pending) return
    const reason = rejectReason.trim() || 'بيانات الإعلان غير مكتملة أو تنتهك السياسة'
    setSwipeDir('left')
    const fd = new FormData()
    fd.set('ad_id', ad.id)
    fd.set('reason', reason)
    startTransition(async () => {
      await rejectAdAction(fd)
      setProcessed((p) => [...p, { id: ad.id, action: 'rejected' }])
      setTimeout(() => {
        setSwipeDir(null)
        setRejectReason('')
        setShowRejectInput(false)
        setCurrent((c) => c + 1)
      }, 320)
    })
  }, [ad, pending, rejectReason])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') approve()
      if (e.key === 'ArrowLeft') {
        if (showRejectInput) reject()
        else setShowRejectInput(true)
      }
      if (e.key === 'Escape') setShowRejectInput(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [approve, reject, showRejectInput])

  const approvedCount = processed.filter((p) => p.action === 'approved').length
  const rejectedCount = processed.filter((p) => p.action === 'rejected').length

  if (!ad) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#DDE6E4] bg-[#FBFCFA] py-24 text-center dark:bg-slate-800/30">
        <CheckCircle2 className="mb-4 size-16 text-[#0F8F83]" />
        <p className="text-xl font-black text-[#102033] dark:text-white">تم الانتهاء من جميع الإعلانات!</p>
        <p className="mt-2 text-sm font-semibold text-slate-500">
          {approvedCount} موافقة · {rejectedCount} رفض
        </p>
      </div>
    )
  }

  const imageUrl = ad.images?.[0]

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-[#0F8F83] transition-all duration-500"
            style={{ width: `${((current) / queue.length) * 100}%` }}
          />
        </div>
        <span className="text-xs font-black text-slate-500">{remaining} متبقي</span>
        <Badge className="bg-[#EEF6F5] text-[#0F8F83]">✓ {approvedCount}</Badge>
        <Badge className="bg-red-100 text-red-600">✗ {rejectedCount}</Badge>
      </div>

      {/* Card */}
      <div
        className={`relative overflow-hidden rounded-2xl border border-[#DDE6E4] bg-white shadow-xl transition-all duration-300 dark:bg-slate-900 ${
          swipeDir === 'right'
            ? 'translate-x-24 rotate-6 opacity-0'
            : swipeDir === 'left'
              ? '-translate-x-24 -rotate-6 opacity-0'
              : 'translate-x-0 rotate-0 opacity-100'
        }`}
      >
        {/* Image */}
        <div className="relative h-64 overflow-hidden bg-gradient-to-br from-[#EEF6F5] to-[#DDE6E4]">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={ad.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Layers className="size-16 text-[#0F8F83]/30" />
            </div>
          )}
          {/* Badges overlay */}
          <div className="absolute left-3 top-3 flex gap-2">
            {ad.is_urgent && <Badge className="bg-red-500 text-white">عاجل</Badge>}
            {ad.is_featured && <Badge className="bg-[#C9964A] text-white">مميز</Badge>}
            <Badge className="bg-black/50 text-white backdrop-blur-sm">
              <Clock className="mr-1 size-3" />
              {formatAge(ad.created_at)}
            </Badge>
          </div>
          {/* Swipe indicators */}
          {swipeDir === 'right' && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0F8F83]/30">
              <CheckCircle2 className="size-24 text-white drop-shadow-xl" />
            </div>
          )}
          {swipeDir === 'left' && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-500/30">
              <XCircle className="size-24 text-white drop-shadow-xl" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="p-5">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <h2 className="text-xl font-black text-[#102033] dark:text-white">{ad.title}</h2>
              {ad.compound_name && (
                <p className="mt-0.5 text-sm font-semibold text-[#0F8F83]">{ad.compound_name}</p>
              )}
            </div>
            <p className="text-xl font-black text-[#C9964A]">
              {Number(ad.price).toLocaleString('ar-EG')} ج.م
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-sm font-semibold text-slate-500">
            {ad.location && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5 text-[#0F8F83]" />
                {ad.city ?? ad.location}
              </span>
            )}
            {ad.area_sqm && (
              <span className="flex items-center gap-1">
                <Ruler className="size-3.5 text-[#0F8F83]" />
                {ad.area_sqm} م²
              </span>
            )}
            {ad.bedrooms != null && (
              <span className="flex items-center gap-1">
                <BedDouble className="size-3.5 text-[#0F8F83]" />
                {ad.bedrooms} غرف
              </span>
            )}
            {ad.bathrooms != null && (
              <span className="flex items-center gap-1">
                <Bath className="size-3.5 text-[#0F8F83]" />
                {ad.bathrooms}
              </span>
            )}
            {ad.property_type && (
              <Badge variant="outline" className="border-[#DDE6E4] text-xs capitalize">
                {ad.property_type}
              </Badge>
            )}
          </div>

          {/* Reject reason input */}
          {showRejectInput && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-black text-red-600">سبب الرفض (اختياري)</p>
              <Input
                autoFocus
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="بيانات ناقصة / محتوى مخالف…"
                className="border-red-200 focus:ring-red-300"
                onKeyDown={(e) => e.key === 'Enter' && reject()}
              />
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <Button
          size="lg"
          variant="outline"
          disabled={pending}
          onClick={() => setShowRejectInput((v) => !v)}
          className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
        >
          <ChevronLeft className="size-5" />
          رفض
          <span className="ml-2 hidden text-xs opacity-50 lg:inline">← Arrow</span>
        </Button>

        {showRejectInput && (
          <Button
            size="lg"
            disabled={pending}
            onClick={reject}
            className="flex-1 bg-red-500 font-black text-white hover:bg-red-600"
          >
            <XCircle className="size-5" />
            {pending ? 'جاري…' : 'تأكيد الرفض'}
          </Button>
        )}

        <Button
          size="lg"
          disabled={pending}
          onClick={approve}
          className="flex-1 bg-[#0F8F83] font-black text-white hover:bg-[#0B6F66]"
        >
          موافقة
          <ChevronRight className="size-5" />
          <span className="mr-2 hidden text-xs opacity-50 lg:inline">→ Arrow</span>
        </Button>
      </div>

      <p className="text-center text-xs font-semibold text-slate-400">
        اضغط ← للرفض · ← + Enter للتأكيد · → للموافقة · Esc للإلغاء
      </p>
    </div>
  )
}
