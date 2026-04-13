import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // 1. تثبيت ارتفاع الشاشة بالكامل ومنع التمدد الخارجي
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900" dir="rtl">
      
      {/* 2. استدعاء القائمة الجانبية */}
      <Sidebar />

      {/* 3. المحتوى الرئيسي: له سكرول منفصل (overflow-y-auto) ومحمي من الجداول العريضة (min-w-0) */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 transition-all duration-300">
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
      
    </div>
  )
}