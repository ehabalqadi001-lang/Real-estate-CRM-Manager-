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
import { useAuthStore } from '@/store/authStore'
import type { MarketplaceUser } from '@/domains/marketplace/types'
import { Building2, LayoutDashboard, LogIn, LogOut, MessageCircle, Plus, ShieldCheck, UserRound } from 'lucide-react'

export default function MarketplaceHeader({ user }: { user: MarketplaceUser | null }) {
  const router = useRouter()
  const { logout } = useAuthStore()

  const handleLogout = async () => {
    await logout()
    router.refresh()
    router.push('/marketplace')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#DDE6E4] bg-white/92 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/marketplace" className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-[#17375E] text-white">
            <Building2 className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-black text-[#102033]">EHAB & ESLAM TEAM</span>
            <span className="block truncate text-xs font-bold text-[#64748B]">Fast Investment Marketplace</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-bold text-[#4B6175] md:flex">
          <Link href="/marketplace" className="text-[#17375E]">السوق</Link>
          <Link href="/marketplace#developers" className="transition hover:text-[#17375E]">المطورون</Link>
          <Link href="/marketplace/add-property" className="transition hover:text-[#17375E]">أضف عقارك</Link>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button
                onClick={() => router.push('/marketplace/add-property')}
                className="hidden bg-[#17375E] text-white hover:bg-[#102033] sm:inline-flex"
              >
                <Plus className="ms-1 size-4" />
                أضف عقار
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger className="rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-[#0F8F83]/30">
                  <Avatar className="size-10 border border-[#DDE6E4]">
                    <AvatarFallback className="bg-[#EEF6F5] text-sm font-black text-[#17375E]">
                      {user.name.slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>
                    <div className="space-y-2">
                      <p className="font-black">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      {user.role && (
                        <Badge className="bg-[#EEF6F5] text-[#0F8F83]">
                          <ShieldCheck className="me-1 size-3" />
                          {user.role}
                        </Badge>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/marketplace/add-property')}>
                    <Plus className="ms-2 size-4" />
                    إضافة عقار
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/marketplace/chat')}>
                    <MessageCircle className="ms-2 size-4" />
                    محادثاتي
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                    <LayoutDashboard className="ms-2 size-4" />
                    لوحة التحكم
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-[#B54747]" onClick={handleLogout}>
                    <LogOut className="ms-2 size-4" />
                    تسجيل الخروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => router.push('/login')} className="text-[#17375E]">
                <LogIn className="ms-1 size-4" />
                دخول
              </Button>
              <Button onClick={() => router.push('/register')} className="bg-[#17375E] text-white hover:bg-[#102033]">
                <UserRound className="ms-1 size-4" />
                حساب جديد
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
