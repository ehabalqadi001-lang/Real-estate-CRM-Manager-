'use client'

import { useTransition, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { Bell, CreditCard, Headphones, Lock, Megaphone, MessageCircle, Phone, ShieldCheck, TicketCheck, UserRound, WalletCards } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { changeClientPasswordAction, createClientSupportTicketAction, updateClientProfileAction } from '@/app/marketplace/profile/actions'

type Profile = {
  full_name: string | null
  email: string | null
  phone: string | null
  region: string | null
  preferred_contact: string | null
  client_notes: string | null
  role: string | null
  status: string | null
}

type Listing = {
  id: string
  title: string
  status: string
  created_at: string
  price: number | string | null
}

type Wallet = {
  points_balance: number | string | null
  lifetime_points_earned: number | string | null
  lifetime_points_spent: number | string | null
}

type WalletTransaction = {
  id: string
  type: string
  points_delta: number | string
  balance_after: number | string
  money_amount: number | string | null
  currency: string | null
  reason: string | null
  created_at: string
}

type SupportTicket = {
  id: string
  title: string
  status: string
  priority: string
  category: string | null
  created_at: string
}

type PointPackage = {
  id: string
  name: string
  amount_egp: number | string
  currency: string
  points_amount: number | string
}

export default function ClientProfileDashboard({
  profile,
  listings,
  wallet,
  transactions,
  supportTickets,
  pointPackages,
}: {
  profile: Profile
  listings: Listing[]
  wallet: Wallet | null
  transactions: WalletTransaction[]
  supportTickets: SupportTicket[]
  pointPackages: PointPackage[]
}) {
  const [profilePending, startProfileTransition] = useTransition()
  const [passwordPending, startPasswordTransition] = useTransition()
  const [ticketPending, startTicketTransition] = useTransition()
  const [profileMessage, setProfileMessage] = useState<string | null>(null)
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [ticketMessage, setTicketMessage] = useState<string | null>(null)
  const [preferredContact, setPreferredContact] = useState(profile.preferred_contact ?? 'whatsapp')

  function updateProfile(formData: FormData) {
    formData.set('preferred_contact', preferredContact)
    startProfileTransition(async () => {
      const result = await updateClientProfileAction(formData)
      setProfileMessage(result.message)
    })
  }

  function changePassword(formData: FormData) {
    startPasswordTransition(async () => {
      const result = await changeClientPasswordAction(formData)
      setPasswordMessage(result.message)
    })
  }

  function createTicket(formData: FormData) {
    startTicketTransition(async () => {
      const result = await createClientSupportTicketAction(formData)
      setTicketMessage(result.message)
    })
  }

  const activeListings = listings.filter((listing) => listing.status === 'approved').length
  const pendingListings = listings.filter((listing) => listing.status === 'pending').length
  const rejectedListings = listings.filter((listing) => listing.status === 'rejected').length

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#DDE6E4] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-[#EEF6F5] text-[#17375E]">
              <UserRound className="size-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#102033]">{profile.full_name ?? 'عميل FAST INVESTMENT'}</h1>
              <p className="mt-1 text-sm font-bold text-[#64748B]">{profile.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-lg bg-[#EEF6F5] px-3 py-2 text-sm font-black text-[#0F8F83]">
              <ShieldCheck className="ms-1 size-4" />
              {profile.role === 'CLIENT' || profile.role === 'client' ? 'حساب عميل' : profile.role ?? 'مستخدم'}
            </span>
            <span className="inline-flex items-center rounded-lg bg-[#FFF8EC] px-3 py-2 text-sm font-black text-[#C9964A]">
              <Bell className="ms-1 size-4" />
              {profile.status ?? 'active'}
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={<WalletCards className="size-5" />}
          label="رصيد النقاط"
          value={`${Number(wallet?.points_balance ?? 0).toLocaleString('ar-EG')} نقطة`}
          hint={`المكتسب: ${Number(wallet?.lifetime_points_earned ?? 0).toLocaleString('ar-EG')}`}
        />
        <MetricCard
          icon={<CreditCard className="size-5" />}
          label="المدفوعات"
          value={`${transactions.length.toLocaleString('ar-EG')} عملية`}
          hint={`المستخدم: ${Number(wallet?.lifetime_points_spent ?? 0).toLocaleString('ar-EG')} نقطة`}
        />
        <MetricCard
          icon={<Megaphone className="size-5" />}
          label="الإعلانات"
          value={`${listings.length.toLocaleString('ar-EG')} إعلان`}
          hint={`نشط ${activeListings} / معلق ${pendingListings} / مرفوض ${rejectedListings}`}
        />
        <MetricCard
          icon={<Headphones className="size-5" />}
          label="الدعم"
          value={`${supportTickets.length.toLocaleString('ar-EG')} تذكرة`}
          hint="خدمة العملاء ومتابعة الطلبات"
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-[#DDE6E4] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-black text-[#102033]">البيانات الشخصية</h2>
            <form action={updateProfile} className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="الاسم الكامل">
                <Input name="full_name" defaultValue={profile.full_name ?? ''} className="h-10 border-[#DDE6E4]" required />
              </Field>
              <Field label="رقم الهاتف">
                <Input name="phone" defaultValue={profile.phone ?? ''} className="h-10 border-[#DDE6E4] text-left" dir="ltr" required />
              </Field>
              <Field label="البريد الإلكتروني">
                <Input value={profile.email ?? ''} className="h-10 border-[#DDE6E4] bg-[#FBFCFA] text-left" dir="ltr" readOnly />
              </Field>
              <Field label="المنطقة / المحافظة">
                <Input name="region" defaultValue={profile.region ?? ''} className="h-10 border-[#DDE6E4]" />
              </Field>
              <Field label="طريقة التواصل المفضلة">
                <Select value={preferredContact} onValueChange={(value) => value && setPreferredContact(value)}>
                  <SelectTrigger className="h-10 border-[#DDE6E4]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">اتصال مباشر</SelectItem>
                    <SelectItem value="whatsapp">واتساب</SelectItem>
                    <SelectItem value="internal_chat">محادثة داخلية</SelectItem>
                    <SelectItem value="email">البريد الإلكتروني</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <div className="md:col-span-2">
                <Field label="ملاحظات خاصة">
                  <textarea
                    name="client_notes"
                    defaultValue={profile.client_notes ?? ''}
                    rows={4}
                    className="w-full resize-none rounded-lg border border-[#DDE6E4] bg-white px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#0F8F83]/30"
                  />
                </Field>
              </div>
              <div className="flex items-center gap-3 md:col-span-2">
                <Button disabled={profilePending} className="bg-[#17375E] text-white hover:bg-[#102033]">
                  {profilePending ? 'جاري الحفظ...' : 'حفظ البيانات'}
                </Button>
                {profileMessage && <p className="text-sm font-bold text-[#0F8F83]">{profileMessage}</p>}
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-[#DDE6E4] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="flex items-center gap-2 text-xl font-black text-[#102033]">
              <TicketCheck className="size-5 text-[#17375E]" />
              طلب دعم جديد
            </h2>
            <form action={createTicket} className="mt-4 space-y-3">
              <Input name="title" placeholder="عنوان الطلب" className="h-10 border-[#DDE6E4]" required />
              <select name="category" defaultValue="marketplace" className="h-10 w-full rounded-lg border border-[#DDE6E4] bg-white px-3 text-sm font-bold">
                <option value="marketplace">السوق العقاري</option>
                <option value="payments">الدفع والنقاط</option>
                <option value="ads">إدارة الإعلانات</option>
                <option value="account">الحساب والملف الشخصي</option>
              </select>
              <select name="priority" defaultValue="medium" className="h-10 w-full rounded-lg border border-[#DDE6E4] bg-white px-3 text-sm font-bold">
                <option value="low">منخفض</option>
                <option value="medium">متوسط</option>
                <option value="high">مرتفع</option>
                <option value="critical">عاجل</option>
              </select>
              <textarea
                name="description"
                placeholder="اكتب تفاصيل الطلب لخدمة العملاء"
                rows={4}
                className="w-full resize-none rounded-lg border border-[#DDE6E4] bg-white px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#0F8F83]/30"
                required
              />
              <Button disabled={ticketPending} className="w-full bg-[#17375E] text-white hover:bg-[#102033]">
                {ticketPending ? 'جاري الإرسال...' : 'إرسال لخدمة العملاء'}
              </Button>
              {ticketMessage && <p className="text-sm font-bold text-[#0F8F83]">{ticketMessage}</p>}
            </form>
            <div className="mt-4 space-y-2">
              {supportTickets.map((ticket) => (
                <div key={ticket.id} className="rounded-lg bg-[#FBFCFA] p-3 text-sm">
                  <p className="font-black text-[#102033]">{ticket.title}</p>
                  <p className="mt-1 text-xs font-bold text-[#64748B]">{ticket.status} - {ticket.priority}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[#DDE6E4] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-[#102033]">نظام الدفع والنقاط</h2>
                <p className="mt-1 text-sm font-bold text-[#64748B]">متابعة المحفظة، آخر العمليات، وباقات الشحن المتاحة.</p>
              </div>
              <Link href="/marketplace/buy-points" className="inline-flex h-10 items-center justify-center rounded-lg bg-[#17375E] px-4 text-sm font-black text-white">
                شحن النقاط
              </Link>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-[#DDE6E4] p-4">
                <p className="text-sm font-black text-[#102033]">آخر عمليات المحفظة</p>
                <div className="mt-3 space-y-2">
                  {transactions.length === 0 ? (
                    <p className="rounded-lg bg-[#FBFCFA] p-3 text-sm font-bold text-[#64748B]">لا توجد عمليات دفع أو نقاط حتى الآن.</p>
                  ) : transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between gap-3 rounded-lg bg-[#FBFCFA] p-3 text-sm">
                      <div>
                        <p className="font-black text-[#102033]">{transaction.reason || transaction.type}</p>
                        <p className="text-xs font-bold text-[#64748B]">{new Date(transaction.created_at).toLocaleDateString('ar-EG')}</p>
                      </div>
                      <div className="text-left font-black text-[#0F8F83]">
                        {Number(transaction.points_delta).toLocaleString('ar-EG')} نقطة
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-[#DDE6E4] p-4">
                <p className="text-sm font-black text-[#102033]">باقات مقترحة</p>
                <div className="mt-3 space-y-2">
                  {pointPackages.map((pack) => (
                    <Link key={pack.id} href="/marketplace/buy-points" className="flex items-center justify-between rounded-lg bg-[#EEF6F5] p-3 text-sm transition hover:bg-white">
                      <span className="font-black text-[#102033]">{pack.name}</span>
                      <span className="font-black text-[#0F8F83]">{Number(pack.points_amount).toLocaleString('ar-EG')} نقطة</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#DDE6E4] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="flex items-center gap-2 text-xl font-black text-[#102033]">
              <Lock className="size-5 text-[#17375E]" />
              الأمان
            </h2>
            <form action={changePassword} className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="كلمة المرور الجديدة">
                <Input name="new_password" type="password" minLength={8} className="h-10 border-[#DDE6E4] text-left" dir="ltr" required />
              </Field>
              <Field label="تأكيد كلمة المرور">
                <Input name="confirm_password" type="password" minLength={8} className="h-10 border-[#DDE6E4] text-left" dir="ltr" required />
              </Field>
              <div className="flex items-center gap-3 md:col-span-2">
                <Button disabled={passwordPending} className="bg-[#17375E] text-white hover:bg-[#102033]">
                  {passwordPending ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
                </Button>
                {passwordMessage && <p className="text-sm font-bold text-[#0F8F83]">{passwordMessage}</p>}
              </div>
            </form>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-[#DDE6E4] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-black text-[#102033]">مركز خدمة العملاء</h2>
            <div className="mt-5 grid gap-3">
              <a href="tel:01101160208" className="flex items-center justify-between rounded-lg border border-[#DDE6E4] px-4 py-3 font-black text-[#17375E] transition hover:bg-[#EEF6F5]">
                <span>اتصال مباشر</span>
                <Phone className="size-5" />
              </a>
              <a href="https://wa.me/201101160208" target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg border border-[#0F8F83]/30 bg-[#EEF6F5] px-4 py-3 font-black text-[#0F8F83] transition hover:bg-white">
                <span>WhatsApp Business</span>
                <MessageCircle className="size-5" />
              </a>
              <Link href="/marketplace/chat" className="flex items-center justify-between rounded-lg border border-[#C9964A]/30 bg-[#FFF8EC] px-4 py-3 font-black text-[#C9964A] transition hover:bg-white">
                <span>محادثة داخل النظام</span>
                <MessageCircle className="size-5" />
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border border-[#DDE6E4] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-black text-[#102033]">وحداتي</h2>
            <div className="mt-4 space-y-3">
              {listings.length === 0 ? (
                <div className="rounded-lg bg-[#FBFCFA] p-4 text-sm font-bold leading-6 text-[#64748B]">
                  لا توجد وحدات مضافة بعد.
                  <Link href="/marketplace/add-property" className="mt-3 block font-black text-[#17375E]">أضف أول وحدة</Link>
                </div>
              ) : (
                listings.map((listing) => (
                  <div key={listing.id} className="rounded-lg border border-[#DDE6E4] p-3">
                    <p className="font-black text-[#102033]">{listing.title}</p>
                    <div className="mt-2 flex items-center justify-between text-xs font-bold text-[#64748B]">
                      <span>{listing.status}</span>
                      <span>{Number(listing.price ?? 0).toLocaleString('ar-EG')} ج.م</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <Label className="text-sm font-black text-[#102033]">{label}</Label>
      {children}
    </label>
  )
}

function MetricCard({ icon, label, value, hint }: { icon: ReactNode; label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-[#DDE6E4] bg-white p-4 shadow-sm">
      <div className="flex size-10 items-center justify-center rounded-lg bg-[#EEF6F5] text-[#0F8F83]">{icon}</div>
      <p className="mt-3 text-sm font-black text-[#64748B]">{label}</p>
      <p className="mt-1 text-xl font-black text-[#102033]">{value}</p>
      <p className="mt-1 text-xs font-bold text-[#64748B]">{hint}</p>
    </div>
  )
}
