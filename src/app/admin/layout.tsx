// حقن إجباري ومباشر لملف التنسيقات (هذا هو الحل الجذري لانقطاع التصميم)
import '../globals.css' 
import Sidebar from '@/components/Sidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex w-full font-cairo" dir="rtl">
      
      {/* 1. القائمة الجانبية */}
      <Sidebar />

      {/* 2. المحتوى الرئيسي */}
      <main className="flex-1 mr-72 w-full transition-all duration-300">
        <div className="p-6 md:p-10 w-full max-w-7xl mx-auto">
          {children}
        </div>
      </main>

    </div>
  )
}