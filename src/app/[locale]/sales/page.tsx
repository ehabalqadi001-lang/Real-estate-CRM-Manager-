import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import SalesKanban from '@/components/SalesKanban';
import { Plus, Filter, Download } from 'lucide-react';
import { useTranslations } from 'next-intl';

// صفحة Server Component لجلب البيانات بسرعة الصاروخ
export default async function SalesPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  );

  // جلب الصفقات (الـ RLS سيضمن أن كل شخص يرى ما يخصه فقط)
  const { data: deals, error } = await supabase
    .from('deals')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      
      {/* Header & Quick Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-800">إدارة المبيعات (Pipeline)</h1>
          <p className="text-slate-500 text-sm mt-1">تتبع الصفقات، تحديث الحالات، وإغلاق المبيعات.</p>
        </div>
        
        <div className="flex gap-2">
          <button className="btn-secondary flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-bold transition">
            <Filter size={16} /> فلاتر متقدمة
          </button>
          <button className="btn-secondary flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-bold transition">
            <Download size={16} /> تصدير Excel
          </button>
          <button className="btn-primary flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md transition">
            <Plus size={16} /> صفقة جديدة
          </button>
        </div>
      </div>

      {/* Kanban Board Area */}
      <div className="mt-4">
        {deals && deals.length > 0 ? (
          <SalesKanban initialDeals={deals} />
        ) : (
          <div className="text-center p-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <h3 className="text-lg font-bold text-slate-600">لا توجد صفقات حتى الآن</h3>
            <p className="text-sm text-slate-400 mt-2">اضغط على "صفقة جديدة" للبدء في ملء مسار المبيعات.</p>
          </div>
        )}
      </div>
      
    </div>
  );
}