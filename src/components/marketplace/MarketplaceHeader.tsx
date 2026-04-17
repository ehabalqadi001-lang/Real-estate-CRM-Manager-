'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/authStore'
import { Building2, Plus, User, LogOut, Settings } from 'lucide-react'

export default function MarketplaceHeader() {
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 rtl:space-x-reverse">
            <Building2 className="h-8 w-8 text-navy" />
            <span className="text-xl font-bold text-navy dark:text-white">
              Fast Investment
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6 rtl:space-x-reverse">
            <Link
              href="/marketplace"
              className="text-slate-600 hover:text-navy dark:text-slate-300 dark:hover:text-white transition-colors"
            >
              السوق
            </Link>
            <Link
              href="/developers"
              className="text-slate-600 hover:text-navy dark:text-slate-300 dark:hover:text-white transition-colors"
            >
              المطورون
            </Link>
            <Link
              href="/about"
              className="text-slate-600 hover:text-navy dark:text-slate-300 dark:hover:text-white transition-colors"
            >
              عن المنصة
            </Link>
          </nav>

          {/* Auth Section */}
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            {user ? (
              <>
                {/* Add Property Button */}
                <Button
                  onClick={() => router.push('/marketplace/add-property')}
                  className="bg-navy hover:bg-navy-light text-white"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة عقار
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="relative h-10 w-10 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {user.email?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.email ?? 'المستخدم'}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                        {user.role && (
                          <Badge variant="secondary" className="w-fit text-xs">
                            {user.role}
                          </Badge>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/profile')}>
                      <User className="ml-2 h-4 w-4" />
                      <span>الملف الشخصي</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                      <Building2 className="ml-2 h-4 w-4" />
                      <span>لوحة التحكم</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/settings')}>
                      <Settings className="ml-2 h-4 w-4" />
                      <span>الإعدادات</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      disabled={isLoading}
                      className="text-red-600 focus:text-red-600"
                    >
                      <LogOut className="ml-2 h-4 w-4" />
                      <span>{isLoading ? 'جاري الخروج...' : 'تسجيل الخروج'}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <Button
                  variant="ghost"
                  onClick={() => router.push('/login')}
                  className="text-navy hover:text-navy-light hover:bg-navy/10"
                >
                  تسجيل الدخول
                </Button>
                <Button
                  onClick={() => router.push('/register')}
                  className="bg-navy hover:bg-navy-light text-white"
                >
                  إنشاء حساب
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
