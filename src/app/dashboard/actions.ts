'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function getDashboardStats() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  // 1. جلب إجمالي المبيعات (من الصفقات الناجحة)
  const { data: deals } = await supabase.from('deals').select('value').eq('status', 'won')
  const totalSales = deals?.reduce((sum, d) => sum + Number(d.value), 0) || 0

  // 2. إحصائيات العملاء المحتملين (Leads) لكل مرحلة
  const { data: leads } = await supabase.from('leads').select('status')
  const leadStats = {
    fresh: leads?.filter(l => l.status === 'fresh').length || 0,
    followup: leads?.filter(l => l.status === 'followup').length || 0,
    meeting: leads?.filter(l => l.status === 'meeting').length || 0,
    total: leads?.length || 0
  }

  // 3. حالة المخزون
  const { data: inventory } = await supabase.from('inventory').select('status')
  const invStats = {
    available: inventory?.filter(i => i.status === 'available').length || 0,
    sold: inventory?.filter(i => i.status === 'sold').length || 0
  }

  // 4. التنبيهات المتأخرة (AI Calendar)
  const now = new Date().toISOString()
  const { count: overdueCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .lt('next_followup_date', now)
    .not('status', 'in', '("win","lose")')

  return { totalSales, leadStats, invStats, overdueCount: overdueCount || 0 }
}