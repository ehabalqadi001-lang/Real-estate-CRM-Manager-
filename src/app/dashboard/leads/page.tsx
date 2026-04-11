import { Search, SlidersHorizontal } from 'lucide-react';

type LeadStatus = 'جديد' | 'متابعة' | 'مغلق';

type Lead = {
  id: number;
  clientName: string;
  phone: string;
  status: LeadStatus;
  projectInterest: string;
  segment: 'B2B' | 'B2C';
};

const leads: Lead[] = [
  {
    id: 1,
    clientName: 'أحمد خالد',
    phone: '01012345678',
    status: 'جديد',
    projectInterest: 'OIA Compound',
    segment: 'B2C',
  },
  {
    id: 2,
    clientName: 'شركة النخبة للتسويق العقاري',
    phone: '01198765432',
    status: 'متابعة',
    projectInterest: 'R8',
    segment: 'B2B',
  },
  {
    id: 3,
    clientName: 'محمود عبد الله',
    phone: '01234567891',
    status: 'مغلق',
    projectInterest: 'CBD',
    segment: 'B2C',
  },
  {
    id: 4,
    clientName: 'شركة كابيتال بروكرز',
    phone: '01045678912',
    status: 'متابعة',
    projectInterest: 'Downtown',
    segment: 'B2B',
  },
  {
    id: 5,
    clientName: 'سارة محمد',
    phone: '01511122334',
    status: 'جديد',
    projectInterest: 'R7',
    segment: 'B2C',
  },
];

function statusClasses(status: LeadStatus) {
  switch (status) {
    case 'جديد':
      return 'bg-blue-50 text-blue-700 ring-blue-200';
    case 'متابعة':
      return 'bg-amber-50 text-amber-700 ring-amber-200';
    case 'مغلق':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
    default:
      return 'bg-slate-50 text-slate-700 ring-slate-200';
  }
}

export default function LeadsPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-700">
                EHAB & ESLAM TEAM
              </p>
              <h1 className="mt-2 text-2xl font-bold">إدارة العملاء المحتملين</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                متابعة عملاء B2B وB2C مع عرض واضح للحالة الحالية واهتمامات المشروعات.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_220px]">
              <div className="relative">
                <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث باسم العميل أو رقم الهاتف"
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white pr-10 pl-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div className="relative">
                <SlidersHorizontal className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  defaultValue=""
                  className="h-11 w-full appearance-none rounded-2xl border border-slate-200 bg-white pr-10 pl-4 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="">تصفية حسب الحالة</option>
                  <option value="new">جديد</option>
                  <option value="follow-up">متابعة</option>
                  <option value="closed">مغلق</option>
                </select>
              </div>
            </div>
          </div>
        </header>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-bold">جدول العملاء</h2>
            <p className="mt-1 text-sm text-slate-500">
              عرض منظم للعملاء المحتملين مع تصنيف الاهتمام بالمشروع وحالة المتابعة.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-right">
              <thead className="bg-slate-50">
                <tr className="text-sm text-slate-500">
                  <th className="px-6 py-4 font-medium">اسم العميل</th>
                  <th className="px-6 py-4 font-medium">الهاتف</th>
                  <th className="px-6 py-4 font-medium">الحالة</th>
                  <th className="px-6 py-4 font-medium">الاهتمام بالمشروع</th>
                  <th className="px-6 py-4 font-medium">النوع</th>
                </tr>
              </thead>

              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-t border-slate-100 text-sm text-slate-700"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {lead.clientName}
                    </td>
                    <td className="px-6 py-4">{lead.phone}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${statusClasses(
                          lead.status
                        )}`}
                      >
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{lead.projectInterest}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {lead.segment}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}