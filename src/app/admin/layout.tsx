import Sidebar from '@/components/Sidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#F4F6F9]" dir="rtl">
      <Sidebar />
      <main className="flex-1 min-h-screen overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
