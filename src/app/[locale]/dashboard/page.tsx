import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardStats from '@/components/DashboardStats';
import SalesChart from '@/components/SalesChart';
import RecentDeals from '@/components/RecentDeals';
import { getMessages } from 'next-intl/server';

// تعريف الأنواع لضمان دقة البيانات (TypeScript)
interface Deal {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  title: string;
}

interface Commission {
  total_amount: number;
  status: string;
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  // 1. التعامل مع Next.js 15 Params (انتظار الـ Promise)
  const { locale } = await params;

  // 2. تهيئة الاتصال بـ Supabase
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Handle error if needed
          }
        },
      },
    }
  );

  // 3. التحقق من صلاحية الجلسة (Session)
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect(`/${locale}/login`);
  }

  // 4. جلب البيانات من الجداول الجديدة (Deals & Commissions)
  // استخدمنا جلب متوازي (Parallel Fetching) لسرعة الأداء
  const [dealsResponse, commissionsResponse] = await Promise.all([
    supabase
      .from('deals')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('commissions')
      .select('total_amount, status')
  ]);

  const deals: Deal[] = dealsResponse.data || [];
  const commissions: Commission[] = commissionsResponse.data || [];

  // 5. الحسابات الذكية (مقاومة للقيم الفارغة null-safe)
  // حساب إجمالي المبيعات
  const totalSalesAmount = deals.reduce((sum, deal) => sum + Number(deal.amount || 0), 0);
  
  // حساب إجمالي العمولات المتوقعة
  const totalCommissionsAmount = commissions.reduce((sum, comm) => sum + Number(comm.total_amount || 0), 0);

  // حساب عدد الصفقات المغلقة (Contracted)
  const closedDealsCount = deals.filter(d => d.status === 'Contracted' || d.status === 'Won').length;

  // حساب نسبة النمو (افتراضية حالياً أو يمكن برمجتها لمقارنة الشهر السابق)
  const growthRate = 12.5; 

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">
          {locale === 'ar' ? 'لوحة التحكم الاحترافية' : 'Professional Dashboard'}
        </h1>
        <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm">
          {new Date().toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          })}
        </div>
      </div>

      {/* 📊 مكون الإحصائيات السريعة */}
      <DashboardStats 
        stats={{
          totalSales: totalSalesAmount,
          totalCommissions: totalCommissionsAmount,
          activeDeals: deals.length,
          closedDeals: closedDealsCount,
          growth: growthRate
        }} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 📈 الرسم البياني للمبيعات */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            {locale === 'ar' ? 'تحليل أداء المبيعات' : 'Sales Performance Analysis'}
          </h2>
          <SalesChart data={deals} />
        </div>

        {/* 📝 قائمة آخر العمليات */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            {locale === 'ar' ? 'أحدث الصفقات' : 'Recent Deals'}
          </h2>
          <RecentDeals deals={deals.slice(0, 5)} />
        </div>
      </div>
    </div>
  );
}