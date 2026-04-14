import Sidebar from '@/components/Sidebar'

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* سنستخدم القائمة الجانبية الحالية مؤقتاً حتى نخصص واحدة للشركات لاحقاً */}
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}