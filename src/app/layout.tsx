import Sidebar from '@/components/Sidebar' // تأكد من أن مسار الـ Sidebar صحيح حسب مشروعك

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex" dir="rtl">
      {/* الشريط الجانبي (تم تثبيته في الكود الخاص به) */}
      <Sidebar />
      
      {/* المحتوى الرئيسي (هنا يكمن السحر: mr-64 يترك مساحة للـ Sidebar و min-w-0 يمنع الجداول من تدمير التصميم) */}
      <main className="flex-1 lg:mr-64 min-w-0 transition-all duration-300">
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}