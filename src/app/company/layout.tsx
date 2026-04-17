import Sidebar from '@/components/Sidebar'

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F4F6F9] flex" dir="rtl">
      <Sidebar />
      <main className="flex-1 min-h-screen overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
