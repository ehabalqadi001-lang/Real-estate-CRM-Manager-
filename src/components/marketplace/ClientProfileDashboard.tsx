'use client'

import { useTransition, useState, type ReactNode } from 'react'
import Link from 'next/link'
import {
  CheckCircle2, Clock, Coins, CreditCard, ExternalLink,
  FileText, Headphones, Info, Lock,
  Mail, Megaphone, MessageCircle, Phone, PlusCircle,
  ShieldCheck, TicketCheck, UserRound, WalletCards,
  XCircle, Search, Bookmark,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  changeClientPasswordAction,
  createClientSupportTicketAction,
  promoteAdAction,
  updateClientProfileAction,
} from '@/app/marketplace/profile/actions'
import { useI18n } from '@/hooks/use-i18n'

/* ── Types ─────────────────────────────────────────────── */

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

type AdCosts = {
  regular_points_cost: number
  premium_points_cost: number
}

type TabId = 'account' | 'wallet' | 'ads' | 'saved_properties' | 'saved_searches' | 'support' | 'about' | 'terms'

/* ── Root component ────────────────────────────────────── */

export default function ClientProfileDashboard({
  profile,
  listings,
  wallet,
  transactions,
  supportTickets,
  pointPackages,
  adCosts,
}: {
  profile: Profile
  listings: Listing[]
  wallet: Wallet | null
  transactions: WalletTransaction[]
  supportTickets: SupportTicket[]
  pointPackages: PointPackage[]
  adCosts?: AdCosts | null
}) {
  const { t, numLocale } = useI18n()
  const [activeTab, setActiveTab] = useState<TabId>('account')

  const TABS: { id: TabId; label: string; icon: ReactNode }[] = [
    { id: 'account',          label: t('البيانات الشخصية', 'Personal Info'),      icon: <UserRound   className="size-4" /> },
    { id: 'wallet',           label: t('المدفوعات والنقاط', 'Payments & Points'), icon: <WalletCards  className="size-4" /> },
    { id: 'ads',              label: t('إعلاناتي', 'My Ads'),                     icon: <Megaphone    className="size-4" /> },
    { id: 'saved_properties', label: t('العقارات المحفوظة', 'Saved Properties'),   icon: <CheckCircle2 className="size-4" /> },
    { id: 'saved_searches',   label: t('عمليات البحث', 'Saved Searches'),          icon: <Search       className="size-4" /> },
    { id: 'support',          label: t('الدعم والتواصل', 'Support & Contact'),     icon: <Headphones   className="size-4" /> },
    { id: 'about',            label: t('عن الشركة', 'About Us'),                   icon: <Info         className="size-4" /> },
    { id: 'terms',            label: t('الشروط والأحكام', 'Terms & Conditions'),   icon: <FileText     className="size-4" /> },
  ]

  const [profilePending, startProfileTransition] = useTransition()
  const [passwordPending, startPasswordTransition] = useTransition()
  const [ticketPending, startTicketTransition] = useTransition()
  const [promotePending, startPromoteTransition] = useTransition()

  const [profileMessage, setProfileMessage] = useState<string | null>(null)
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [ticketMessage, setTicketMessage] = useState<string | null>(null)
  const [promoteMessages, setPromoteMessages] = useState<Record<string, string>>({})
  const [preferredContact, setPreferredContact] = useState(profile.preferred_contact ?? 'whatsapp')

  function handleUpdateProfile(formData: FormData) {
    formData.set('preferred_contact', preferredContact)
    startProfileTransition(async () => {
      const result = await updateClientProfileAction(formData)
      setProfileMessage(result.message)
    })
  }

  function handleChangePassword(formData: FormData) {
    startPasswordTransition(async () => {
      const result = await changeClientPasswordAction(formData)
      setPasswordMessage(result.message)
    })
  }

  function handleCreateTicket(formData: FormData) {
    startTicketTransition(async () => {
      const result = await createClientSupportTicketAction(formData)
      setTicketMessage(result.message)
    })
  }

  function handlePromoteAd(adId: string, kind: 'regular' | 'premium') {
    startPromoteTransition(async () => {
      const fd = new FormData()
      fd.set('ad_id', adId)
      fd.set('kind', kind)
      const result = await promoteAdAction(fd)
      setPromoteMessages((prev) => ({ ...prev, [adId]: result.message }))
    })
  }

  const activeListings  = listings.filter((l) => l.status === 'approved').length
  const pendingListings = listings.filter((l) => l.status === 'pending').length
  const balance         = Number(wallet?.points_balance ?? 0)

  return (
    <div className="space-y-6">
      {/* ── Profile Hero ──────────────────────────────────── */}
      <section className="rounded-2xl border border-[#DDE6E4] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-[#17375E] to-[#0F8F83] text-white shadow-md">
              <UserRound className="size-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#102033]">
                {profile.full_name ?? t('عميل FAST INVESTMENT', 'FAST INVESTMENT Client')}
              </h1>
              <p className="mt-1 text-sm font-semibold text-[#64748B]">{profile.email}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-lg bg-[#EEF6F5] px-2.5 py-1 text-xs font-black text-[#0F8F83]">
                  <ShieldCheck className="size-3" />
                  {t('حساب عميل موثق', 'Verified Client Account')}
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-[#EEF6F5] px-2.5 py-1 text-xs font-black text-[#0F8F83]">
                  <Coins className="size-3" />
                  {balance.toLocaleString(numLocale)} {t('نقطة', 'pts')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-black text-[#64748B]">{t('تابعنا على', 'Follow us on')}</p>
            <div className="flex items-center gap-2">
              {SOCIAL_LINKS.map(({ href, icon, label, hoverBg }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className={`flex size-9 items-center justify-center rounded-xl border border-[#DDE6E4] text-[#64748B] transition hover:scale-110 hover:text-white ${hoverBg}`}
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Tab Navigation ────────────────────────────────── */}
      <div className="overflow-x-auto">
        <div className="flex min-w-max gap-1 rounded-2xl border border-[#DDE6E4] bg-white p-1.5 shadow-sm">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition ${
                activeTab === tab.id
                  ? 'bg-[#17375E] text-white shadow-sm'
                  : 'text-[#64748B] hover:bg-[#EEF6F5] hover:text-[#17375E]'
              }`}
            >
              {tab.icon}
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ───────────────────────────────────── */}
      {activeTab === 'account' && (
        <AccountTab
          profile={profile}
          preferredContact={preferredContact}
          setPreferredContact={setPreferredContact}
          profilePending={profilePending}
          profileMessage={profileMessage}
          handleUpdateProfile={handleUpdateProfile}
          passwordPending={passwordPending}
          passwordMessage={passwordMessage}
          handleChangePassword={handleChangePassword}
          t={t}
        />
      )}

      {activeTab === 'wallet' && (
        <WalletTab
          wallet={wallet}
          transactions={transactions}
          pointPackages={pointPackages}
          t={t}
          numLocale={numLocale}
        />
      )}

      {activeTab === 'ads' && (
        <AdsTab
          listings={listings}
          activeListings={activeListings}
          pendingListings={pendingListings}
          balance={balance}
          adCosts={adCosts}
          promotePending={promotePending}
          promoteMessages={promoteMessages}
          onPromote={handlePromoteAd}
          t={t}
          numLocale={numLocale}
        />
      )}

      {activeTab === 'saved_properties' && <SavedPropertiesTab t={t} />}
      {activeTab === 'saved_searches'   && <SavedSearchesTab t={t} />}

      {activeTab === 'support' && (
        <SupportTab
          ticketPending={ticketPending}
          ticketMessage={ticketMessage}
          handleCreateTicket={handleCreateTicket}
          supportTickets={supportTickets}
          t={t}
          numLocale={numLocale}
        />
      )}

      {activeTab === 'about'  && <AboutTab t={t} />}
      {activeTab === 'terms'  && <TermsTab t={t} />}
    </div>
  )
}

/* ── Tab: Account Details ──────────────────────────────── */

function AccountTab({
  profile,
  preferredContact,
  setPreferredContact,
  profilePending,
  profileMessage,
  handleUpdateProfile,
  passwordPending,
  passwordMessage,
  handleChangePassword,
  t,
}: {
  profile: Profile
  preferredContact: string
  setPreferredContact: (v: string) => void
  profilePending: boolean
  profileMessage: string | null
  handleUpdateProfile: (fd: FormData) => void
  passwordPending: boolean
  passwordMessage: string | null
  handleChangePassword: (fd: FormData) => void
  t: (ar: string, en: string) => string
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-[#DDE6E4] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="flex items-center gap-2 text-xl font-black text-[#102033]">
          <UserRound className="size-5 text-[#17375E]" />
          {t('البيانات الشخصية', 'Personal Information')}
        </h2>
        <form action={handleUpdateProfile} className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label={t('الاسم الكامل', 'Full Name')}>
            <Input name="full_name" defaultValue={profile.full_name ?? ''} className="h-10 border-[#DDE6E4]" required />
          </Field>
          <Field label={t('رقم الهاتف', 'Phone')}>
            <Input name="phone" defaultValue={profile.phone ?? ''} dir="ltr" className="h-10 border-[#DDE6E4] text-left" required />
          </Field>
          <Field label={t('البريد الإلكتروني', 'Email')}>
            <Input value={profile.email ?? ''} dir="ltr" readOnly className="h-10 border-[#DDE6E4] bg-[#FBFCFA] text-left" />
          </Field>
          <Field label={t('المنطقة / المحافظة', 'Region / Governorate')}>
            <Input name="region" defaultValue={profile.region ?? ''} className="h-10 border-[#DDE6E4]" />
          </Field>
          <div className="md:col-span-2">
            <Field label={t('طريقة التواصل المفضلة', 'Preferred Contact Method')}>
              <Select value={preferredContact} onValueChange={(v) => v && setPreferredContact(v)}>
                <SelectTrigger className="h-10 border-[#DDE6E4]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">{t('واتساب', 'WhatsApp')}</SelectItem>
                  <SelectItem value="phone">{t('اتصال مباشر', 'Direct Call')}</SelectItem>
                  <SelectItem value="internal_chat">{t('محادثة داخلية', 'Internal Chat')}</SelectItem>
                  <SelectItem value="email">{t('البريد الإلكتروني', 'Email')}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="flex items-center gap-3 md:col-span-2">
            <Button disabled={profilePending} className="bg-[#17375E] text-white hover:bg-[#102033]">
              {profilePending ? t('جاري الحفظ...', 'Saving...') : t('حفظ البيانات', 'Save Data')}
            </Button>
            {profileMessage && <p className="text-sm font-bold text-[#0F8F83]">{profileMessage}</p>}
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-[#DDE6E4] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="flex items-center gap-2 text-xl font-black text-[#102033]">
          <Lock className="size-5 text-[#17375E]" />
          {t('تغيير كلمة المرور', 'Change Password')}
        </h2>
        <p className="mt-2 text-sm font-semibold text-[#64748B]">{t('اختر كلمة مرور قوية لا تقل عن 8 أحرف.', 'Choose a strong password of at least 8 characters.')}</p>
        <form action={handleChangePassword} className="mt-5 space-y-4">
          <Field label={t('كلمة المرور الجديدة', 'New Password')}>
            <Input name="new_password" type="password" minLength={8} dir="ltr" className="h-10 border-[#DDE6E4] text-left" required />
          </Field>
          <Field label={t('تأكيد كلمة المرور', 'Confirm Password')}>
            <Input name="confirm_password" type="password" minLength={8} dir="ltr" className="h-10 border-[#DDE6E4] text-left" required />
          </Field>
          <div className="flex items-center gap-3">
            <Button disabled={passwordPending} className="bg-[#17375E] text-white hover:bg-[#102033]">
              {passwordPending ? t('جاري التغيير...', 'Changing...') : t('تغيير كلمة المرور', 'Change Password')}
            </Button>
            {passwordMessage && <p className="text-sm font-bold text-[#0F8F83]">{passwordMessage}</p>}
          </div>
        </form>
      </section>
    </div>
  )
}

/* ── Tab: Wallet / Payment ─────────────────────────────── */

function WalletTab({
  wallet,
  transactions,
  pointPackages,
  t,
  numLocale,
}: {
  wallet: Wallet | null
  transactions: WalletTransaction[]
  pointPackages: PointPackage[]
  t: (ar: string, en: string) => string
  numLocale: string
}) {
  const balance = Number(wallet?.points_balance ?? 0)
  const earned  = Number(wallet?.lifetime_points_earned ?? 0)
  const spent   = Number(wallet?.lifetime_points_spent ?? 0)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-gradient-to-br from-[#17375E] to-[#0F8F83] p-5 text-white shadow-md">
          <Coins className="size-6 opacity-80" />
          <p className="mt-3 text-3xl font-black">{balance.toLocaleString(numLocale)}</p>
          <p className="mt-1 text-sm font-bold opacity-80">{t('الرصيد الحالي (نقطة)', 'Current Balance (pts)')}</p>
        </div>
        <div className="rounded-2xl border border-[#DDE6E4] bg-white p-5 shadow-sm">
          <WalletCards className="size-6 text-[#0F8F83]" />
          <p className="mt-3 text-2xl font-black text-[#102033]">{earned.toLocaleString(numLocale)}</p>
          <p className="mt-1 text-sm font-semibold text-[#64748B]">{t('إجمالي النقاط المكتسبة', 'Total Points Earned')}</p>
        </div>
        <div className="rounded-2xl border border-[#DDE6E4] bg-white p-5 shadow-sm">
          <CreditCard className="size-6 text-[#C9964A]" />
          <p className="mt-3 text-2xl font-black text-[#102033]">{spent.toLocaleString(numLocale)}</p>
          <p className="mt-1 text-sm font-semibold text-[#64748B]">{t('إجمالي النقاط المستخدمة', 'Total Points Spent')}</p>
        </div>
      </div>

      <section className="rounded-2xl border border-[#C9964A]/30 bg-gradient-to-l from-[#FFF8EC] to-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#C9964A]">
              <CreditCard className="size-4" />
              {t('بوابة الدفع', 'Payment Gateway')} — Paymob
            </p>
            <h3 className="mt-2 text-xl font-black text-[#102033]">{t('شحن النقاط عبر Paymob', 'Top Up Points via Paymob')}</h3>
            <p className="mt-2 max-w-lg text-sm font-semibold leading-6 text-[#64748B]">
              {t(
                'استخدم بطاقتك البنكية أو محفظتك المحمولة لشحن نقاطك فوراً عبر بوابة Paymob الآمنة. تُضاف النقاط تلقائياً بعد تأكيد الدفع.',
                'Use your bank card or mobile wallet to top up your points instantly via Paymob. Points are added automatically after payment confirmation.'
              )}
            </p>
          </div>
          <Link
            href="/marketplace/buy-points"
            className="flex shrink-0 items-center gap-2 rounded-xl bg-[#C9964A] px-5 py-3 text-sm font-black text-white transition hover:bg-[#b8843a]"
          >
            <Coins className="size-4" />
            {t('شحن الآن', 'Top Up Now')}
            <ExternalLink className="size-4" />
          </Link>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#DDE6E4] bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-lg font-black text-[#102033]">{t('آخر عمليات المحفظة', 'Recent Wallet Transactions')}</h3>
          <div className="mt-4 space-y-2">
            {transactions.length === 0 ? (
              <EmptyState text={t('لا توجد معاملات مالية حتى الآن.', 'No transactions yet.')} />
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#FBFCFA] p-3">
                  <div className="min-w-0">
                    <p className="truncate font-black text-[#102033]">{tx.reason || tx.type}</p>
                    <p className="mt-0.5 text-xs font-semibold text-[#64748B]">
                      {new Date(tx.created_at).toLocaleDateString(numLocale, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <span className={`shrink-0 font-black ${Number(tx.points_delta) >= 0 ? 'text-[#0F8F83]' : 'text-red-500'}`}>
                    {Number(tx.points_delta) >= 0 ? '+' : ''}{Number(tx.points_delta).toLocaleString(numLocale)} {t('نقطة', 'pts')}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[#DDE6E4] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-[#102033]">{t('باقات الشحن المتاحة', 'Available Top-up Packages')}</h3>
            <Link href="/marketplace/buy-points" className="text-xs font-black text-[#0F8F83] hover:underline">
              {t('عرض الكل', 'View All')}
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {pointPackages.length === 0 ? (
              <EmptyState text={t('لا توجد باقات متاحة حالياً.', 'No packages available currently.')} />
            ) : (
              pointPackages.map((pack) => (
                <Link
                  key={pack.id}
                  href="/marketplace/buy-points"
                  className="flex items-center justify-between rounded-xl border border-[#DDE6E4] p-4 transition hover:border-[#0F8F83]/40 hover:bg-[#EEF6F5]"
                >
                  <div>
                    <p className="font-black text-[#102033]">{pack.name}</p>
                    <p className="mt-0.5 text-xs font-semibold text-[#64748B]">
                      {Number(pack.amount_egp).toLocaleString(numLocale)} {pack.currency || t('ج.م', 'EGP')}
                    </p>
                  </div>
                  <span className="font-black text-[#0F8F83]">
                    {Number(pack.points_amount).toLocaleString(numLocale)} {t('نقطة', 'pts')}
                  </span>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

/* ── Tab: My Ads ───────────────────────────────────────── */

function AdsTab({
  listings,
  activeListings,
  pendingListings,
  balance,
  adCosts,
  promotePending,
  promoteMessages,
  onPromote,
  t,
  numLocale,
}: {
  listings: Listing[]
  activeListings: number
  pendingListings: number
  balance: number
  adCosts?: AdCosts | null
  promotePending: boolean
  promoteMessages: Record<string, string>
  onPromote: (adId: string, kind: 'regular' | 'premium') => void
  t: (ar: string, en: string) => string
  numLocale: string
}) {
  const AD_STATUS: Record<string, { label: string; classes: string; icon: ReactNode }> = {
    approved: { label: t('نشط', 'Active'),           classes: 'bg-[#EEF6F5] text-[#0F8F83]',  icon: <CheckCircle2 className="size-3.5" /> },
    pending:  { label: t('قيد المراجعة', 'Pending'),  classes: 'bg-[#FFF8EC] text-[#C9964A]',  icon: <Clock        className="size-3.5" /> },
    rejected: { label: t('مرفوض', 'Rejected'),        classes: 'bg-red-50 text-red-600',       icon: <XCircle      className="size-3.5" /> },
    inactive: { label: t('غير نشط', 'Inactive'),      classes: 'bg-gray-100 text-gray-500',    icon: <XCircle      className="size-3.5" /> },
  }

  const regularCost = adCosts?.regular_points_cost ?? 10
  const premiumCost = adCosts?.premium_points_cost ?? 50

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#DDE6E4] bg-white p-5 shadow-sm">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#EEF6F5] text-[#17375E]">
            <Megaphone className="size-5" />
          </div>
          <p className="mt-3 text-sm font-semibold text-[#64748B]">{t('إجمالي الإعلانات', 'Total Ads')}</p>
          <p className="mt-1 text-2xl font-black text-[#102033]">{listings.length}</p>
        </div>
        <div className="rounded-2xl border border-[#DDE6E4] bg-white p-5 shadow-sm">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#EEF6F5] text-[#0F8F83]">
            <CheckCircle2 className="size-5" />
          </div>
          <p className="mt-3 text-sm font-semibold text-[#64748B]">{t('الإعلانات النشطة', 'Active Ads')}</p>
          <p className="mt-1 text-2xl font-black text-[#102033]">{activeListings}</p>
        </div>
        <div className="rounded-2xl border border-[#DDE6E4] bg-white p-5 shadow-sm">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#FFF8EC] text-[#C9964A]">
            <Clock className="size-5" />
          </div>
          <p className="mt-3 text-sm font-semibold text-[#64748B]">{t('قيد المراجعة', 'Pending Review')}</p>
          <p className="mt-1 text-2xl font-black text-[#102033]">{pendingListings}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-[#102033]">{t('إعلاناتي', 'My Ads')}</h2>
        <Link
          href="/marketplace/add-property"
          className="flex items-center gap-2 rounded-xl bg-[#17375E] px-4 py-2 text-sm font-black text-white transition hover:bg-[#102033]"
        >
          <PlusCircle className="size-4" />
          {t('إعلان جديد', 'New Ad')}
        </Link>
      </div>

      {listings.length === 0 ? (
        <section className="rounded-2xl border border-[#DDE6E4] bg-white p-10 text-center shadow-sm">
          <Megaphone className="mx-auto size-12 text-[#DDE6E4]" />
          <p className="mt-4 text-base font-black text-[#64748B]">{t('لا توجد إعلانات مضافة بعد', 'No ads added yet')}</p>
          <p className="mt-2 text-sm font-semibold text-[#64748B]">
            {t('أضف أول إعلان عقاري وابدأ الوصول لآلاف المشترين', 'Add your first property ad and reach thousands of buyers')}
          </p>
          <Link
            href="/marketplace/add-property"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#17375E] px-5 py-2.5 text-sm font-black text-white"
          >
            <PlusCircle className="size-4" />
            {t('أضف إعلانك الأول', 'Add Your First Ad')}
          </Link>
        </section>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {listings.map((listing) => {
            const cfg = AD_STATUS[listing.status] ?? AD_STATUS['inactive']
            return (
              <div
                key={listing.id}
                className="rounded-2xl border border-[#DDE6E4] bg-white p-5 shadow-sm transition hover:border-[#17375E]/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 flex-1 truncate font-black text-[#102033]">{listing.title}</p>
                  <span className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-black ${cfg.classes}`}>
                    {cfg.icon}
                    {cfg.label}
                  </span>
                </div>
                <p className="mt-1.5 text-xs font-semibold text-[#64748B]">
                  {new Date(listing.created_at).toLocaleDateString(numLocale, { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-lg font-black text-[#17375E]">
                    {Number(listing.price ?? 0).toLocaleString(numLocale)} {t('ج.م', 'EGP')}
                  </span>
                  <Link
                    href={`/marketplace/${listing.id}`}
                    className="flex items-center gap-1.5 rounded-lg border border-[#DDE6E4] px-3 py-1.5 text-xs font-black text-[#64748B] transition hover:border-[#17375E] hover:text-[#17375E]"
                  >
                    {t('عرض', 'View')} <ExternalLink className="size-3" />
                  </Link>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#DDE6E4] pt-3">
                  <button
                    type="button"
                    disabled={promotePending || balance < regularCost}
                    onClick={() => onPromote(listing.id, 'regular')}
                    className="flex items-center justify-center gap-1 rounded-lg border border-[#0F8F83]/30 bg-[#EEF6F5] py-2 text-xs font-black text-[#0F8F83] transition hover:bg-[#0F8F83] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    title={balance < regularCost ? `${t('تحتاج', 'Need')} ${regularCost} ${t('نقطة', 'pts')}` : ''}
                  >
                    <Coins className="size-3.5" />
                    Regular ({regularCost} {t('نقطة', 'pts')})
                  </button>
                  <button
                    type="button"
                    disabled={promotePending || balance < premiumCost}
                    onClick={() => onPromote(listing.id, 'premium')}
                    className="flex items-center justify-center gap-1 rounded-lg border border-[#C9964A]/30 bg-[#FFF8EC] py-2 text-xs font-black text-[#C9964A] transition hover:bg-[#C9964A] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    title={balance < premiumCost ? `${t('تحتاج', 'Need')} ${premiumCost} ${t('نقطة', 'pts')}` : ''}
                  >
                    <Coins className="size-3.5" />
                    Premium ({premiumCost} {t('نقطة', 'pts')})
                  </button>
                </div>
                {promoteMessages[listing.id] && (
                  <p className="mt-1 text-center text-xs font-bold text-[#0F8F83]">{promoteMessages[listing.id]}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── Tab: Saved Properties ─────────────────────────────── */

function SavedPropertiesTab({ t }: { t: (ar: string, en: string) => string }) {
  return (
    <section className="rounded-2xl border border-[#DDE6E4] bg-white p-10 text-center shadow-sm">
      <div className="mx-auto max-w-lg">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#EEF6F5]">
          <Bookmark className="size-8 text-[#0F8F83]" />
        </div>
        <h2 className="mt-5 text-2xl font-black text-[#102033]">{t('العقارات المحفوظة', 'Saved Properties')}</h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-[#64748B]">
          {t('هذا القسم قيد الإعداد. سيتم إظهار جميع العقارات التي قمت بحفظها هنا قريباً.', 'This section is under development. All saved properties will appear here soon.')}
        </p>
      </div>
    </section>
  )
}

/* ── Tab: Saved Searches ─────────────────────────────── */

function SavedSearchesTab({ t }: { t: (ar: string, en: string) => string }) {
  return (
    <section className="rounded-2xl border border-[#DDE6E4] bg-white p-10 text-center shadow-sm">
      <div className="mx-auto max-w-lg">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#FFF8EC]">
          <Search className="size-8 text-[#C9964A]" />
        </div>
        <h2 className="mt-5 text-2xl font-black text-[#102033]">{t('عمليات البحث المحفوظة (التنبيهات)', 'Saved Searches (Alerts)')}</h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-[#64748B]">
          {t(
            'هذا القسم قيد الإعداد. ستتمكن من حفظ فلاتر البحث الخاصة بك هنا لتلقي إشعارات عند توفر عقارات جديدة تطابق طلبك.',
            'This section is under development. You will be able to save search filters here to receive alerts when new matching properties are available.'
          )}
        </p>
      </div>
    </section>
  )
}

/* ── Tab: Support & Contact ────────────────────────────── */

function SupportTab({
  ticketPending,
  ticketMessage,
  handleCreateTicket,
  supportTickets,
  t,
  numLocale,
}: {
  ticketPending: boolean
  ticketMessage: string | null
  handleCreateTicket: (fd: FormData) => void
  supportTickets: SupportTicket[]
  t: (ar: string, en: string) => string
  numLocale: string
}) {
  const TICKET_STATUS: Record<string, string> = {
    open:        t('مفتوح', 'Open'),
    in_progress: t('قيد المعالجة', 'In Progress'),
    resolved:    t('تم الحل', 'Resolved'),
    closed:      t('مغلق', 'Closed'),
  }

  const PRIORITY_CLASSES: Record<string, string> = {
    low:      'bg-gray-100 text-gray-600',
    medium:   'bg-[#EEF6F5] text-[#0F8F83]',
    high:     'bg-[#FFF8EC] text-[#C9964A]',
    critical: 'bg-red-50 text-red-600',
  }

  const PRIORITY_LABEL: Record<string, string> = {
    low:      t('منخفض', 'Low'),
    medium:   t('متوسط', 'Medium'),
    high:     t('عالي', 'High'),
    critical: t('عاجل', 'Critical'),
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <section className="rounded-2xl border border-[#DDE6E4] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="flex items-center gap-2 text-xl font-black text-[#102033]">
            <Phone className="size-5 text-[#17375E]" />
            {t('وسائل التواصل المباشر', 'Direct Contact Methods')}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <a
              href="tel:+201101160208"
              className="flex items-center gap-3 rounded-xl border border-[#DDE6E4] p-4 transition hover:bg-[#FBFCFA]"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF6F5] text-[#17375E]">
                <Phone className="size-5" />
              </div>
              <div>
                <p className="font-black text-[#102033]">{t('خدمة العملاء', 'Customer Service')}</p>
                <p className="text-xs font-semibold text-[#64748B]" dir="ltr">+20 110 116 0208</p>
              </div>
            </a>

            <a
              href="https://wa.me/201101160208"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-xl border border-[#0F8F83]/25 bg-[#EEF6F5] p-4 transition hover:bg-white"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#0F8F83]">
                <MessageCircle className="size-5" />
              </div>
              <div>
                <p className="font-black text-[#102033]">WhatsApp Business</p>
                <p className="text-xs font-semibold text-[#64748B]">{t('تحدث معنا الآن', 'Chat with us now')}</p>
              </div>
            </a>

            <a
              href="mailto:support@fastinvestment.com"
              className="flex items-center gap-3 rounded-xl border border-[#DDE6E4] p-4 transition hover:bg-[#FBFCFA]"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF8EC] text-[#C9964A]">
                <Mail className="size-5" />
              </div>
              <div>
                <p className="font-black text-[#102033]">{t('البريد الإلكتروني', 'Email')}</p>
                <p className="text-xs font-semibold text-[#64748B]" dir="ltr">support@fastinvestment.com</p>
              </div>
            </a>

            <Link
              href="/marketplace/chat"
              className="flex items-center gap-3 rounded-xl border border-[#C9964A]/25 bg-[#FFF8EC] p-4 transition hover:bg-white"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#C9964A]">
                <MessageCircle className="size-5" />
              </div>
              <div>
                <p className="font-black text-[#102033]">{t('المحادثة الداخلية', 'Internal Chat')}</p>
                <p className="text-xs font-semibold text-[#64748B]">{t('دردشة مباشرة مع الفريق', 'Direct chat with the team')}</p>
              </div>
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-[#DDE6E4] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-black text-[#102033]">{t('تابعنا على منصات التواصل', 'Follow Us on Social Media')}</h2>
          <p className="mt-1 text-sm font-semibold text-[#64748B]">{t('ابق على اطلاع بأحدث العروض والمشاريع العقارية', 'Stay updated with the latest offers and real estate projects')}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {SOCIAL_LINKS.map(({ href, icon, label, sub, cardBg, cardText }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-xl border border-[#DDE6E4] p-4 transition hover:bg-[#FBFCFA]"
              >
                <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${cardBg} ${cardText}`}>
                  {icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-black text-[#102033]">{label}</p>
                  <p className="text-xs font-semibold text-[#64748B]">{sub}</p>
                </div>
                <ExternalLink className="size-3.5 shrink-0 text-[#64748B]" />
              </a>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[#DDE6E4] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="flex items-center gap-2 text-xl font-black text-[#102033]">
            <TicketCheck className="size-5 text-[#17375E]" />
            {t('إرسال طلب دعم جديد', 'Submit New Support Request')}
          </h2>
          <form action={handleCreateTicket} className="mt-4 space-y-3">
            <Input name="title" placeholder={t('عنوان الطلب', 'Request title')} className="h-10 border-[#DDE6E4]" required />
            <select
              name="category"
              defaultValue="marketplace"
              className="h-10 w-full rounded-lg border border-[#DDE6E4] bg-white px-3 text-sm font-bold"
            >
              <option value="marketplace">{t('السوق العقاري', 'Real Estate Market')}</option>
              <option value="payments">{t('الدفع والنقاط', 'Payments & Points')}</option>
              <option value="ads">{t('إدارة الإعلانات', 'Ad Management')}</option>
              <option value="account">{t('الحساب والملف الشخصي', 'Account & Profile')}</option>
            </select>
            <select
              name="priority"
              defaultValue="medium"
              className="h-10 w-full rounded-lg border border-[#DDE6E4] bg-white px-3 text-sm font-bold"
            >
              <option value="low">{t('أولوية منخفضة', 'Low Priority')}</option>
              <option value="medium">{t('أولوية متوسطة', 'Medium Priority')}</option>
              <option value="high">{t('أولوية عالية', 'High Priority')}</option>
              <option value="critical">{t('عاجل جداً', 'Very Urgent')}</option>
            </select>
            <textarea
              name="description"
              placeholder={t('اكتب تفاصيل طلبك وسيتواصل معك فريق الدعم في أقرب وقت', 'Write your request details and our support team will contact you shortly')}
              rows={4}
              className="w-full resize-none rounded-lg border border-[#DDE6E4] bg-white px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#0F8F83]/30"
              required
            />
            <Button disabled={ticketPending} className="w-full bg-[#17375E] text-white hover:bg-[#102033]">
              {ticketPending ? t('جاري الإرسال...', 'Sending...') : t('إرسال لخدمة العملاء', 'Send to Customer Service')}
            </Button>
            {ticketMessage && <p className="text-sm font-bold text-[#0F8F83]">{ticketMessage}</p>}
          </form>
        </section>
      </div>

      <aside>
        <section className="rounded-2xl border border-[#DDE6E4] bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-lg font-black text-[#102033]">{t('طلباتي السابقة', 'My Previous Requests')}</h3>
          <div className="mt-4 space-y-3">
            {supportTickets.length === 0 ? (
              <EmptyState text={t('لا توجد طلبات دعم سابقة.', 'No previous support requests.')} />
            ) : (
              supportTickets.map((ticket) => (
                <div key={ticket.id} className="rounded-xl border border-[#DDE6E4] p-3">
                  <p className="text-sm font-black text-[#102033]">{ticket.title}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded px-2 py-0.5 text-xs font-bold bg-[#EEF6F5] text-[#0F8F83]">
                      {TICKET_STATUS[ticket.status] ?? ticket.status}
                    </span>
                    <span className={`rounded px-2 py-0.5 text-xs font-bold ${PRIORITY_CLASSES[ticket.priority] ?? 'bg-gray-100 text-gray-600'}`}>
                      {PRIORITY_LABEL[ticket.priority] ?? ticket.priority}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-semibold text-[#64748B]">
                    {new Date(ticket.created_at).toLocaleDateString(numLocale, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </aside>
    </div>
  )
}

/* ── Tab: About Us ─────────────────────────────────────── */

function AboutTab({ t }: { t: (ar: string, en: string) => string }) {
  return (
    <section className="rounded-2xl border border-[#DDE6E4] bg-white p-10 text-center shadow-sm">
      <div className="mx-auto max-w-lg">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#EEF6F5]">
          <Info className="size-8 text-[#17375E] opacity-60" />
        </div>
        <h2 className="mt-5 text-2xl font-black text-[#102033]">{t('عن FAST INVESTMENT', 'About FAST INVESTMENT')}</h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-[#64748B]">
          {t('هذا القسم قيد الإعداد. سيتم إضافة محتوى التعريف بالشركة ورؤيتها ورسالتها قريباً من قِبل الإدارة العليا.', 'This section is under development. Company profile content, vision, and mission will be added soon by senior management.')}
        </p>
        <div className="mt-6 rounded-2xl bg-gradient-to-l from-[#EEF6F5] to-white p-5 text-right">
          <p className="font-black text-[#17375E]">FAST INVESTMENT</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#64748B]">
            {t(
              'منصة عقارية متكاملة تهدف إلى تسهيل عمليات البيع والشراء والاستثمار في سوق العقارات المصري بأعلى معايير الكفاءة والموثوقية.',
              'A comprehensive real estate platform aimed at facilitating buying, selling, and investing in the Egyptian real estate market with the highest standards of efficiency and reliability.'
            )}
          </p>
        </div>
        <p className="mt-6 text-xs font-semibold text-[#64748B]">
          {t('يمكن للإدارة العليا تحديث هذا المحتوى من لوحة التحكم.', 'Senior management can update this content from the control panel.')}
        </p>
      </div>
    </section>
  )
}

/* ── Tab: Terms ────────────────────────────────────────── */

function TermsTab({ t }: { t: (ar: string, en: string) => string }) {
  return (
    <section className="rounded-2xl border border-[#DDE6E4] bg-white p-10 text-center shadow-sm">
      <div className="mx-auto max-w-lg">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#FFF8EC]">
          <FileText className="size-8 text-[#C9964A] opacity-70" />
        </div>
        <h2 className="mt-5 text-2xl font-black text-[#102033]">{t('الشروط والأحكام', 'Terms & Conditions')}</h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-[#64748B]">
          {t('هذا القسم قيد الإعداد. سيتم رفع وثيقة الشروط والأحكام واتفاقية الاستخدام من قِبل الإدارة العليا.', 'This section is under development. The terms and conditions document will be uploaded by senior management.')}
        </p>
        <div className="mt-6 rounded-2xl bg-[#FFF8EC] p-5 text-right">
          <p className="font-black text-[#C9964A]">{t('ملاحظة هامة', 'Important Note')}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#64748B]">
            {t(
              'باستخدامك للمنصة، فأنت توافق على الشروط والسياسات التي سيتم نشرها قريباً. يمكنك التواصل مع فريق الدعم لأي استفسار قانوني أو تعاقدي.',
              'By using the platform, you agree to the terms and policies that will be published soon. You can contact the support team for any legal or contractual inquiries.'
            )}
          </p>
        </div>
        <p className="mt-6 text-xs font-semibold text-[#64748B]">
          {t('يمكن للإدارة العليا رفع وثيقة PDF أو HTML من لوحة التحكم.', 'Senior management can upload a PDF or HTML document from the control panel.')}
        </p>
      </div>
    </section>
  )
}

/* ── Shared helpers ────────────────────────────────────── */

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <Label className="text-sm font-black text-[#102033]">{label}</Label>
      {children}
    </label>
  )
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-xl bg-[#FBFCFA] p-4 text-sm font-semibold text-[#64748B]">{text}</p>
}

/* ── Inline social media SVGs ── */

function FbIcon()  { return <svg viewBox="0 0 24 24" fill="currentColor" className="size-5"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> }
function IgIcon()  { return <svg viewBox="0 0 24 24" fill="currentColor" className="size-5"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg> }
function XIcon()   { return <svg viewBox="0 0 24 24" fill="currentColor" className="size-5"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> }
function YtIcon()  { return <svg viewBox="0 0 24 24" fill="currentColor" className="size-5"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> }

const SOCIAL_LINKS = [
  {
    href:     'https://facebook.com/fastinvestment',
    icon:     <FbIcon />,
    label:    'Facebook',
    sub:      '@FastInvestment',
    hoverBg:  'hover:bg-blue-600  hover:border-blue-600',
    cardBg:   'bg-blue-50',
    cardText: 'text-blue-600',
  },
  {
    href:     'https://instagram.com/fastinvestment',
    icon:     <IgIcon />,
    label:    'Instagram',
    sub:      '@FastInvestment',
    hoverBg:  'hover:bg-pink-500  hover:border-pink-500',
    cardBg:   'bg-pink-50',
    cardText: 'text-pink-600',
  },
  {
    href:     'https://twitter.com/fastinvestment',
    icon:     <XIcon />,
    label:    'X / Twitter',
    sub:      '@FastInvestment',
    hoverBg:  'hover:bg-sky-500   hover:border-sky-500',
    cardBg:   'bg-sky-50',
    cardText: 'text-sky-600',
  },
  {
    href:     'https://youtube.com/@fastinvestment',
    icon:     <YtIcon />,
    label:    'YouTube',
    sub:      'FAST INVESTMENT',
    hoverBg:  'hover:bg-red-600   hover:border-red-600',
    cardBg:   'bg-red-50',
    cardText: 'text-red-600',
  },
]
