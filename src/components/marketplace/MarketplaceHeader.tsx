'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import MarketplaceNotificationBell from '@/components/marketplace/MarketplaceNotificationBell'
import { useAuthStore } from '@/store/authStore'
import type { MarketplaceUser } from '@/domains/marketplace/types'
import {
  Building2, Coins, Handshake, LogIn, LogOut,
  MessageCircle, Plus, ShieldCheck, UserRound, Sparkles,
} from 'lucide-react'
import { buttonMotion } from '@/lib/motion'

export default function MarketplaceHeader({ user }: { user: MarketplaceUser | null }) {
  const router = useRouter()
  const { logout } = useAuthStore()

  async function handleLogout() {
    await logout()
    router.refresh()
    router.push('/marketplace')
  }

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      className="fi-market-header sticky top-0 z-50"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5">
        {/* Logo */}
        <Link href="/marketplace" className="flex min-w-0 items-center gap-3 group">
          <motion.span
            whileHover={{ scale: 1.08, rotate: -3 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="flex size-10 shrink-0 items-center justify-center rounded-2xl shadow-md"
            // eslint-disable-next-line no-inline-styles/no-inline-styles
            style={{ background: 'linear-gradient(135deg, #07172f 0%, #1a3a7a 100%)' }}
          >
            <Building2 className="size-5 text-white" />
          </motion.span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-black text-slate-900 group-hover:text-blue-700 transition-colors">
              FAST INVESTMENT
            </span>
            <span className="block truncate text-[10px] font-bold text-slate-400">
              Real Estate Marketplace
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {[
            { href: '/marketplace', label: 'Browse' },
            { href: '/marketplace#developers', label: 'Packages' },
            { href: '/marketplace/buy-points', label: 'Buy Points' },
            { href: '/marketplace/add-property', label: 'List Property' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-xl px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <motion.button
                type="button"
                onClick={() => router.push('/marketplace/add-property')}
                {...buttonMotion}
                className="hidden h-10 items-center gap-2 rounded-2xl px-4 text-sm font-black text-white sm:inline-flex"
                // eslint-disable-next-line no-inline-styles/no-inline-styles
                style={{ background: 'linear-gradient(135deg, #07172f, #1a3a7a)' }}
              >
                <Plus className="size-4" />
                Add Listing
              </motion.button>
              <MarketplaceNotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger className="rounded-2xl outline-none">
                  <Avatar className="size-10 border-2 border-blue-100 transition hover:border-blue-400">
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-emerald-500 text-sm font-black text-white">
                      {getInitial(user.name)}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>
                    <div className="space-y-1">
                      <p className="font-black text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                      <Badge className="bg-blue-50 text-blue-700">
                        <ShieldCheck className="mr-1 size-3" />
                        {user.role === 'CLIENT' || user.role === 'client' ? 'Client' : user.role ?? 'User'}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => router.push('/marketplace/profile')}><UserRound className="mr-2 size-4" />My Profile</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => router.push('/marketplace/add-property')}><Plus className="mr-2 size-4" />Add Listing</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => router.push('/marketplace/buy-points')}><Coins className="mr-2 size-4" />Buy Points</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => router.push('/marketplace/chat')}><MessageCircle className="mr-2 size-4" />Messages</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600" onClick={handleLogout}><LogOut className="mr-2 size-4" />Sign Out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <motion.button
                type="button"
                onClick={() => router.push('/login')}
                {...buttonMotion}
                className="h-10 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-slate-300"
              >
                <LogIn className="mr-1.5 inline size-4" />
                Sign In
              </motion.button>
              <motion.button
                type="button"
                onClick={() => router.push('/register?role=client')}
                {...buttonMotion}
                className="hidden h-10 items-center gap-2 rounded-2xl px-4 text-sm font-black text-white sm:inline-flex"
                // eslint-disable-next-line no-inline-styles/no-inline-styles
                style={{ background: 'linear-gradient(135deg, #07172f, #1a3a7a)' }}
              >
                <UserRound className="size-4" />
                Register
              </motion.button>
              <motion.button
                type="button"
                onClick={() => router.push('/register?role=partner')}
                {...buttonMotion}
                className="hidden h-10 items-center gap-2 rounded-2xl px-4 text-sm font-black text-white sm:inline-flex"
                // eslint-disable-next-line no-inline-styles/no-inline-styles
                style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)' }}
              >
                <Handshake className="size-4" />
                <Sparkles className="size-3" />
                Partners
              </motion.button>
            </>
          )}
        </div>
      </div>
    </motion.header>
  )
}

function getInitial(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || 'F'
}
