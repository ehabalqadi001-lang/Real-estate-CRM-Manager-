'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, DollarSign, Handshake,
  Building2, User, LogOut, Menu, Bell,
} from 'lucide-react'
import { useState } from 'react'
import type { AppProfile } from '@/shared/auth/types'
import { cn } from '@/lib/utils'

interface Props {
  profile: AppProfile
  children: React.ReactNode
}

const NAV_ITEMS = [
  { href: '/broker-portal',              label: 'لوحة التحكم',    icon: LayoutDashboard },
  { href: '/broker-portal/commissions',  label: 'عمولاتي',        icon: DollarSign },
  { href: '/broker-portal/deals',        label: 'صفقاتي',         icon: Handshake },
  { href: '/broker-portal/inventory',    label: 'المخزون',        icon: Building2 },
  { href: '/broker-portal/profile',      label: 'ملفي الشخصي',    icon: User },
]

export default function BrokerPortalShell({ profile, children }: Props) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex" dir="rtl">
      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 right-0 h-full w-64 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800',
          'z-50 flex flex-col transition-transform duration-300',
          'lg:translate-x-0 lg:static lg:z-auto',
          sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center text-white font-bold text-lg">
              ف
            </div>
            <div>
              <div className="font-bold text-gray-900 dark:text-white text-sm">FAST INVESTMENT</div>
              <div className="text-xs text-green-600">بوابة الوسيط</div>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-700 dark:text-green-300 font-semibold text-sm">
              {profile.full_name?.charAt(0) ?? 'و'}
            </div>
            <div className="min-w-0">
              <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                {profile.full_name ?? 'وسيط'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {profile.email ?? ''}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = href === '/broker-portal'
              ? pathname === href
              : pathname.startsWith(href)

            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            الانتقال للوحة الرئيسية
          </Link>
          <Link
            href="/auth/logout"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 lg:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden lg:block">
            <h1 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {NAV_ITEMS.find(item =>
                item.href === '/broker-portal'
                  ? pathname === item.href
                  : pathname.startsWith(item.href)
              )?.label ?? 'بوابة الوسيط'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
