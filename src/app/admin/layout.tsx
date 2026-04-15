import Sidebar from '@/components/Sidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-slate-50 w-full font-cairo" dir="rtl">
      
      {/* 1. القائمة الجانبية */}
      <Sidebar />

      {/* 2. المحتوى الرئيسي للإدارة - مع ترك مسافة 288 بكسل (mr-72) للقائمة */}
      <main className="flex-1 mr-72 w-full transition-all duration-300">
        <div className="p-6 md:p-10 w-full max-w-7xl mx-auto">
          {children}
        </div>
      </main>

    </div>
  )
}