import { getLeads } from './actions'
import PipelineBoard from '@/components/leads/PipelineBoard'
import AddLeadButton from '@/components/leads/AddLeadButton'

// إجبار النظام على جلب البيانات الحية دائماً
export const dynamic = 'force-dynamic'

export default async function LeadsPage() {
  // جلب العملاء باستخدام المحرك الذكي الجديد (حسب الرتبة)
  const leads = await getLeads()

  return (
    <div className="p-8 space-y-8 min-h-screen bg-slate-50" dir="rtl">
      
      {/* الهيدر العلوي */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900">مسار المبيعات (Pipeline)</h1>
          <p className="text-sm font-bold text-slate-500 mt-1">تتبع رحلة العملاء وإدارة التفويضات الخاصة بفريقك</p>
        </div>
        
        {/* زر الإضافة الجديد (المضاد للرصاص) */}
        <AddLeadButton />
      </div>

      {/* لوحة السحب والإفلات */}
      <PipelineBoard initialLeads={leads} />
      
    </div>
  )
}