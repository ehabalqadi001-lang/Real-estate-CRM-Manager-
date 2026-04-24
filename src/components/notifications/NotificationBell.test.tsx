import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { NotificationBell } from './NotificationBell'
import { useNotifications } from './useNotifications'

// 1. محاكاة (Mock) للـ Hook الخاص بالإشعارات
jest.mock('./useNotifications', () => ({
  useNotifications: jest.fn(),
}))

// 2. محاكاة مكون NotificationCenter
jest.mock('./NotificationCenter', () => ({
  NotificationCenter: ({ open, onOpenChange }: any) => (
    <div data-testid="mock-notification-center" data-open={open}>
      <button onClick={() => onOpenChange(false)}>Close</button>
    </div>
  ),
}))

// 3. محاكاة Framer Motion لتجنب أخطاء الأنيميشن أثناء الاختبار
jest.mock('framer-motion', () => {
  const React = require('react')
  return {
    motion: {
      span: ({ children, className }: any) => <span className={className}>{children}</span>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  }
})

describe('NotificationBell Component', () => {
  const mockUseNotifications = useNotifications as jest.Mock

  // إعداد البيانات الافتراضية قبل كل اختبار
  beforeEach(() => {
    mockUseNotifications.mockReturnValue({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      isLoadingMore: false,
      hasMore: false,
      error: null,
      loadMore: jest.fn(),
      markRead: jest.fn(),
      markAllRead: jest.fn(),
      deleteAll: jest.fn(),
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('يجب أن يعرض زر مفعل عندما يتم تمرير userId', () => {
    render(<NotificationBell userId="user-123" />)
    
    const button = screen.getByRole('button', { name: 'فتح الإشعارات' })
    expect(button).toBeInTheDocument()
    expect(button).not.toBeDisabled()
  })

  it('يجب أن يفتح NotificationCenter عند النقر على الزر', () => {
    render(<NotificationBell userId="user-123" />)
    
    const button = screen.getByRole('button', { name: 'فتح الإشعارات' })
    fireEvent.click(button)
    
    const center = screen.getByTestId('mock-notification-center')
    expect(center).toHaveAttribute('data-open', 'true')
  })

  it('لا يجب أن يعرض دائرة التنبيهات (Badge) عندما يكون عدد الإشعارات غير المقروءة صفر', () => {
    render(<NotificationBell userId="user-123" />)
    
    // نبحث عن أي نص يحتوي على أرقام
    const badge = screen.queryByText(/[٠-٩0-9]+/)
    expect(badge).not.toBeInTheDocument()
  })

  it('يجب أن يعرض الرقم بالأرقام العربية (مثال: ٥) عندما يكون unreadCount أكبر من صفر', () => {
    mockUseNotifications.mockReturnValue({
      unreadCount: 5,
    })
    render(<NotificationBell userId="user-123" />)
    
    // الرقم 5 بتنسيق ar-EG هو '٥'
    const badge = screen.getByText('٥')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-red-600') // للتأكد من ألوان التنبيه
  })

  it('يجب أن يعرض "٩٩+" عندما يكون عدد الإشعارات غير المقروءة أكبر من 99', () => {
    mockUseNotifications.mockReturnValue({
      unreadCount: 150,
    })
    render(<NotificationBell userId="user-123" />)
    
    const badge = screen.getByText('٩٩+')
    expect(badge).toBeInTheDocument()
  })
})