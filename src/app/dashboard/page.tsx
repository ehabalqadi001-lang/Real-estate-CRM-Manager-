import Link from 'next/link';
import {
  ArrowUpLeft,
  Building2,
  DollarSign,
  MapPin,
  PhoneCall,
  TrendingUp,
  Users,
} from 'lucide-react';

type KPI = {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ComponentType<{ className?: string }>;
};

const kpis: KPI[] = [
  {
    title: 'إجمالي الإيراد الشهري',
    value: 'EGP 4,850,000',
    change: '+12.4%',
    positive: true,
    icon: DollarSign,
  },
  {
    title: 'العملاء النشطون',
    value: '186',
    change: '+8.1%',
    positive: true,
    icon: Users,
  },
  {
    title: 'الوحدات المباعة',
    value: '27',
    change: '+5.7%',
    positive: true,
    icon: Building2,
  },
  {
    title: 'مكالمات المتابعة',
    value: '94',
    change: '-2.3%',
    positive: false,
    icon: PhoneCall,
  },
];

const regionPerformance = [
  { area: 'R7', deals: 9, revenue: 'EGP 1,450,000', demand: 'مرتفع' },
  { area: 'R8', deals: 7, revenue: 'EGP 1,120,000', demand: 'مرتفع' },
  { area: 'Downtown', deals: 6, revenue: 'EGP 1,540,000', demand: 'مرتفع جداً' },
  { area: 'CBD', deals: 5, revenue: 'EGP 740,000', demand: 'متوسط إلى مرتفع' },
];

const quickActions = [
  { title: 'إدارة العملاء', href: '/dashboard/leads' },
  { title: 'إضافة عميل جديد', href: '/dashboard/leads?new=1' },
  { title: 'مراجعة المطورين', href: '/dashboard/developers' },
  { title: 'تقارير العمولات', href: '/dashboard/commissions' },
];

export default function DashboardPage() {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-50 text-slate-900"
    >
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-6 px-6 py-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                منصة إدارة المبيعات العقارية
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  EHAB & ESLAM TEAM
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  لوحة تحكم احترافية لإدارة العملاء، متابعة الإيرادات، وتحليل الأداء
                  البيعي داخل السوق العقاري المصري مع تركيز على العاصمة الإدارية
                  الجديدة.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {quickActions.map((action) => (
                <Link
                  key={action.title}
                  href={action.href}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                >
                  {action.title}
                </Link>
              ))}
            </div>
          </div>
        </header>

        <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="rounded-2xl bg-slate-100 p-3">
                    <Icon className="h-5 w-5 text-slate-700" />
                  </div>

                  <div
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      item.positive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    {item.change}
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-sm text-slate-500">{item.title}</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {item.value}
                  </p>
                </div>
              </div>
            );
          })}
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold">أداء المناطق الرئيسية</h2>
                <p className="mt-1 text-sm text-slate-500">
                  نظرة سريعة على حركة البيع داخل مناطق العاصمة الإدارية الجديدة
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
                <MapPin className="h-4 w-4" />
                NAC Focus
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-right">
                <thead className="bg-slate-50">
                  <tr className="text-sm text-slate-500">
                    <th className="px-6 py-4 font-medium">المنطقة</th>
                    <th className="px-6 py-4 font-medium">عدد التعاقدات</th>
                    <th className="px-6 py-4 font-medium">الإيراد</th>
                    <th className="px-6 py-4 font-medium">مستوى الطلب</th>
                  </tr>
                </thead>
                <tbody>
                  {regionPerformance.map((row) => (
                    <tr
                      key={row.area}
                      className="border-t border-slate-100 text-sm text-slate-700"
                    >
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {row.area}
                      </td>
                      <td className="px-6 py-4">{row.deals}</td>
                      <td className="px-6 py-4">{row.revenue}</td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                          {row.demand}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold">ملخص تشغيلي</h3>
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">أفضل منطقة أداءً</p>
                  <p className="mt-1 text-base font-bold text-slate-900">
                    Downtown
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">أعلى معدل تحويل</p>
                  <p className="mt-1 text-base font-bold text-slate-900">
                    عملاء B2B - مطورين وشركات تسويق
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">أولوية هذا الأسبوع</p>
                  <p className="mt-1 text-base font-bold text-slate-900">
                    تعزيز المبيعات في R8 ورفع نسبة الإغلاق
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-300">نمو الإيراد السنوي</p>
                  <p className="mt-2 text-3xl font-bold">+21%</p>
                </div>
                <ArrowUpLeft className="h-6 w-6 text-emerald-400" />
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-300">
                الأداء الحالي يعكس قوة الطلب في مشروعات Downtown وR7 مع فرص نمو
                إضافية في الوحدات الإدارية والتجارية داخل CBD.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}