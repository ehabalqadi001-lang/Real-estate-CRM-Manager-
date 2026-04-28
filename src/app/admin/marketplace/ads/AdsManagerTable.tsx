'use client'

import Image from 'next/image'
import { useState, useTransition, type ElementType } from 'react'
import { CheckCircle2, Eye, EyeOff, FileEdit, Pin, ShieldAlert, Star, Tag, X, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  approveAdAction,
  changeCategoryAction,
  rejectAdAction,
  requestEditAdAction,
  toggleFeatureAdAction,
  toggleHideAdAction,
  togglePinAdAction,
} from './actions'

export interface LiveAd {
  id: string
  title: string
  price: number
  currency: string
  property_type: string
  location: string
  status: string
  images: string[] | null
  listing_type: string | null
  is_featured: boolean
  is_featured_admin: boolean
  is_pinned: boolean
  is_hidden_admin: boolean
  admin_category: string | null
  created_at: string
  seller_name: string | null
  seller_email: string | null
  rejection_reason?: string | null
  edit_request_notes?: string | null
  reviewed_at?: string | null
}

const PROPERTY_CATEGORIES = [
  'Apartment',
  'Villa',
  'Land',
  'Retail',
  'Office',
  'Warehouse',
  'House',
  'Duplex',
  'Penthouse',
]

type Toast = { type: 'success' | 'error'; text: string }
type ReviewModal = { type: 'reject' | 'edit'; adId: string } | null

