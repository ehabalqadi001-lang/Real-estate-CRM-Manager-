import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // حاوية تملأ الشاشة بالكامل وتمنع السكرول المزدوج
    <div className="flex h-screen w-full overflow-hidden bg-slate-50" dir="rtl">
      
      {/* القائمة الجانبية الوحيدة والحصرية */}
      <Sidebar />

      {/* المحتوى الرئيسي (مرن، يتقلص ولا يطغى على القائمة) */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 transition-all duration-300 relative">
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto pb-24">
          {children}
        </div>
      </main>
      
    </div>
  )
}