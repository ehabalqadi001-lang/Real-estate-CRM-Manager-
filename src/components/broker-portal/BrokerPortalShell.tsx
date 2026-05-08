'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, DollarSign, Handshake,
  Building2, User, LogOut, Menu, FileUp,
} from 'lucide-react'
import { useState } from 'react'
import type { AppProfile } from '@/shared/auth/types'
import { isBrokerRole } from '@/shared/auth/types'
import { cn } from '@/lib/utils'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { useI18n } from '@/hooks/use-i18n'

interface Props {
  profile: AppProfile
  children: React.ReactNode
}

export default function BrokerPortalShell({ profile, children }: Props) {
  const pathname = usePathname()
  const { t } = useI18n()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const NAV_ITEMS = [
    { href: '/broker-portal',              label: t('لوحة التحكم', 'Dashboard'),      icon: LayoutDashboard },
    { href: '/broker-portal/sales',        label: t('رفع المبيعات', 'Upload Sales'),   icon: FileUp },
    { href: '/broker-portal/commissions',  label: t('عمولاتي', 'My Commissions'),      icon: DollarSign },
    { href: '/broker-portal/deals',        label: t('صفقاتي', 'My Deals'),             icon: Handshake },
    { href: '/broker-portal/inventory',    label: t('المخزون', 'Inventory'),           icon: Building2 },
    { href: '/broker-portal/profile',      label: t('ملفي الشخصي', 'My Profile'),      icon: User },
  ]

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
              <div className="text-xs text-green-600">{t('بوابة الوسيط', 'Broker Portal')}</div>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name ?? ''}
                className="w-10 h-10 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-700 dark:text-green-300 font-semibold text-sm shrink-0">
                {profile.full_name?.charAt(0) ?? 'و'}
              </div>
            )}
            <div className="min-w-0">
              <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                {profile.full_name ?? t('وسيط', 'Broker')}
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
          {!isBrokerRole(profile.role) && (
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              {t('الانتقال للوحة الرئيسية', 'Go to Main Dashboard')}
            </Link>
          )}
          <form action="/auth/logout" method="post">
            <button type="submit" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full">
              <LogOut className="w-4 h-4" />
              {t('تسجيل الخروج', 'Sign Out')}
            </button>
          </form>
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
              )?.label ?? t('بوابة الوسيط', 'Broker Portal')}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell userId={profile.id} />
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
