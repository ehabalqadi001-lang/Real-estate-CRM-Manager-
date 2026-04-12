import './globals.css';
import Sidebar from '@/components/Sidebar';

export const metadata = {
  title: 'Fast Investment CRM',
  description: 'Enterprise Real Estate Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-slate-50 min-h-screen">
        <div className="flex">
          {/* الـ Sidebar الثابت */}
          <aside className="w-64 fixed inset-y-0 right-0 z-50">
            <Sidebar />
          </aside>

          {/* محتوى الصفحة المتغير - مع إزاحة (Margin) لعدم التداخل مع الـ Sidebar */}
          <main className="flex-1 mr-64 min-h-screen">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}