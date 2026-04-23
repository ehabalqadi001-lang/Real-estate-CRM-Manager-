'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import MarketplaceNotificationBell from '@/components/marketplace/MarketplaceNotificationBell'
import { useAuthStore } from '@/store/authStore'
import type { MarketplaceUser } from '@/domains/marketplace/types'
import {
  Building2,
  Coins,
  Handshake,
  LogIn,
  LogOut,
  MessageCircle,
  Plus,
  ShieldCheck,
  UserRound,
} from 'lucide-react'

export default function MarketplaceHeader({ user }: { user: MarketplaceUser | null }) {
  const router = useRouter()
  const { logout } = useAuthStore()

  async function handleLogout() {
    await logout()
    router.refresh()
    router.push('/marketplace')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-market-line bg-[#0D0D0D]/82 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/marketplace" className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-2xl border border-market-line bg-white text-[#0D0D0D] shadow-sm">
            <Building2 className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-black text-market-ink">FAST INVESTMENT</span>
            <span className="block truncate text-xs font-bold text-market-slate">Enterprise CRM Marketplace</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-bold text-market-slate md:flex">
          <Link href="/marketplace" className="text-white">السوق</Link>
          <Link href="/marketplace#developers" className="transition hover:text-white">المطورون</Link>
          <Link href="/marketplace/buy-points" className="transition hover:text-market-teal">شراء نقاط</Link>
          <Link href="/marketplace/add-property" className="transition hover:text-white">أضف وحدتك</Link>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button
                type="button"
                onClick={() => router.push('/marketplace/add-property')}
                className="nextora-button hidden rounded-2xl sm:inline-flex"
              >
                <Plus className="ms-1 size-4" />
                أضف وحدة
              </Button>

              <MarketplaceNotificationBell />

              <DropdownMenu>
                <DropdownMenuTrigger className="rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-market-teal/30">
                  <Avatar className="size-10 border border-market-line">
                    <AvatarFallback className="bg-market-mist text-sm font-black text-white">
                      {getInitial(user.name)}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>
                    <div className="space-y-2 text-right">
                      <p className="font-black text-market-ink">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <Badge className="bg-market-mist text-market-teal">
                        <ShieldCheck className="me-1 size-3" />
                        {user.role === 'CLIENT' || user.role === 'client' ? 'عميل' : user.role ?? 'مستخدم'}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => router.push('/marketplace/profile')}>
                    <UserRound className="ms-2 size-4" />
                    الملف الشخصي
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => router.push('/marketplace/add-property')}>
                    <Plus className="ms-2 size-4" />
                    إضافة وحدة
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => router.push('/marketplace/buy-points')}>
                    <Coins className="ms-2 size-4" />
                    شراء نقاط
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => router.push('/marketplace/chat')}>
                    <MessageCircle className="ms-2 size-4" />
                    المحادثات والدعم
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-market-rose" onClick={handleLogout}>
                    <LogOut className="ms-2 size-4" />
                    تسجيل الخروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => router.push('/login')} className="rounded-2xl text-white hover:bg-white/10">
                <LogIn className="ms-1 size-4" />
                دخول
              </Button>
              <Button
                onClick={() => router.push('/register?role=client')}
                className="nextora-button rounded-2xl"
              >
                <UserRound className="ms-1 size-4" />
                تسجيل عميل
              </Button>
              <Button
                onClick={() => router.push('/register?role=partner')}
                className="hidden rounded-2xl border border-market-line bg-white/8 text-white hover:bg-white/14 sm:inline-flex"
              >
                <Handshake className="ms-1 size-4" />
                FAST PARTNERS
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

function getInitial(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || 'F'
}
