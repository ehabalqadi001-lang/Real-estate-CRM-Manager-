import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex" dir="rtl">
      
      {/* 1. القائمة الجانبية (غرفة التحكم المركزية) */}
      <Sidebar />

      {/* 2. منطقة المحتوى الديناميكي 
          - أضفنا (mr-72) لكي نترك مساحة 288 بيكسل على اليمين للقائمة الجانبية
          - أضفنا (w-full) لكي يأخذ باقي مساحة الشاشة بالكامل
      */}
      <main className="flex-1 mr-72 w-full min-h-screen transition-all duration-300">
        {children}
      </main>

    </div>
  )
}