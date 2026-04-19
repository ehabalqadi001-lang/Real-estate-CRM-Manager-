'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, MessageCircle, Phone, Search, Send, ShieldCheck, UserRound, UsersRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export type WhatsAppHubUser = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  role: string | null
  account_type: string | null
  status: string | null
  created_at: string | null
}

function displayName(user: WhatsAppHubUser) {
  return user.full_name || user.email || user.phone || 'مستخدم بدون اسم'
}

export function WhatsAppHubClient({ users }: { users: WhatsAppHubUser[] }) {
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id ?? '')
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState('مرحباً بك في FAST INVESTMENT. كيف يمكننا مساعدتك اليوم؟')
  const [isSending, setIsSending] = useState(false)

  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return users

    return users.filter((user) => {
      const haystack = [user.full_name, user.email, user.phone, user.role, user.account_type]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(term)
    })
  }, [query, users])

  const selectedUser = users.find((user) => user.id === selectedUserId) ?? filteredUsers[0] ?? null
  const canSend = Boolean(selectedUser?.phone && message.trim()) && !isSending

  async function handleSend() {
    if (!selectedUser?.phone) {
      toast.error('لا يوجد رقم هاتف لهذا المستخدم')
      return
    }

    setIsSending(true)

    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: selectedUser.phone,
          message,
          userId: selectedUser.id,
        }),
      })

      const payload = (await response.json()) as { success?: boolean; error?: string; messageId?: string | null }

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? 'فشل إرسال رسالة WhatsApp')
      }

      toast.success('تم إرسال رسالة WhatsApp بنجاح')
      setMessage('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'فشل إرسال الرسالة')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]" dir="rtl">
      <aside className="rounded-lg border border-[#DDE6E4] bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-[#27AE60]">FAST CONTACTS</p>
            <h2 className="mt-1 text-lg font-black text-[#102033]">العملاء والمستخدمون</h2>
          </div>
          <div className="flex size-10 items-center justify-center rounded-lg bg-[#EAF8F0] text-[#27AE60]">
            <UsersRound className="size-5" />
          </div>
        </div>

        <label className="relative block">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="بحث بالاسم أو الهاتف"
            className="h-10 bg-[#FBFCFA] pr-9 font-bold"
          />
        </label>

        <div className="mt-4 max-h-[640px] space-y-2 overflow-y-auto pl-1">
          {filteredUsers.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#DDE6E4] p-6 text-center text-sm font-bold text-[#64748B]">
              لا توجد نتائج مطابقة
            </div>
          ) : (
            filteredUsers.map((user) => {
              const active = selectedUser?.id === user.id
              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => setSelectedUserId(user.id)}
                  className={`w-full rounded-lg border p-3 text-right transition ${
                    active
                      ? 'border-[#27AE60] bg-[#EAF8F0] shadow-sm'
                      : 'border-[#DDE6E4] bg-[#FBFCFA] hover:border-[#27AE60]/50 hover:bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-[#27AE60] text-white' : 'bg-white text-[#27AE60]'}`}>
                      <UserRound className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-[#102033]">{displayName(user)}</p>
                      <p className="mt-1 truncate text-xs font-bold text-[#64748B]" dir="ltr">{user.phone ?? 'No phone'}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="rounded-md bg-white px-2 py-1 text-[11px] font-black text-[#27AE60]">{user.account_type ?? user.role ?? 'user'}</span>
                        {user.status && <span className="rounded-md bg-white px-2 py-1 text-[11px] font-black text-[#64748B]">{user.status}</span>}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </aside>

      <main className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-lg border border-[#DDE6E4] bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-black text-[#27AE60]">RESPOND.IO COMPOSER</p>
              <h1 className="mt-1 text-2xl font-black text-[#102033]">WhatsApp & Communications</h1>
              <p className="mt-1 text-sm font-bold text-[#64748B]">مركز إرسال رسائل WhatsApp لفريق خدمة العملاء</p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-[#2ECC71]/30 bg-[#EAFBF1] px-3 py-2 text-sm font-black text-[#1E874B]">
              <CheckCircle2 className="size-4" />
              Respond.io
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-[#DDE6E4] bg-[#FBFCFA] p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-black text-[#102033]">
                <UserRound className="size-4 text-[#27AE60]" />
                المستلم المحدد
              </p>
              {selectedUser ? (
                <div>
                  <p className="text-lg font-black text-[#102033]">{displayName(selectedUser)}</p>
                  <p className="mt-1 font-bold text-[#27AE60]" dir="ltr">{selectedUser.phone ?? 'No phone'}</p>
                  <p className="mt-2 text-xs font-bold text-[#64748B]">{selectedUser.email ?? 'لا يوجد بريد إلكتروني'}</p>
                </div>
              ) : (
                <p className="text-sm font-bold text-[#64748B]">اختر مستخدماً من القائمة</p>
              )}
            </div>

            <div className="rounded-lg border border-[#DDE6E4] bg-[#FBFCFA] p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-black text-[#102033]">
                <ShieldCheck className="size-4 text-[#27AE60]" />
                معايير الإرسال
              </p>
              <div className="space-y-2 text-sm font-bold text-[#64748B]">
                <p>القناة: WhatsApp عبر Respond.io</p>
                <p>الاتجاه: RTL عربي بخط Cairo</p>
                <p>الحالة: إرسال آمن من الخادم فقط</p>
              </div>
            </div>
          </div>

          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-black text-[#102033]">نص الرسالة</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={8}
              placeholder="اكتب رسالة WhatsApp هنا..."
              className="w-full resize-none rounded-lg border border-[#DDE6E4] bg-[#FBFCFA] px-4 py-3 text-base font-bold leading-8 text-[#102033] outline-none transition focus:border-[#27AE60] focus:ring-4 focus:ring-[#27AE60]/15"
            />
          </label>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-bold text-[#64748B]">
              {message.trim().length.toLocaleString('ar-EG')} حرف
            </p>
            <Button
              type="button"
              disabled={!canSend}
              onClick={handleSend}
              className="h-11 bg-[#27AE60] px-5 font-black text-white hover:bg-[#219653]"
            >
              <Send className="size-4" />
              {isSending ? 'جاري الإرسال...' : 'Send WhatsApp'}
            </Button>
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-lg border border-[#DDE6E4] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-[#64748B]">إجمالي السجلات</p>
                <p className="mt-1 text-3xl font-black text-[#102033]">{users.length.toLocaleString('ar-EG')}</p>
              </div>
              <div className="flex size-11 items-center justify-center rounded-lg bg-[#EAF8F0] text-[#27AE60]">
                <UsersRound className="size-5" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[#DDE6E4] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-[#64748B]">أرقام متاحة</p>
                <p className="mt-1 text-3xl font-black text-[#102033]">
                  {users.filter((user) => user.phone).length.toLocaleString('ar-EG')}
                </p>
              </div>
              <div className="flex size-11 items-center justify-center rounded-lg bg-[#EAFBF1] text-[#2ECC71]">
                <Phone className="size-5" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[#DDE6E4] bg-[#102033] p-5 text-white shadow-sm">
            <MessageCircle className="mb-4 size-8 text-[#2ECC71]" />
            <p className="text-lg font-black">FAST INVESTMENT</p>
            <p className="mt-2 text-sm font-bold leading-7 text-white/70">
              واجهة تشغيل موحدة لخدمة العملاء، مصممة للردود السريعة والتواصل المباشر عبر WhatsApp.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
