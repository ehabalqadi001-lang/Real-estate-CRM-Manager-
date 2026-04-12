import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardStats from '@/components/DashboardStats';
import SalesChart from '@/components/SalesChart';
import RecentDeals from '@/components/RecentDeals';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  const cookieStore = await cookies();

  // 1. إنشاء عميل Supabase بنظام SSR الحديث
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  );

  // 2. التحقق من الجلسة
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  // 3. جلب البيانات بأمان (Safe Fetching)
  const { data: deals } = await supabase.from('deals').select('*');
  const { data: commissions } = await supabase.from('commissions').select('*');

  // 4. الحسابات مع التأكد من عدم وجود قيم null (الحماية من الانهيار)
  const safeDeals = deals || [];
  const safeCommissions = commissions || [];

  const totalSales = safeDeals.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const totalComm = safeCommissions.reduce((sum, c) => sum + Number(c.total_amount || 0), 0);
  const closedDeals = safeDeals.filter(d => d.status === 'Contracted').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-black text-slate-800">
          {locale === 'ar' ? 'نظرة عامة على الأداء' : 'Performance Overview'}
        </h1>
      </div>

      {/* المكونات التي أنشأناها في المجلد الصحيح */}
      <DashboardStats 
        stats={{
          totalSales: totalSales,
          totalCommissions: totalComm,
          activeDeals: safeDeals.length,
          closedDeals: closedDeals
        }} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <SalesChart data={safeDeals} />
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <RecentDeals deals={safeDeals.slice(0, 5)} />
        </div>
      </div>
    </div>
  );
}