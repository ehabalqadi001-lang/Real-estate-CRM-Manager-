import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Kanban, List } from 'lucide-react'
import KanbanBoard from '@/components/deals/KanbanBoard'
import { updateDealStage } from './actions'

export const dynamic = 'force-dynamic'

export default async function DealsKanbanPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user?.id).single()
  const targetCompanyId = profile?.company_id || user?.id

  const { data: deals } = await supabase
    .from('deals')
    .select('id, title, stage, unit_value, buyer_name, compound')
    .eq('company_id', targetCompanyId)
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 space-y-4 bg-slate-50 min-h-screen" dir="rtl">
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Kanban size={20} className="text-purple-600" /> لوحة الصفقات — Kanban
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">اسحب الصفقات بين المراحل لتحديث حالتها</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/deals"
            className="flex items-center gap-2 border border-slate-200 text-slate-600 px-3 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">
            <List size={15} /> عرض قائمة
          </Link>
        </div>
      </div>

      <KanbanBoard
        initialDeals={deals ?? []}
        onStageChange={updateDealStage}
      />
    </div>
  )
}
