import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { DollarSign, Wallet, Clock, Printer, Zap } from 'lucide-react';
import CommissionChart from '@/components/CommissionChart';

export default async function CommissionsPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  );

  // جلب العمولات مع تفاصيل الصفقة المرتبطة بها
  const { data: commissions } = await supabase
    .from('commissions')
    .select(`
      *,
      deals (title, client_name)
    `)
    .order('created_at', { ascending: false });

  // حساب الإجماليات
// ✅ تعديل بسيط لضمان عدم حدوث الانهيار
const totalEarned = commissions?.reduce((sum, c) => sum + Number(c.total_amount || 0), 0) || 0;
const totalCollected = commissions?.reduce((sum, c) => sum + Number(c.collected_amount || 0), 0) || 0;
const totalPending = commissions?.reduce((sum, c) => sum + Number(c.pending_amount || 0), 0) || 0;  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      
      {/* رأس الصفحة والإجراءات */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">العمولات والمطالبات المالية</h1>
          <p className="text-slate-500 text-sm mt-1">تتبع مستحقاتك، وتوقعات الصرف الشهرية.</p>
        </div>
        <div className="flex gap-2">
          {/* زر طباعة (يستخدم window.print في الكلاينت، سنعطيه كلاس للطباعة) */}
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-bold transition">
            <Printer size={16} /> تصدير كشف حساب PDF
          </button>
        </div>
      </div>

      {/* بطاقات الإحصائيات (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-lg text-blue-600"><DollarSign size={24} /></div>
          <div>
            <p className="text-sm font-bold text-slate-500">إجمالي مستحق (Earned)</p>
            <p className="text-2xl font-black text-slate-800">{totalEarned.toLocaleString()} <span className="text-sm font-normal text-slate-400">EGP</span></p>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="bg-green-50 p-3 rounded-lg text-green-600"><Wallet size={24} /></div>
          <div>
            <p className="text-sm font-bold text-slate-500">تم تحصيله (Collected)</p>
            <p className="text-2xl font-black text-slate-800">{totalCollected.toLocaleString()} <span className="text-sm font-normal text-slate-400">EGP</span></p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="bg-amber-50 p-3 rounded-lg text-amber-600"><Clock size={24} /></div>
          <div>
            <p className="text-sm font-bold text-slate-500">متبقي قيد الانتظار (Pending)</p>
            <p className="text-2xl font-black text-slate-800">{totalPending.toLocaleString()} <span className="text-sm font-normal text-slate-400">EGP</span></p>
          </div>
        </div>
      </div>

      {/* قسم الرسم البياني وجدول التفاصيل */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* الرسم البياني (يأخذ ثلثي الشاشة) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-2">توقعات الصرف الشهرية</h3>
          <CommissionChart data={commissions || []} />
        </div>

        {/* كارت طلب الدفع المبكر (ميزة Nawy) */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-xl shadow-md text-white flex flex-col justify-between">
          <div>
            <div className="bg-white/20 w-fit p-2 rounded-lg mb-4"><Zap size={24} /></div>
            <h3 className="font-black text-xl mb-2">طلب الدفع المبكر (Early Pay)</h3>
            <p className="text-indigo-100 text-sm leading-relaxed">
              لا تنتظر موعد الاستحقاق! يمكنك الآن طلب صرف جزء من عمولتك المتبقية مقدماً بخصم نسبة إدارية بسيطة (خاضع لموافقة الإدارة).
            </p>
          </div>
          <button className="mt-6 w-full bg-white text-indigo-700 font-black py-3 rounded-lg hover:bg-slate-50 transition shadow-lg">
            تقديم طلب الآن
          </button>
        </div>

      </div>

      {/* جدول العمولات */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100"><h3 className="font-bold text-slate-800">تفاصيل العمولات</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-4">الصفقة</th>
                <th className="px-6 py-4">العمولة الكلية</th>
                <th className="px-6 py-4">المحصّل</th>
                <th className="px-6 py-4">تاريخ الاستحقاق</th>
                <th className="px-6 py-4">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {commissions?.map((comm) => (
                <tr key={comm.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 font-bold text-slate-800">{comm.deals?.title}</td>
                  <td className="px-6 py-4 text-blue-600 font-bold">{Number(comm.total_amount).toLocaleString()} EGP</td>
                  <td className="px-6 py-4 text-green-600 font-bold">{Number(comm.collected_amount).toLocaleString()} EGP</td>
                  <td className="px-6 py-4 text-slate-500">{comm.expected_date || 'غير محدد'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      comm.status === 'Paid' ? 'bg-green-100 text-green-700' : 
                      comm.status === 'Partial' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {comm.status}
                    </span>
                  </td>
                </tr>
              ))}
              {(!commissions || commissions.length === 0) && (
                <tr><td colSpan={5} className="text-center py-10 text-slate-400">لا توجد عمولات مسجلة حتى الآن</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}