function ToggleBtn({
  active,
  onLabel,
  offLabel,
  icon: Icon,
  activeClass,
  onClick,
  disabled,
}: {
  active: boolean
  onLabel: string
  offLabel: string
  icon: ElementType
  activeClass: string
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition active:scale-95 disabled:opacity-40 ${
        active ? activeClass : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
      }`}
    >
      <Icon className="size-3.5" />
      {active ? onLabel : offLabel}
    </button>
  )
}

export function AdsManagerTable({ ads: initialAds }: { ads: LiveAd[] }) {
  const [ads, setAds] = useState(initialAds)
  const [pending, startTransition] = useTransition()
  const [toast, setToast] = useState<Toast | null>(null)
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null)
  const [categoryInput, setCategoryInput] = useState('')
  const [reviewModal, setReviewModal] = useState<ReviewModal>(null)
  const [reviewInput, setReviewInput] = useState('')

  function notify(nextToast: Toast) {
    setToast(nextToast)
    setTimeout(() => setToast(null), 3000)
  }

  function update(id: string, patch: Partial<LiveAd>) {
    setAds((prev) => prev.map((ad) => (ad.id === id ? { ...ad, ...patch } : ad)))
  }

  function findAd(id: string) {
    return ads.find((ad) => ad.id === id)
  }

  function openReviewModal(type: 'reject' | 'edit', adId: string) {
    setReviewModal({ type, adId })
    setReviewInput('')
  }

  function closeReviewModal() {
    setReviewModal(null)
    setReviewInput('')
  }

  function act(
    fn: () => Promise<{ success: boolean; message?: string }>,
    patch: { id: string } & Partial<LiveAd>
  ) {
    const previous = findAd(patch.id)

    startTransition(async () => {
      update(patch.id, patch)
      const result = await fn()

      if (!result.success) {
        if (previous) {
          update(patch.id, previous)
        }
        notify({ type: 'error', text: result.message ?? 'Something went wrong while updating the ad.' })
        return
      }

      notify({ type: 'success', text: 'Ad updated successfully.' })
    })
  }

  function handleApprove(ad: LiveAd) {
    act(() => approveAdAction(ad.id), {
      id: ad.id,
      status: 'approved',
      rejection_reason: null,
      edit_request_notes: null,
      reviewed_at: new Date().toISOString(),
    })
  }

  function handleReviewSubmit() {
    if (!reviewModal || !reviewInput.trim()) return

    const ad = findAd(reviewModal.adId)
    if (!ad) return

    if (reviewModal.type === 'reject') {
      act(() => rejectAdAction(ad.id, reviewInput), {
        id: ad.id,
        status: 'rejected',
        rejection_reason: reviewInput.trim(),
        edit_request_notes: null,
        reviewed_at: new Date().toISOString(),
      })
    } else {
      act(() => requestEditAdAction(ad.id, reviewInput), {
        id: ad.id,
        status: 'edit_requested',
        edit_request_notes: reviewInput.trim(),
        rejection_reason: null,
        reviewed_at: new Date().toISOString(),
      })
    }

    closeReviewModal()
  }

  return (
    <>
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-bold shadow-2xl ${
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.text}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-400">
              <th className="py-4 pl-4 pr-3 text-left">Ad</th>
              <th className="px-3 py-4 text-left">Seller</th>
              <th className="px-3 py-4 text-left">Category</th>
              <th className="px-3 py-4 text-left">Price</th>
              <th className="px-3 py-4 text-left">Status</th>
              <th className="px-3 py-4 text-center">Controls</th>
            </tr>
          </thead>
          <tbody className={`divide-y divide-slate-50 ${pending ? 'opacity-70' : ''}`}>
            {ads.map((ad) => {
              const thumb = ad.images?.[0] ?? null

              return (
                <tr key={ad.id} className={`transition-colors hover:bg-slate-50/70 ${ad.is_hidden_admin ? 'opacity-50' : ''}`}>
                  <td className="py-3 pl-4 pr-3">
                    <div className="flex items-center gap-3">
                      <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        {thumb ? (
                          <Image src={thumb} alt="" fill className="object-cover" sizes="44px" />
                        ) : (
                          <span className="flex h-full items-center justify-center text-lg">H</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="max-w-[220px] truncate font-bold text-slate-800">{ad.title}</p>
                        <p className="mt-0.5 max-w-[220px] truncate text-xs text-slate-400">{ad.location}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {ad.is_pinned && <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-black text-blue-600">Pinned</span>}
                          {ad.is_featured_admin && <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-black text-amber-600">Featured</span>}
                          {ad.is_hidden_admin && <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-black text-slate-500">Hidden</span>}
                          {ad.status === 'edit_requested' && <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-black text-blue-700">Edit requested</span>}
                          {ad.status === 'rejected' && <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-black text-red-700">Rejected</span>}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <p className="max-w-[160px] truncate text-xs font-semibold text-slate-700">{ad.seller_name ?? '-'}</p>
                    <p className="max-w-[160px] truncate text-[10px] text-slate-400">{ad.seller_email ?? '-'}</p>
                  </td>

                  <td className="px-3 py-3">
                    {editCategoryId === ad.id ? (
                      <div className="flex items-center gap-1">
                        <select
                          value={categoryInput}
                          onChange={(event) => setCategoryInput(event.target.value)}
                          className="rounded-lg border border-blue-300 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-blue-300"
                        >
                          <option value="">None</option>
                          {PROPERTY_CATEGORIES.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            act(() => changeCategoryAction(ad.id, categoryInput), {
                              id: ad.id,
                              admin_category: categoryInput || null,
                            })
                            setEditCategoryId(null)
                          }}
                          className="rounded-lg bg-emerald-500 p-1 text-white hover:bg-emerald-600"
                        >
                          <CheckCircle2 className="size-3.5" />
                        </button>
                        <button
                          onClick={() => setEditCategoryId(null)}
                          className="rounded-lg bg-slate-200 p-1 text-slate-600 hover:bg-slate-300"
                        >
                          <XCircle className="size-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditCategoryId(ad.id)
                          setCategoryInput(ad.admin_category ?? '')
                        }}
                        className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-2 py-1 text-xs text-slate-500 hover:border-blue-300 hover:text-blue-600"
                      >
                        <Tag className="size-3" />
                        {ad.admin_category ?? ad.property_type ?? 'Assign'}
                      </button>
                    )}
                  </td>

                  <td className="px-3 py-3 text-xs font-black text-emerald-700">
                    {Number(ad.price).toLocaleString('en-US')} {ad.currency ?? 'EGP'}
                  </td>

                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                        ad.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-700'
                        : ad.status === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : ad.status === 'edit_requested'
                              ? 'bg-blue-100 text-blue-700'
                              : ad.status === 'rejected'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {ad.status}
                    </span>
                    {ad.listing_type && (
                      <span
                        className={`mt-1 block rounded-full px-2 py-0.5 text-[10px] font-black ${
                          ad.listing_type === 'PREMIUM' ? 'bg-purple-100 text-purple-700' : 'bg-blue-50 text-blue-600'
                        }`}
                      >
                        {ad.listing_type}
                      </span>
                    )}
                    {ad.reviewed_at ? (
                      <p className="mt-1 text-[10px] font-semibold text-slate-400">
                        Reviewed {new Date(ad.reviewed_at).toLocaleDateString('en-US')}
                      </p>
                    ) : null}
                  </td>

                  <td className="px-3 py-3">
                    <div className="flex flex-wrap items-center justify-center gap-1">
                      <ToggleBtn
                        active={ad.status === 'approved'}
                        onLabel="Approved"
                        offLabel="Approve"
                        icon={CheckCircle2}
                        activeClass="bg-emerald-500 text-white"
                        onClick={() => handleApprove(ad)}
                        disabled={pending}
                      />
                      <button
                        onClick={() => openReviewModal('edit', ad.id)}
                        disabled={pending}
                        className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100 disabled:opacity-40"
                      >
                        <FileEdit className="size-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => openReviewModal('reject', ad.id)}
                        disabled={pending}
                        className="flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-40"
                      >
                        <XCircle className="size-3.5" />
                        Reject
                      </button>
                      <ToggleBtn
                        active={ad.is_featured_admin}
                        onLabel="Featured"
                        offLabel="Feature"
                        icon={Star}
                        activeClass="bg-amber-400 text-white"
                        onClick={() =>
                          act(() => toggleFeatureAdAction(ad.id, !ad.is_featured_admin), {
                            id: ad.id,
                            is_featured_admin: !ad.is_featured_admin,
                          })
                        }
                        disabled={pending}
                      />
                      <ToggleBtn
                        active={ad.is_pinned}
                        onLabel="Pinned"
                        offLabel="Pin"
                        icon={Pin}
                        activeClass="bg-blue-500 text-white"
                        onClick={() =>
                          act(() => togglePinAdAction(ad.id, !ad.is_pinned), {
                            id: ad.id,
                            is_pinned: !ad.is_pinned,
                          })
                        }
                        disabled={pending}
                      />
                      <ToggleBtn
                        active={ad.is_hidden_admin}
                        onLabel="Hidden"
                        offLabel="Hide"
                        icon={ad.is_hidden_admin ? Eye : EyeOff}
                        activeClass="bg-slate-500 text-white"
                        onClick={() =>
                          act(() => toggleHideAdAction(ad.id, !ad.is_hidden_admin), {
                            id: ad.id,
                            is_hidden_admin: !ad.is_hidden_admin,
                          })
                        }
                        disabled={pending}
                      />
                    </div>
                    {(ad.rejection_reason || ad.edit_request_notes) && (
                      <div className="mt-2 max-w-[260px] rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px] text-slate-500">
                        <p className="font-bold text-slate-700">
                          {ad.status === 'rejected' ? 'Rejection note' : 'Edit note'}
                        </p>
                        <p className="mt-1 line-clamp-3">{ad.rejection_reason ?? ad.edit_request_notes}</p>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {ads.length === 0 && (
          <div className="py-16 text-center text-sm text-slate-400">No ads found.</div>
        )}
      </div>

      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {reviewModal.type === 'reject' ? (
                  <ShieldAlert className="size-5 text-red-600" />
                ) : (
                  <FileEdit className="size-5 text-blue-600" />
                )}
                <div>
                  <p className="text-base font-black text-slate-900">
                    {reviewModal.type === 'reject' ? 'Reject ad' : 'Request edit'}
                  </p>
                  <p className="text-xs font-semibold text-slate-400">
                    This note will be stored on the ad and logged in `ad_review_logs`.
                  </p>
                </div>
              </div>
              <button
                onClick={closeReviewModal}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            </div>

            <textarea
              value={reviewInput}
              onChange={(event) => setReviewInput(event.target.value)}
              rows={5}
              placeholder={
                reviewModal.type === 'reject'
                  ? 'Write the rejection reason clearly for audit and user follow-up.'
                  : 'Write the exact changes the seller must make before the ad can be approved.'
              }
              className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#17375E] focus:ring-2 focus:ring-[#17375E]/10"
            />

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={closeReviewModal}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReviewSubmit}
                disabled={pending || !reviewInput.trim()}
                className={cn(
                  'rounded-xl px-4 py-2 text-sm font-black text-white transition disabled:opacity-40',
                  reviewModal.type === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700',
                )}
              >
                {pending ? 'Saving...' : reviewModal.type === 'reject' ? 'Confirm rejection' : 'Send edit request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
