import Sidebar from '@/components/Sidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen w-full">
      {/* القائمة الجانبية تعمل كـ Component مستقل */}
      <Sidebar />

      {/* منطقة المحتوى تترك مسافة 72 (288px) للقائمة الجانبية من اليمين (mr-72) */}
      <main className="flex-1 mr-72 w-full transition-all duration-300">
        <div className="p-6 md:p-10 w-full max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}