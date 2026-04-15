import '@/app/globals.css' // السطر الأهم لاستدعاء الدرع البصري (Tailwind)
import Sidebar from '@/components/Sidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex" dir="rtl">
      
      {/* 1. القائمة الجانبية (غرفة التحكم المركزية) */}
      <Sidebar />

      {/* 2. المحتوى الرئيسي للإدارة العليا 
          - استخدمنا mr-72 لترك مساحة للقائمة الجانبية حتى لا تغطي على المحتوى
      */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden mr-72 transition-all duration-300">
        <div className="p-6 md:p-10 max-w-7xl mx-auto pb-24">
          {children}
        </div>
      </main>

    </div>
  )
}