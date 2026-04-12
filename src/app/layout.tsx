import './globals.css';
import Sidebar from '@/components/Sidebar';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-slate-50 min-h-screen overflow-x-hidden">
        <div className="flex relative">
          {/* الـ Sidebar الثابت الوحيد في النظام */}
          <aside className="w-64 fixed inset-y-0 right-0 z-50 bg-slate-900 shadow-xl border-l border-slate-800">
            <Sidebar />
          </aside>

          {/* محتوى الصفحات مع إزاحة صحيحة */}
          <main className="flex-1 mr-64 min-h-screen w-full relative">
            <div className="p-4 md:p-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}