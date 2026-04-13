import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import PipelineBoard from '@/components/leads/PipelineBoard'
import AddLeadButton from '@/components/leads/AddLeadButton'

export const dynamic = 'force-dynamic'

export default async function LeadsPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  let leads: any[] = []
  let fetchError = null
  let exactErrorDetails = null

  try {
    // التعديل هنا: جلب العملاء مع تقاريرهم (Join)
    const { data, error } = await supabase
      .from('leads')
      .select('*, lead_reports(*)') 
      .order('updated_at', { ascending: false })
    
    if (error) {
      exactErrorDetails = error.message
      throw error
    }
    leads = data || []
  } catch (e: any) {
    fetchError = "تعذر جلب مسار العملاء المحتملين. تأكد من إعداد جدول leads."
    if (!exactErrorDetails) exactErrorDetails = e.message || "Unknown Error"
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-arabic">مسار المبيعات (Pipeline)</h1>
          <p className="text-sm text-slate-500 mt-1">متابعة العملاء المحتملين من "Fresh" حتى "Close"</p>
        </div>
        <AddLeadButton />
      </div>

      {fetchError ? (
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-10 text-center">
           <p className="text-red-600 font-bold mb-2">تنبيه النظام</p>
           <p className="text-sm text-slate-500 mb-4">{fetchError}</p>
           <code className="bg-red-50 text-red-800 px-4 py-2 rounded-lg text-xs font-mono inline-block text-left" dir="ltr">
             Technical Error: {exactErrorDetails}
           </code>
        </div>
      ) : (
        <PipelineBoard initialLeads={leads} />
      )}
    </div>
  )
}